document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'http://localhost:8067'; // Updated to match local Uvicorn port

    // --- Selectors ---
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    const navItems = document.querySelectorAll('.nav-item');
    const tabViews = document.querySelectorAll('.tab-view');

    // Data tables body
    const prokerTableBody = document.getElementById('proker-table-body');
    const logbookTableBody = document.getElementById('logbook-table-body');
    const guestbookListContainer = document.getElementById('guestbook-list-container');
    const galleryTableBody = document.getElementById('gallery-table-body');

    // Modals
    const prokerModal = document.getElementById('proker-modal');
    const logbookModal = document.getElementById('logbook-modal');
    const galleryModal = document.getElementById('gallery-modal');

    // Forms
    const prokerForm = document.getElementById('proker-form');
    const logbookForm = document.getElementById('logbook-form');
    const galleryForm = document.getElementById('gallery-form');

    // Proker Form elements
    const prokerTypeSelect = document.getElementById('proker-type');
    const prokerOwnerInput = document.getElementById('proker-owner');
    const ownerGroup = document.getElementById('owner-group');
    const prokerDescTextarea = document.getElementById('proker-desc');
    const prokerDescPreview = document.getElementById('proker-desc-preview');

    // Logbook Form elements
    const logbookContentTextarea = document.getElementById('logbook-content');
    const logbookContentPreview = document.getElementById('logbook-content-preview');

    // Add buttons
    const newProkerBtn = document.getElementById('new-proker-btn');
    const newLogbookBtn = document.getElementById('new-logbook-btn');
    const newGalleryBtn = document.getElementById('new-gallery-btn');

    // Image upload inputs
    const prokerImagesInput = document.getElementById('proker-images');
    const prokerImagesPreview = document.getElementById('proker-images-preview');
    const logbookImagesInput = document.getElementById('logbook-images');
    const logbookImagesPreview = document.getElementById('logbook-images-preview');
    const galleryImageInput = document.getElementById('gallery-image');
    const galleryImagePreview = document.getElementById('gallery-image-preview');

    // --- State variables ---
    let token = localStorage.getItem('kkn_admin_token');
    let currentProkerImages = [];
    let currentLogbookImages = [];
    let currentGalleryImage = null;
    let currentBlogThumbnail = null;

    // --- Blog Selectors ---
    const blogTableBody = document.getElementById('blog-table-body');
    const blogModal = document.getElementById('blog-modal');
    const blogForm = document.getElementById('blog-form');
    const newBlogBtn = document.getElementById('new-blog-btn');
    const blogContentTextarea = document.getElementById('blog-content');
    const blogContentPreview = document.getElementById('blog-content-preview');
    const blogThumbnailInput = document.getElementById('blog-thumbnail');
    const blogThumbnailPreview = document.getElementById('blog-thumbnail-preview');

    // --- Authentication Helpers ---
    const setAuthHeader = (headers = {}) => {
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    const authenticatedFetch = async (url, options = {}) => {
        options.headers = setAuthHeader(options.headers || {});
        try {
            const response = await fetch(url, options);
            if (response.status === 401) {
                // Token expired or invalid
                handleLogout();
                showToast("Sesi habis. Silakan masuk kembali.", "error");
                throw new Error("Unauthorized");
            }
            return response;
        } catch (error) {
            console.error("API error:", error);
            throw error;
        }
    };

    const checkAuthStatus = async () => {
        if (!token) {
            showLogin();
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
                headers: setAuthHeader()
            });
            if (response.ok) {
                showDashboard();
            } else {
                handleLogout();
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            showLogin(); // Fallback to login if server is offline
        }
    };

    const showLogin = () => {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    };

    const showDashboard = () => {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        // Initial data load
        loadTabData('proker');
    };

    const handleLogout = () => {
        token = null;
        localStorage.removeItem('kkn_admin_token');
        showLogin();
    };

    // --- Login Form Handler ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('username').value.trim();
            const passwordInput = document.getElementById('password').value;

            try {
                const response = await fetch(`${API_BASE_URL}/api/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username: usernameInput, password: passwordInput })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.detail || "Gagal masuk");
                }

                const data = await response.json();
                token = data.access_token;
                localStorage.setItem('kkn_admin_token', token);

                showToast("Berhasil masuk!", "success");
                showDashboard();
                loginForm.reset();
            } catch (error) {
                console.error(error);
                showToast(error.message || "Username atau password salah", "error");
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // --- SPA Tab Management ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const tabName = item.getAttribute('data-tab');
            tabViews.forEach(view => {
                if (view.getAttribute('id') === `${tabName}-tab`) {
                    view.classList.remove('hidden');
                } else {
                    view.classList.add('hidden');
                }
            });

            loadTabData(tabName);
        });
    });

    const loadTabData = (tabName) => {
        if (tabName === 'dashboard') {
            loadDashboard();
        } else if (tabName === 'proker') {
            fetchProkers();
        } else if (tabName === 'logbook') {
            fetchLogbooks();
        } else if (tabName === 'gallery') {
            fetchGalleries();
        } else if (tabName === 'guestbook') {
            fetchGuestbookEntries();
        } else if (tabName === 'blog') {
            fetchBlogsAdmin();
        }
    };

    // --- Chart instances (stored so we can destroy & re-render on refresh) ---
    let chartProkerInstance = null;
    let chartLogbookInstance = null;

    // --- Dashboard Data Loader ---
    window.loadDashboard = async () => {
        try {
            // Fetch all needed data in parallel
            const [prokerRes, logbookRes, guestbookRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/proker`),
                fetch(`${API_BASE_URL}/api/logbook`),
                authenticatedFetch(`${API_BASE_URL}/api/admin/guestbook`)
            ]);

            const prokers = prokerRes.ok ? await prokerRes.json() : [];
            const logbooks = logbookRes.ok ? await logbookRes.json() : [];
            const guestbooks = guestbookRes.ok ? await guestbookRes.json() : [];

            // ── Stat Cards ──
            const selesai = prokers.filter(p => p.status === 'Selesai').length;
            const berjalan = prokers.filter(p => p.status === 'Sedang Berjalan').length;
            const belumMulai = prokers.filter(p => p.status === 'Belum Mulai').length;

            document.getElementById('dash-proker-selesai').textContent = selesai;
            document.getElementById('dash-proker-berjalan').textContent = berjalan;
            document.getElementById('dash-proker-total').textContent = prokers.length;
            document.getElementById('dash-logbook-total').textContent = logbooks.length;

            const approved = guestbooks.filter(g => g.is_approved).length;
            const pending = guestbooks.filter(g => !g.is_approved).length;
            document.getElementById('dash-tamu-approved').textContent = approved;
            document.getElementById('dash-tamu-pending').textContent = pending;

            // ── Donut Chart: Proker Status ──
            const donutCanvas = document.getElementById('chart-proker-donut');
            if (donutCanvas) {
                if (chartProkerInstance) chartProkerInstance.destroy();
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                chartProkerInstance = new Chart(donutCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: ['Selesai', 'Sedang Berjalan', 'Belum Mulai'],
                        datasets: [{
                            data: [selesai, berjalan, belumMulai],
                            backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c'],
                            borderColor: isDark ? '#1E1E2E' : '#fff',
                            borderWidth: 3,
                            hoverOffset: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { color: isDark ? '#CDD6F4' : '#2D3748', font: { family: 'Plus Jakarta Sans', size: 12 }, padding: 16 }
                            },
                            tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} Proker` } }
                        }
                    }
                });
            }

            // ── Line Chart: Logbook per week ──
            const lineCanvas = document.getElementById('chart-logbook-line');
            if (lineCanvas && logbooks.length > 0) {
                // Group entries by ISO week
                const weeklyMap = {};
                logbooks.forEach(entry => {
                    if (!entry.date) return;
                    const d = new Date(entry.date);
                    // Get Monday of that week
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                    const monday = new Date(d.setDate(diff));
                    const label = `${monday.getDate()}/${monday.getMonth() + 1}`;
                    weeklyMap[label] = (weeklyMap[label] || 0) + 1;
                });

                // Sort chronologically (by first occurrence order)
                const labels = Object.keys(weeklyMap);
                const values = labels.map(k => weeklyMap[k]);

                if (chartLogbookInstance) chartLogbookInstance.destroy();
                const isDark2 = document.documentElement.getAttribute('data-theme') === 'dark';
                chartLogbookInstance = new Chart(lineCanvas, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Jumlah Kegiatan',
                            data: values,
                            borderColor: '#3498db',
                            backgroundColor: 'rgba(52,152,219,0.12)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#3498db',
                            pointRadius: 5,
                            pointHoverRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                ticks: { color: isDark2 ? '#A6ADC8' : '#718096', font: { family: 'Plus Jakarta Sans' } },
                                grid: { color: isDark2 ? 'rgba(205,214,244,0.07)' : 'rgba(0,0,0,0.05)' }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: { color: isDark2 ? '#A6ADC8' : '#718096', font: { family: 'Plus Jakarta Sans' }, stepSize: 1 },
                                grid: { color: isDark2 ? 'rgba(205,214,244,0.07)' : 'rgba(0,0,0,0.05)' }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} catatan` } }
                        }
                    }
                });
            } else if (lineCanvas && logbooks.length === 0) {
                // No data yet
                if (chartLogbookInstance) chartLogbookInstance.destroy();
                const ctx = lineCanvas.getContext('2d');
                ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
                const isDark2 = document.documentElement.getAttribute('data-theme') === 'dark';
                ctx.fillStyle = isDark2 ? '#A6ADC8' : '#718096';
                ctx.font = '14px Plus Jakarta Sans';
                ctx.textAlign = 'center';
                ctx.fillText('Belum ada data logbook.', lineCanvas.width / 2, lineCanvas.height / 2);
            }

        } catch (err) {
            console.error('Dashboard load error:', err);
            showToast('Gagal memuat data dashboard', 'error');
        }
    };

    // --- Helper HTML escaping to prevent XSS ---
    const escapeHTML = (str) => {
        if (!str) return '';
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    };

    // --- Image Upload Helpers ---
    const uploadImageFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers: setAuthHeader({}),
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || "Gagal mengunggah gambar");
        }

        return await response.json();
    };

    const handleImageUpload = async (inputElement, currentList, previewElementId) => {
        const files = inputElement.files;
        if (!files.length) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) {
                showToast("File harus berupa gambar", "error");
                continue;
            }
            try {
                const res = await uploadImageFile(file);
                currentList.push(res.url);
                showToast(`Gambar ${file.name} berhasil diunggah`, "success");
            } catch (err) {
                console.error(err);
                showToast(`Gagal mengunggah ${file.name}: ${err.message}`, "error");
            }
        }
        inputElement.value = '';
        renderImagePreviews(currentList, previewElementId);
    };

    const renderImagePreviews = (list, previewElementId) => {
        const previewEl = document.getElementById(previewElementId);
        if (!previewEl) return;
        previewEl.innerHTML = '';

        list.forEach((url, index) => {
            const container = document.createElement('div');
            container.className = 'thumbnail-container';

            const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

            container.innerHTML = `
                <img src="${fullUrl}" alt="Preview">
                <button type="button" class="thumbnail-remove">&times;</button>
            `;

            container.querySelector('.thumbnail-remove').addEventListener('click', () => {
                list.splice(index, 1);
                renderImagePreviews(list, previewElementId);
            });

            previewEl.appendChild(container);
        });
    };

    if (prokerImagesInput) {
        prokerImagesInput.addEventListener('change', () => {
            handleImageUpload(prokerImagesInput, currentProkerImages, 'proker-images-preview');
        });
    }
    if (logbookImagesInput) {
        logbookImagesInput.addEventListener('change', () => handleImageUpload(logbookImagesInput, currentLogbookImages, 'logbook-images-preview'));
    }

    if (galleryImageInput) {
        galleryImageInput.addEventListener('change', async () => {
            const file = galleryImageInput.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showToast("File harus berupa gambar", "error");
                return;
            }
            try {
                const res = await uploadImageFile(file);
                currentGalleryImage = res.url;
                renderSingleImagePreview(currentGalleryImage, 'gallery-image-preview');
                showToast("Gambar berhasil diunggah", "success");
            } catch (err) {
                console.error(err);
                showToast("Gagal mengunggah gambar", "error");
            }
            galleryImageInput.value = '';
        });
    }

    const renderSingleImagePreview = (url, previewElementId) => {
        const previewEl = document.getElementById(previewElementId);
        if (!previewEl) return;
        previewEl.innerHTML = '';
        if (url) {
            const wrapper = document.createElement('div');
            wrapper.className = 'thumbnail-container';
            const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
            wrapper.innerHTML = `
                <img src="${fullUrl}" alt="Preview">
                <button type="button" class="btn-remove" onclick="removeSingleImage()">×</button>
            `;
            previewEl.appendChild(wrapper);
        }
    };

    window.removeSingleImage = () => {
        currentGalleryImage = null;
        renderSingleImagePreview(null, 'gallery-image-preview');
    };

    // --- 1. PROKER CRUDS ---
    const fetchProkers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/proker`);
            const data = await response.json();
            renderProkersTable(data);
        } catch (error) {
            showToast("Gagal mengambil data program kerja", "error");
        }
    };

    const renderProkersTable = (prokers) => {
        if (!prokerTableBody) return;
        prokerTableBody.innerHTML = '';
        if (prokers.length === 0) {
            prokerTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--color-text-muted);">Belum ada program kerja. Klik 'Tambah Proker' untuk membuat baru.</td></tr>`;
            return;
        }

        prokers.forEach(proker => {
            const tr = document.createElement('tr');

            // Status badges
            let badgeClass = 'badge-warning';
            if (proker.status === 'Selesai') badgeClass = 'badge-success';
            if (proker.status === 'Sedang Berjalan') badgeClass = 'badge-info';

            tr.innerHTML = `
                <td><span class="badge ${proker.type === 'Proker Bersama' ? 'badge-success' : 'badge-info'}">${proker.type}</span></td>
                <td><strong>${escapeHTML(proker.owner_name) || '-'}</strong></td>
                <td>${escapeHTML(proker.title)}</td>
                <td><span class="badge ${badgeClass}">${proker.status}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-edit" title="Edit Proker" onclick="openEditProkerModal(${JSON.stringify(proker).replace(/"/g, '&quot;')})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-icon btn-delete" title="Hapus Proker" onclick="deleteProker(${proker.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            prokerTableBody.appendChild(tr);
        });
    };

    // Toggle owner input field visibility based on type selection
    if (prokerTypeSelect) {
        prokerTypeSelect.addEventListener('change', () => {
            if (prokerTypeSelect.value === 'Proker Individu') {
                ownerGroup.classList.remove('hidden');
                prokerOwnerInput.setAttribute('required', 'true');
            } else {
                ownerGroup.classList.add('hidden');
                prokerOwnerInput.removeAttribute('required');
                prokerOwnerInput.value = '';
            }
        });
    }

    // Markdown previews
    if (prokerDescTextarea && prokerDescPreview) {
        prokerDescTextarea.addEventListener('input', () => {
            const rawText = prokerDescTextarea.value;
            prokerDescPreview.innerHTML = rawText ? marked.parse(rawText) : '<p style="color: var(--color-text-muted); font-style: italic;">Preview akan tampil di sini...</p>';
        });
    }

    // Open Proker Modal (Create)
    if (newProkerBtn) {
        newProkerBtn.addEventListener('click', () => {
            document.getElementById('proker-modal-title').textContent = "Tambah Program Kerja";
            document.getElementById('edit-proker-id').value = "";
            prokerForm.reset();
            ownerGroup.classList.add('hidden');
            prokerOwnerInput.removeAttribute('required');
            prokerDescPreview.innerHTML = '<p style="color: var(--color-text-muted); font-style: italic;">Preview akan tampil di sini...</p>';
            currentProkerImages = [];
            renderImagePreviews(currentProkerImages, 'proker-images-preview');
            openModal('proker-modal');
        });
    }

    // Handle Proker Modal Submit (Create & Update)
    if (prokerForm) {
        prokerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-proker-id').value;
            const type = prokerTypeSelect.value;
            const owner_name = type === 'Proker Individu' ? prokerOwnerInput.value.trim() : null;
            const title = document.getElementById('proker-title').value.trim();
            const statusVal = document.getElementById('proker-status').value;
            const description_markdown = prokerDescTextarea.value.trim();

            const payload = { type, owner_name, title, status: statusVal, description_markdown, image_urls: currentProkerImages };

            const isEdit = id !== "";
            const url = isEdit ? `${API_BASE_URL}/api/proker/${id}` : `${API_BASE_URL}/api/proker`;
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await authenticatedFetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showToast(isEdit ? "Proker berhasil diperbarui!" : "Proker berhasil ditambahkan!", "success");
                    closeModal('proker-modal');
                    fetchProkers();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Gagal menyimpan proker");
                }
            } catch (error) {
                console.error(error);
                if (error.message !== "Unauthorized") {
                    showToast(error.message, "error");
                }
            }
        });
    }

    // Global scopes for inline onclick attributes
    window.openEditProkerModal = (proker) => {
        document.getElementById('proker-modal-title').textContent = "Edit Program Kerja";
        document.getElementById('edit-proker-id').value = proker.id;
        prokerTypeSelect.value = proker.type;

        if (proker.type === 'Proker Individu') {
            ownerGroup.classList.remove('hidden');
            prokerOwnerInput.setAttribute('required', 'true');
            prokerOwnerInput.value = proker.owner_name || '';
        } else {
            ownerGroup.classList.add('hidden');
            prokerOwnerInput.removeAttribute('required');
            prokerOwnerInput.value = '';
        }

        document.getElementById('proker-title').value = proker.title;
        document.getElementById('proker-status').value = proker.status;
        prokerDescTextarea.value = proker.description_markdown;
        prokerDescPreview.innerHTML = marked.parse(proker.description_markdown);

        currentProkerImages = [...(proker.image_urls || [])];
        renderImagePreviews(currentProkerImages, 'proker-images-preview');

        openModal('proker-modal');
    };

    window.deleteProker = async (id) => {
        if (!confirm("Apakah Anda yakin ingin menghapus program kerja ini?")) return;
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/proker/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                showToast("Proker berhasil dihapus!", "success");
                fetchProkers();
            } else {
                throw new Error("Gagal menghapus proker");
            }
        } catch (error) {
            console.error(error);
            if (error.message !== "Unauthorized") {
                showToast(error.message, "error");
            }
        }
    };


    // --- 2. LOGBOOK CRUDS ---
    const fetchLogbooks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/logbook`);
            const data = await response.json();
            renderLogbookTable(data);
        } catch (error) {
            showToast("Gagal mengambil data logbook", "error");
        }
    };

    const renderLogbookTable = (logbooks) => {
        if (!logbookTableBody) return;
        logbookTableBody.innerHTML = '';
        if (logbooks.length === 0) {
            logbookTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--color-text-muted);">Belum ada catatan logbook. Klik 'Tambah Logbook' untuk membuat baru.</td></tr>`;
            return;
        }

        logbooks.forEach(entry => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${entry.date}</strong></td>
                <td><span class="badge ${entry.phase === 'Pra-KKN' ? 'badge-warning' : 'badge-success'}">${entry.phase}</span></td>
                <td>${escapeHTML(entry.title)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-edit" title="Edit Logbook" onclick="openEditLogbookModal(${JSON.stringify(entry).replace(/"/g, '&quot;')})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-icon btn-delete" title="Hapus Logbook" onclick="deleteLogbook(${entry.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            logbookTableBody.appendChild(tr);
        });
    };

    if (logbookContentTextarea && logbookContentPreview) {
        logbookContentTextarea.addEventListener('input', () => {
            const rawText = logbookContentTextarea.value;
            logbookContentPreview.innerHTML = rawText ? marked.parse(rawText) : '<p style="color: var(--color-text-muted); font-style: italic;">Preview akan tampil di sini...</p>';
        });
    }

    if (newLogbookBtn) {
        newLogbookBtn.addEventListener('click', () => {
            document.getElementById('logbook-modal-title').textContent = "Tambah Catatan Logbook";
            document.getElementById('edit-logbook-id').value = "";
            logbookForm.reset();
            // Default to today's date
            document.getElementById('logbook-date').value = new Date().toISOString().split('T')[0];
            logbookContentPreview.innerHTML = '<p style="color: var(--color-text-muted); font-style: italic;">Preview akan tampil di sini...</p>';
            currentLogbookImages = [];
            renderImagePreviews(currentLogbookImages, 'logbook-images-preview');
            openModal('logbook-modal');
        });
    }

    const exportLogbookBtn = document.getElementById('export-logbook-btn');
    if (exportLogbookBtn) {
        exportLogbookBtn.addEventListener('click', async () => {
            try {
                showToast("Sedang memproses PDF...", "success");
                const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/export/logbook-pdf`);
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = "Laporan_Logbook_KKN.pdf";
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                    showToast("PDF berhasil diunduh!", "success");
                } else {
                    throw new Error("Gagal mengunduh laporan PDF");
                }
            } catch (error) {
                console.error(error);
                if (error.message !== "Unauthorized") {
                    showToast(error.message, "error");
                }
            }
        });
    }

    if (logbookForm) {
        logbookForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-logbook-id').value;
            const date = document.getElementById('logbook-date').value;
            const phase = document.getElementById('logbook-phase').value;
            const title = document.getElementById('logbook-title').value.trim();
            const content_markdown = logbookContentTextarea.value.trim();

            const payload = { date, phase, title, content_markdown, image_urls: currentLogbookImages };

            const isEdit = id !== "";
            const url = isEdit ? `${API_BASE_URL}/api/logbook/${id}` : `${API_BASE_URL}/api/logbook`;
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await authenticatedFetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showToast(isEdit ? "Logbook berhasil diperbarui!" : "Logbook berhasil ditambahkan!", "success");
                    closeModal('logbook-modal');
                    fetchLogbooks();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Gagal menyimpan logbook");
                }
            } catch (error) {
                console.error(error);
                if (error.message !== "Unauthorized") {
                    showToast(error.message, "error");
                }
            }
        });
    }

    window.openEditLogbookModal = (entry) => {
        document.getElementById('logbook-modal-title').textContent = "Edit Catatan Logbook";
        document.getElementById('edit-logbook-id').value = entry.id;
        document.getElementById('logbook-date').value = entry.date;
        document.getElementById('logbook-phase').value = entry.phase;
        document.getElementById('logbook-title').value = entry.title;
        logbookContentTextarea.value = entry.content_markdown;
        logbookContentPreview.innerHTML = marked.parse(entry.content_markdown);

        currentLogbookImages = [...(entry.image_urls || [])];
        renderImagePreviews(currentLogbookImages, 'logbook-images-preview');

        openModal('logbook-modal');
    };

    window.deleteLogbook = async (id) => {
        if (!confirm("Apakah Anda yakin ingin menghapus catatan logbook ini?")) return;
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/logbook/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                showToast("Logbook berhasil dihapus!", "success");
                fetchLogbooks();
            } else {
                throw new Error("Gagal menghapus logbook");
            }
        } catch (error) {
            console.error(error);
            if (error.message !== "Unauthorized") {
                showToast(error.message, "error");
            }
        }
    };

    // --- 3. GALLERY MANAGEMENT ---
    const fetchGalleries = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/gallery`);
            const data = await response.json();
            renderGalleryList(data);
        } catch (error) {
            console.error(error);
            if (error.message !== "Unauthorized") {
                galleryTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--color-danger);">Gagal memuat galeri.</td></tr>`;
            }
        }
    };

    const renderGalleryList = (galleries) => {
        galleryTableBody.innerHTML = '';
        if (galleries.length === 0) {
            galleryTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--color-text-muted);">Belum ada foto galeri.</td></tr>`;
            return;
        }

        galleries.forEach(gal => {
            const tr = document.createElement('tr');
            const fullUrl = gal.image_url.startsWith('http') ? gal.image_url : `${API_BASE_URL}${gal.image_url}`;
            tr.innerHTML = `
                <td>
                    <img src="${fullUrl}" alt="Gallery Thumbnail" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(108, 8, 32, 0.1);">
                </td>
                <td>
                    <strong>${escapeHTML(gal.title)}</strong><br>
                    <span style="font-size: 0.8rem; color: var(--color-text-muted);">${escapeHTML(gal.description || '')}</span>
                </td>
                <td>${gal.date}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-edit" onclick='openEditGalleryModal(${JSON.stringify(gal)})' title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-delete" onclick="deleteGallery(${gal.id})" title="Hapus">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            galleryTableBody.appendChild(tr);
        });
    };

    if (newGalleryBtn) {
        newGalleryBtn.addEventListener('click', () => {
            document.getElementById('gallery-modal-title').textContent = "Tambah Foto Galeri";
            document.getElementById('edit-gallery-id').value = "";
            galleryForm.reset();
            document.getElementById('gallery-date').value = new Date().toISOString().split('T')[0];
            currentGalleryImage = null;
            renderSingleImagePreview(null, 'gallery-image-preview');
            openModal('gallery-modal');
        });
    }

    if (galleryForm) {
        galleryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-gallery-id').value;
            const title = document.getElementById('gallery-title').value.trim();
            const date = document.getElementById('gallery-date').value;
            const description = document.getElementById('gallery-desc').value.trim();

            if (!currentGalleryImage) {
                showToast("Silakan unggah foto terlebih dahulu!", "warning");
                return;
            }

            const payload = { title, date, description, image_url: currentGalleryImage };
            const isEdit = id !== "";
            const url = isEdit ? `${API_BASE_URL}/api/gallery/${id}` : `${API_BASE_URL}/api/gallery`;
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await authenticatedFetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showToast(isEdit ? "Foto berhasil diperbarui!" : "Foto berhasil ditambahkan!", "success");
                    closeModal('gallery-modal');
                    fetchGalleries();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Gagal menyimpan foto");
                }
            } catch (error) {
                console.error(error);
                if (error.message !== "Unauthorized") {
                    showToast(error.message, "error");
                }
            }
        });
    }

    window.openEditGalleryModal = (gal) => {
        document.getElementById('gallery-modal-title').textContent = "Edit Foto Galeri";
        document.getElementById('edit-gallery-id').value = gal.id;
        document.getElementById('gallery-title').value = gal.title;
        document.getElementById('gallery-date').value = gal.date;
        document.getElementById('gallery-desc').value = gal.description || '';

        currentGalleryImage = gal.image_url;
        renderSingleImagePreview(currentGalleryImage, 'gallery-image-preview');

        openModal('gallery-modal');
    };

    window.deleteGallery = async (id) => {
        if (!confirm("Apakah Anda yakin ingin menghapus foto ini?")) return;
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/gallery/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                showToast("Foto berhasil dihapus!", "success");
                fetchGalleries();
            } else {
                throw new Error("Gagal menghapus foto");
            }
        } catch (error) {
            console.error(error);
            if (error.message !== "Unauthorized") {
                showToast(error.message, "error");
            }
        }
    };


    // --- 3. GUESTBOOK MODERATION ---
    const fetchGuestbookEntries = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/guestbook`);
            const data = await response.json();
            renderGuestbookList(data);
        } catch (error) {
            console.error(error);
            if (error.message !== "Unauthorized") {
                showToast("Gagal mengambil data buku tamu", "error");
            }
        }
    };

    const renderGuestbookList = (entries) => {
        if (!guestbookListContainer) return;
        guestbookListContainer.innerHTML = '';

        if (entries.length === 0) {
            guestbookListContainer.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 40px;">Belum ada kiriman pesan di buku tamu.</div>`;
            return;
        }

        entries.forEach(entry => {
            const card = document.createElement('div');
            card.className = `moderation-card ${entry.is_approved ? 'approved' : ''}`;

            const badgeText = entry.is_approved ? 'Disetujui' : 'Menunggu Moderasi';
            const badgeClass = entry.is_approved ? 'badge-success' : 'badge-warning';

            card.innerHTML = `
                <div class="moderation-card-body">
                    <h5>${escapeHTML(entry.name)} <span class="badge ${badgeClass}">${badgeText}</span></h5>
                    <div class="moderation-meta"><i class="fa-solid fa-users"></i> ${escapeHTML(entry.role)} • <i class="fa-solid fa-clock"></i> ${entry.date}</div>
                    <p class="moderation-message">${escapeHTML(entry.message)}</p>
                </div>
                <div class="action-btns">
                    ${!entry.is_approved ? `
                    <button class="btn-icon btn-approve" title="Setujui Pesan" onclick="approveGuestbookEntry(${entry.id})">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    ` : ''}
                    <button class="btn-icon btn-delete" title="Hapus Pesan" onclick="deleteGuestbookEntry(${entry.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            guestbookListContainer.appendChild(card);
        });
    };

    window.approveGuestbookEntry = async (id) => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/guestbook/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_approved: true })
            });

            if (response.ok) {
                showToast("Pesan berhasil disetujui!", "success");
                fetchGuestbookEntries();
            } else {
                throw new Error("Gagal menyetujui pesan");
            }
        } catch (error) {
            console.error(error);
            if (error.message !== "Unauthorized") {
                showToast(error.message, "error");
            }
        }
    };

    window.deleteGuestbookEntry = async (id) => {
        if (!confirm("Apakah Anda yakin ingin menghapus/menolak pesan ini?")) return;
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/guestbook/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast("Pesan berhasil dihapus!", "success");
                fetchGuestbookEntries();
            } else {
                throw new Error("Gagal menghapus pesan");
            }
        } catch (error) {
            console.error(error);
            if (error.message !== "Unauthorized") {
                showToast(error.message, "error");
            }
        }
    };


    // --- 5. BLOG CRUDS ---
    const fetchBlogsAdmin = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/blogs`);
            const data = await response.json();
            renderBlogTable(data);
        } catch (error) {
            showToast("Gagal mengambil data blog", "error");
        }
    };

    const renderBlogTable = (blogs) => {
        if (!blogTableBody) return;
        blogTableBody.innerHTML = '';
        if (blogs.length === 0) {
            blogTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: var(--color-text-muted);">Belum ada artikel. Klik 'Tulis Artikel' untuk membuat baru.</td></tr>`;
            return;
        }

        blogs.forEach(entry => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${entry.date}</strong></td>
                <td>${escapeHTML(entry.title)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-edit" title="Edit Artikel" onclick="openEditBlogModal(${JSON.stringify(entry).replace(/"/g, '&quot;')})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-icon btn-delete" title="Hapus Artikel" onclick="deleteBlog(${entry.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            blogTableBody.appendChild(tr);
        });
    };

    if (blogContentTextarea && blogContentPreview) {
        blogContentTextarea.addEventListener('input', () => {
            const rawText = blogContentTextarea.value;
            blogContentPreview.innerHTML = rawText ? marked.parse(rawText) : '<p style="color: var(--color-text-muted); font-style: italic;">Preview artikel akan tampil di sini...</p>';
        });
    }

    if (newBlogBtn) {
        newBlogBtn.addEventListener('click', () => {
            document.getElementById('blog-modal-title').textContent = "Tulis Artikel Baru";
            document.getElementById('edit-blog-id').value = "";
            blogForm.reset();
            document.getElementById('blog-date').value = new Date().toISOString().split('T')[0];
            blogContentPreview.innerHTML = '<p style="color: var(--color-text-muted); font-style: italic;">Preview artikel akan tampil di sini...</p>';
            currentBlogThumbnail = null;
            if (blogThumbnailPreview) blogThumbnailPreview.innerHTML = '';
            openModal('blog-modal');
        });
    }

    if (blogThumbnailInput) {
        blogThumbnailInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/api/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                currentBlogThumbnail = data.url;
                blogThumbnailPreview.innerHTML = `<img src="${API_BASE_URL}${data.url}" style="width: 150px; border-radius: 8px;">`;
            } catch (error) {
                showToast("Gagal mengunggah foto sampul", "error");
            }
        });
    }

    if (blogForm) {
        blogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-blog-id').value;
            const title = document.getElementById('blog-title').value.trim();
            const date = document.getElementById('blog-date').value;
            const content_markdown = blogContentTextarea.value.trim();

            const payload = { title, date, content_markdown, thumbnail_url: currentBlogThumbnail };

            const isEdit = id !== "";
            const url = isEdit ? `${API_BASE_URL}/api/blogs/${id}` : `${API_BASE_URL}/api/blogs`;
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await authenticatedFetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showToast(isEdit ? "Artikel berhasil diperbarui!" : "Artikel berhasil diterbitkan!", "success");
                    closeModal('blog-modal');
                    fetchBlogsAdmin();
                } else {
                    throw new Error("Gagal menyimpan artikel");
                }
            } catch (error) {
                showToast(error.message, "error");
            }
        });
    }

    window.openEditBlogModal = (entry) => {
        document.getElementById('blog-modal-title').textContent = "Edit Artikel";
        document.getElementById('edit-blog-id').value = entry.id;
        document.getElementById('blog-title').value = entry.title;
        document.getElementById('blog-date').value = entry.date;

        blogContentTextarea.value = entry.content_markdown;
        blogContentPreview.innerHTML = marked.parse(entry.content_markdown);

        currentBlogThumbnail = entry.thumbnail_url;
        if (blogThumbnailPreview) {
            blogThumbnailPreview.innerHTML = currentBlogThumbnail
                ? `<img src="${currentBlogThumbnail.startsWith('http') ? currentBlogThumbnail : API_BASE_URL + currentBlogThumbnail}" style="width: 150px; border-radius: 8px;">`
                : '';
        }

        openModal('blog-modal');
    };


    window.deleteBlog = async (id) => {
        if (!confirm("Hapus artikel ini secara permanen?")) return;
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/blogs/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                showToast("Artikel berhasil dihapus!", "success");
                fetchBlogsAdmin();
            } else {
                throw new Error("Gagal menghapus artikel");
            }
        } catch (error) {
            showToast(error.message, "error");
        }
    };

    window.insertMarkdownBlog = (prefix, suffix) => {
        if (!blogContentTextarea) return;
        const start = blogContentTextarea.selectionStart;
        const end = blogContentTextarea.selectionEnd;
        const text = blogContentTextarea.value;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        blogContentTextarea.value = before + prefix + selected + suffix + after;
        blogContentTextarea.focus();
        blogContentTextarea.selectionStart = start + prefix.length;
        blogContentTextarea.selectionEnd = end + prefix.length;

        blogContentTextarea.dispatchEvent(new Event('input'));
    };

    // --- Global Modal Helpers ---
    window.openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    };

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    };


    // --- Toast Notifications Helpers ---
    const showToast = (message, type = "success") => {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.marginBottom = '10px';
        toast.style.color = '#FFFFFF';
        toast.style.fontWeight = '600';
        toast.style.fontSize = '0.95rem';
        toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.15)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '10px';
        toast.style.animation = 'toastFadeIn 0.3s ease';

        if (type === 'success') {
            toast.style.backgroundColor = 'var(--color-success)';
            toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
        } else {
            toast.style.backgroundColor = 'var(--color-danger)';
            toast.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${message}`;
        }

        toastContainer.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    };

    // Add Keyframe Animations for Toasts to Head stylesheet dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes toastFadeIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes toastFadeOut {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(20px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // --- Admin Dark Mode Toggle ---
    const adminThemeToggle = document.getElementById('admin-theme-toggle');
    const htmlEl = document.documentElement;

    // Update the button icon & text based on current theme
    const updateToggleUI = () => {
        if (!adminThemeToggle) return;
        const isDark = htmlEl.getAttribute('data-theme') === 'dark';
        adminThemeToggle.innerHTML = isDark
            ? '<i class="fa-solid fa-sun"></i><span>Mode Terang</span>'
            : '<i class="fa-solid fa-moon"></i><span>Mode Gelap</span>';
    };

    // Sync UI with saved theme state (called on load & after login)
    const syncTheme = () => {
        const saved = localStorage.getItem('kkn-theme');
        if (saved === 'dark') {
            htmlEl.setAttribute('data-theme', 'dark');
        } else {
            htmlEl.removeAttribute('data-theme');
        }
        updateToggleUI();
    };

    // Run once on load
    syncTheme();

    // Toggle handler
    if (adminThemeToggle) {
        adminThemeToggle.addEventListener('click', () => {
            const isDark = htmlEl.getAttribute('data-theme') === 'dark';
            if (isDark) {
                htmlEl.removeAttribute('data-theme');
                localStorage.setItem('kkn-theme', 'light');
            } else {
                htmlEl.setAttribute('data-theme', 'dark');
                localStorage.setItem('kkn-theme', 'dark');
            }
            updateToggleUI();
        });
    }

    // Expose syncTheme so showDashboard can call it after login
    window._syncAdminTheme = syncTheme;

    // Check startup login status
    checkAuthStatus();
});




