document.addEventListener('DOMContentLoaded', () => {

    // --- 0. Preloader ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 150);
    }

    // --- 0.5 Language Toggle System ---
    const langToggleBtn = document.getElementById('lang-toggle');
    const defaultLang = 'id';
    let currentLang = localStorage.getItem('kkn-lang') || defaultLang;

    const applyLanguage = (lang) => {
        if (!window.KKN_LANG || !window.KKN_LANG[lang]) return;
        
        const dictionary = window.KKN_LANG[lang];

        // Update Text Elements
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (dictionary[key]) {
                el.innerHTML = dictionary[key];
            }
        });

        // Update Placeholders
        document.querySelectorAll('[data-lang-ph]').forEach(el => {
            const key = el.getAttribute('data-lang-ph');
            if (dictionary[key]) {
                el.setAttribute('placeholder', dictionary[key]);
            }
        });

        // Update Button UI
        if (langToggleBtn) {
            if (lang === 'en') {
                langToggleBtn.innerHTML = '<span style="opacity: 0.5; font-weight: 400;">ID | </span> EN';
            } else {
                langToggleBtn.innerHTML = 'ID <span style="opacity: 0.5; margin: 0 4px; font-weight: 400;">| EN</span>';
            }
        }
    };

    // Apply saved language on load
    applyLanguage(currentLang);

    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            currentLang = currentLang === 'id' ? 'en' : 'id';
            localStorage.setItem('kkn-lang', currentLang);
            applyLanguage(currentLang);
        });
    }

    // --- 1. Mobile Menu Toggler ---
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
            const icon = mobileToggle.querySelector('i');
            if (navMenu.classList.contains('show')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });

        // Close mobile menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('show');
                const icon = mobileToggle.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            });
        });
    }

    // --- 2. Hash-Based SPA Routing ---
    const pageSections = document.querySelectorAll('.page-section');

    const handleRouting = () => {
        let currentHash = window.location.hash;
        if (!currentHash || currentHash === '#') {
            currentHash = '#beranda';
        }

        // Hide all page sections, show active one
        pageSections.forEach(section => {
            if (`#${section.getAttribute('id')}` === currentHash) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Highlight active navigation link in header
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentHash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Scroll to top of the page on route change
        window.scrollTo({
            top: 0,
            behavior: 'instant'
        });
    };

    window.addEventListener('hashchange', handleRouting);
    // Execute routing on page load
    handleRouting();

    // --- 3. API Base URL and Data Loading ---
    const API_BASE_URL = 'http://localhost:8000'; // Updated to match local Uvicorn port

    const prokerGridContainer = document.getElementById('proker-grid-container');
    const filterButtons = document.querySelectorAll('.filter-btn');
    let prokersData = [];

    const fetchProkers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/proker`);
            if (!response.ok) throw new Error('Gagal mengambil data program kerja');
            prokersData = await response.json();
            renderProkers('all');
        } catch (error) {
            console.error(error);
            if (prokerGridContainer) {
                prokerGridContainer.innerHTML = `<div class="error-msg" style="color: var(--color-primary); font-weight: 600; text-align: center; padding: 20px; width: 100%;">Gagal memuat Program Kerja. Pastikan server backend aktif.</div>`;
            }
        }
    };

    const renderProkers = (filter) => {
        if (!prokerGridContainer) return;
        prokerGridContainer.innerHTML = '';

        const filteredProkers = prokersData.filter(proker => {
            if (filter === 'all') return true;
            return proker.type === filter;
        });

        if (filteredProkers.length === 0) {
            prokerGridContainer.innerHTML = `<div class="empty-msg" style="text-align: center; padding: 40px; color: var(--color-text-muted); width: 100%;">Belum ada program kerja untuk kategori ini.</div>`;
            return;
        }

        filteredProkers.forEach(proker => {
            const prokerCard = document.createElement('div');
            prokerCard.className = 'proker-card';
            prokerCard.setAttribute('data-category', proker.type);
            prokerCard.style.cursor = 'pointer';

            // Determine badge class for status
            let statusClass = 'status-planned';
            let statusIcon = 'fa-hourglass-start';
            if (proker.status === 'Selesai') {
                statusClass = 'status-completed';
                statusIcon = 'fa-circle-check';
            } else if (proker.status === 'Sedang Berjalan') {
                statusClass = 'status-ongoing';
                statusIcon = 'fa-spinner fa-spin';
            }

            // Determine background and icon color based on category/owner
            let iconBoxClass = proker.type === 'Proker Bersama' ? 'bg-maroon' : 'bg-blue';
            let icon = proker.type === 'Proker Bersama' ? 'fa-people-group' : 'fa-user-gear';

            // Parse description using marked if available
            const descHtml = typeof marked !== 'undefined' ? marked.parse(proker.description_markdown) : proker.description_markdown;

            prokerCard.innerHTML = `
                <div class="proker-icon-box ${iconBoxClass}"><i class="fa-solid ${icon}"></i></div>
                <div class="proker-body">
                    <span class="proker-tag">${proker.type} ${proker.owner_name ? `• ${proker.owner_name}` : ''}</span>
                    <h3 class="proker-title">${escapeHTML(proker.title)}</h3>
                    <div class="proker-desc">${descHtml}</div>
                    <div class="proker-footer">
                        <span class="proker-status ${statusClass}"><i class="fa-solid ${statusIcon}"></i> ${proker.status}</span>
                    </div>
                </div>
            `;

            prokerCard.addEventListener('click', () => {
                openDetailsModal(proker, 'Proker');
            });

            prokerGridContainer.appendChild(prokerCard);
        });
    };

    // Filter button click handler
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filterValue = button.getAttribute('data-filter');
            renderProkers(filterValue);
        });
    });

    // --- Logbook Timeline Fetching & Rendering ---
    const logbookTimelineContainer = document.getElementById('logbook-timeline-container');
    const logbookFilterButtons = document.querySelectorAll('.logbook-filter-btn');
    let logbookData = [];

    const fetchLogbook = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/logbook`);
            if (!response.ok) throw new Error('Gagal mengambil data logbook');
            logbookData = await response.json();
            renderLogbook('all');
        } catch (error) {
            console.error(error);
            if (logbookTimelineContainer) {
                logbookTimelineContainer.innerHTML = `<div class="error-msg" style="color: var(--color-primary); font-weight: 600; text-align: center; padding: 20px; width: 100%;">Gagal memuat Logbook. Pastikan server backend aktif.</div>`;
            }
        }
    };

    const renderLogbook = (filter) => {
        if (!logbookTimelineContainer) return;
        logbookTimelineContainer.innerHTML = '';

        const filteredLogbook = logbookData.filter(entry => {
            if (filter === 'all') return true;
            return entry.phase === filter;
        });

        if (filteredLogbook.length === 0) {
            logbookTimelineContainer.innerHTML = `<div class="empty-msg" style="text-align: center; padding: 40px; color: var(--color-text-muted); width: 100%;">Belum ada catatan logbook untuk fase ini.</div>`;
            return;
        }

        filteredLogbook.forEach(entry => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';

            // Phase badge styling
            let phaseIcon = entry.phase === 'Pra-KKN' ? 'fa-clipboard-list' : 'fa-person-digging';

            // Format YYYY-MM-DD to Indonesian date
            const dateObj = new Date(entry.date);
            const formattedDate = isNaN(dateObj.getTime()) ? entry.date : dateObj.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            const contentHtml = typeof marked !== 'undefined' ? marked.parse(entry.content_markdown) : entry.content_markdown;

            timelineItem.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-date">${formattedDate}</div>
                <div class="timeline-content" style="cursor: pointer;">
                    <h3>${escapeHTML(entry.title)}</h3>
                    <div class="timeline-text">${contentHtml}</div>
                    <span class="timeline-badge"><i class="fa-solid ${phaseIcon}"></i> ${entry.phase}</span>
                </div>
            `;

            timelineItem.querySelector('.timeline-content').addEventListener('click', () => {
                openDetailsModal(entry, 'Logbook');
            });

            logbookTimelineContainer.appendChild(timelineItem);
        });
    };

    // Filter button click handler for logbook
    logbookFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            logbookFilterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
                btn.style.color = 'var(--color-primary)';
            });
            button.classList.add('active');
            button.style.background = 'var(--color-primary)';
            button.style.color = 'var(--color-white)';
            const filterValue = button.getAttribute('data-filter');
            renderLogbook(filterValue);
        });
    });

    // Style active button initially
    const activeLogbookBtn = document.querySelector('.logbook-filter-btn.active');
    if (activeLogbookBtn) {
        activeLogbookBtn.style.background = 'var(--color-primary)';
        activeLogbookBtn.style.color = 'var(--color-white)';
    }

    // --- 4. Interactive Team Photo Section ---
    const teamMembers = {
        'laksa': {
            name: "Laksa",
            shortName: "Laksa",
            shortRole: "anggota",
            role: "Anggota",
            major: "-",
            quote: "Berbagi inspirasi, membangun potensi.",
            iconClass: "fa-solid fa-user",
            instagram: "https://instagram.com/",
            linkedin: "https://linkedin.com/",
            photo: "assets/profilepic/LAKSA.jpeg"
        },
        'ahmad': {
            name: "Ahmad",
            shortName: "Ahmad",
            shortRole: "anggota",
            role: "Anggota",
            major: "-",
            quote: "Bersama mewujudkan desa yang mandiri.",
            iconClass: "fa-solid fa-user",
            instagram: "https://instagram.com/",
            linkedin: "https://linkedin.com/",
            photo: "assets/profilepic/AHMAD.jpeg"
        },
        'sabrina': {
            name: "Sabrina",
            shortName: "Sabrina",
            shortRole: "anggota",
            role: "Anggota",
            major: "-",
            quote: "Kreativitas untuk masyarakat sekitar.",
            iconClass: "fa-solid fa-user",
            instagram: "https://instagram.com/",
            linkedin: "https://linkedin.com/",
            photo: "assets/profilepic/SABRINA.jpeg?v=" + new Date().getTime()
        },
        'havez': {
            name: "Havez",
            shortName: "Havez",
            shortRole: "anggota",
            role: "Anggota",
            major: "-",
            quote: "Teknologi dan inovasi dari desa untuk dunia.",
            iconClass: "fa-solid fa-user",
            instagram: "https://instagram.com/",
            linkedin: "https://linkedin.com/",
            photo: "assets/profilepic/HAVEZ.jpeg"
        },
        'anas': {
            name: "Anas",
            shortName: "Anas",
            shortRole: "anggota",
            role: "Anggota",
            major: "-",
            quote: "Membangun dari desa, tumbuh bersama.",
            iconClass: "fa-solid fa-user",
            instagram: "https://instagram.com/",
            linkedin: "https://linkedin.com/",
            photo: "assets/profilepic/ANAS.jpeg"
        },
        'nabila': {
            name: "Nabila",
            shortName: "Nabila",
            shortRole: "anggota",
            role: "Anggota",
            major: "-",
            quote: "Menjadi bagian dari perubahan positif di masyarakat.",
            iconClass: "fa-solid fa-user",
            instagram: "https://instagram.com/",
            linkedin: "https://linkedin.com/",
            photo: "assets/profilepic/NABILA.jpeg"
        },
        'fanida': {
            name: "Fanida",
            shortName: "Fanida",
            shortRole: "anggota",
            role: "Anggota",
            major: "-",
            quote: "Pendidikan adalah kunci kemajuan desa.",
            iconClass: "fa-solid fa-user",
            instagram: "https://instagram.com/",
            linkedin: "https://linkedin.com/",
            photo: "assets/profilepic/FANIDA.jpeg"
        },
        'lyra': {
            name: "Lyra",
            shortName: "Lyra",
            shortRole: "anggota",
            role: "Anggota",
            major: "-",
            quote: "Menebar manfaat tanpa batas waktu.",
            iconClass: "fa-solid fa-user",
            instagram: "https://instagram.com/",
            linkedin: "https://linkedin.com/",
            photo: "assets/profilepic/LYRA.jpeg"
        },
        'dian': {
            name: "Dian",
            shortName: "Dian",
            shortRole: "anggota",
            role: "Anggota",
            major: "-",
            quote: "Memberdayakan desa melalui kolaborasi tiada henti.",
            iconClass: "fa-solid fa-user",
            instagram: "https://instagram.com/",
            linkedin: "https://linkedin.com/",
            photo: "assets/profilepic/DIAN.jpeg"
        },
        'shofa': {
            name: "Shofa",
            shortName: "Shofa",
            shortRole: "anggota",
            role: "Anggota",
            major: "-",
            quote: "Setiap pengabdian adalah investasi untuk masa depan.",
            iconClass: "fa-solid fa-user",
            instagram: "https://instagram.com/",
            linkedin: "https://linkedin.com/",
            photo: "assets/profilepic/SHOFA.jpeg"
        }
    };

    const hotspots = document.querySelectorAll('.hotspot');
    const tooltip = document.getElementById('team-tooltip');
    const svgElement = document.getElementById('team-svg');
    const placeholder = document.getElementById('team-detail-placeholder');
    const content = document.getElementById('team-detail-content');
    const card = document.getElementById('team-detail-card');

    const detailName = document.getElementById('detail-name');
    const detailRole = document.getElementById('detail-role');
    const detailMajor = document.getElementById('detail-major');
    const detailQuote = document.getElementById('detail-quote');
    const detailIcon = document.getElementById('detail-icon');
    const detailPhoto = document.getElementById('detail-photo');
    const detailIg = document.getElementById('detail-ig');
    const detailLi = document.getElementById('detail-li');

    if (hotspots && tooltip && svgElement) {
        hotspots.forEach(hotspot => {
            const id = hotspot.getAttribute('data-member');
            const member = teamMembers[id];

            // Helper to get the highlight element (supports both old cutout- and new clip- prefix)
            const getHighlight = (memberId) => {
                return document.getElementById(`cutout-${memberId}`) || document.getElementById(`clip-${memberId}`);
            };

            // Hover effect to show tooltip, dim others, and highlight
            hotspot.addEventListener('mouseenter', () => {
                if (!member) return;
                tooltip.textContent = `${member.shortName} (${member.shortRole})`;
                tooltip.classList.add('visible');

                // Dim base photo
                const basePhoto = document.getElementById('team-base-photo');
                if (basePhoto) basePhoto.classList.add('dimmed');

                // Activate highlight
                const highlight = getHighlight(id);
                if (highlight) highlight.classList.add('active');
            });

            hotspot.addEventListener('mousemove', (e) => {
                // Position the tooltip based on mouse coordinates relative to svg container
                const rect = svgElement.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                tooltip.style.left = `${x}px`;
                tooltip.style.top = `${y}px`;
            });

            hotspot.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');

                // Restore base photo dimming only if there are no selected highlights
                const hasSelected = document.querySelector('.cutout-overlay.selected, .person-highlight.selected');
                if (!hasSelected) {
                    const basePhoto = document.getElementById('team-base-photo');
                    if (basePhoto) basePhoto.classList.remove('dimmed');
                }

                // Deactivate highlight
                const highlight = getHighlight(id);
                if (highlight) highlight.classList.remove('active');
            });

            // Click effect to select and show profile details
            hotspot.addEventListener('click', () => {
                if (!member) return;

                // Remove selected class from all hotspots
                hotspots.forEach(h => h.classList.remove('selected'));

                // Add selected class to clicked one
                hotspot.classList.add('selected');

                // Remove selected class from all highlight elements and add to current
                const allHighlights = document.querySelectorAll('.cutout-overlay, .person-highlight');
                allHighlights.forEach(c => c.classList.remove('selected'));

                const highlight = getHighlight(id);
                if (highlight) highlight.classList.add('selected');

                // Keep base photo dimmed while someone is selected
                const basePhoto = document.getElementById('team-base-photo');
                if (basePhoto) basePhoto.classList.add('dimmed');

                // Hide placeholder, show content
                if (placeholder) placeholder.classList.add('hidden');
                if (content) content.classList.remove('hidden');

                // Update content details
                if (detailName) detailName.textContent = member.name;
                if (detailRole) detailRole.textContent = member.role;
                if (detailMajor) detailMajor.textContent = member.major;
                if (detailQuote) detailQuote.textContent = `"${member.quote}"`;
                if (detailIg) detailIg.href = member.instagram;
                if (detailLi) detailLi.href = member.linkedin;

                if (member.photo) {
                    if (detailPhoto) {
                        // Use a placeholder icon while loading
                        detailPhoto.classList.add('hidden');
                        detailPhoto.src = '';
                        if (detailIcon) {
                            detailIcon.classList.remove('hidden');
                            detailIcon.className = "fa-solid fa-spinner fa-spin text-muted"; // Placeholder
                        }

                        const tempImg = new Image();
                        tempImg.onload = () => {
                            // Verify member hasn't changed during load
                            if (detailName && detailName.textContent === member.name) {
                                detailPhoto.src = member.photo;
                                detailPhoto.alt = member.name;
                                detailPhoto.classList.remove('hidden');
                                if (detailIcon) detailIcon.classList.add('hidden');
                            }
                        };
                        tempImg.onerror = () => {
                            if (detailName && detailName.textContent === member.name) {
                                if (detailIcon) {
                                    detailIcon.className = member.iconClass;
                                }
                            }
                        };
                        tempImg.src = member.photo;
                    }
                } else {
                    if (detailPhoto) {
                        detailPhoto.classList.add('hidden');
                        detailPhoto.src = '';
                    }
                    if (detailIcon) {
                        detailIcon.classList.remove('hidden');
                        detailIcon.className = member.iconClass;
                    }
                }

                // Trigger animation
                if (content) {
                    content.style.animation = 'none';
                    // Trigger reflow
                    void content.offsetWidth;
                    content.style.animation = 'detailFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                }

                // Highlight card border temporary
                if (card) {
                    card.style.borderColor = 'var(--color-primary)';
                    setTimeout(() => {
                        card.style.borderColor = 'rgba(108, 8, 32, 0.04)';
                    }, 500);
                }
            });
        });
    }

    // --- 4b. Click Outside to Deselect Member ---
    document.addEventListener('click', (e) => {
        const photoWrapper = document.querySelector('.team-photo-wrapper');
        const detailCard = document.getElementById('team-detail-card');

        if (photoWrapper && detailCard) {
            // If click is outside the photo wrapper AND outside the detail card
            if (!photoWrapper.contains(e.target) && !detailCard.contains(e.target)) {
                // Remove selected class from all hotspots
                if (hotspots) hotspots.forEach(h => h.classList.remove('selected'));

                // Remove selected class from all highlight elements
                const allHighlights = document.querySelectorAll('.cutout-overlay, .person-highlight');
                allHighlights.forEach(c => c.classList.remove('selected'));

                // Undim base photo
                const basePhoto = document.getElementById('team-base-photo');
                if (basePhoto) basePhoto.classList.remove('dimmed');

                // Restore placeholder and hide details
                if (placeholder) placeholder.classList.remove('hidden');
                if (content) content.classList.add('hidden');
                if (detailPhoto) {
                    detailPhoto.classList.add('hidden');
                    detailPhoto.src = '';
                }
                if (detailIcon) {
                    detailIcon.classList.remove('hidden');
                }
            }
        }
    });

    // --- 5. Guestbook Functional Logic ---
    const commentForm = document.getElementById('comment-form');
    const messagesList = document.getElementById('messages-list');
    const messagesCountSpan = document.getElementById('messages-count');
    let guestbookMessages = [];

    // Helper to escape HTML and prevent XSS
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

    const fetchGuestbook = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/guestbook`);
            if (!response.ok) throw new Error('Gagal mengambil data buku tamu');
            guestbookMessages = await response.json();
            renderComments();
        } catch (error) {
            console.error(error);
            if (messagesList) {
                messagesList.innerHTML = `<div class="error-msg" style="color: var(--color-primary); font-weight: 600; padding: 20px;">Gagal memuat pesan buku tamu.</div>`;
            }
        }
    };

    const renderComments = () => {
        if (!messagesList) return;
        messagesList.innerHTML = '';
        if (messagesCountSpan) messagesCountSpan.textContent = guestbookMessages.length;

        if (guestbookMessages.length === 0) {
            messagesList.innerHTML = `<div class="empty-msg" style="color: var(--color-text-muted); padding: 20px; text-align: center;">Belum ada pesan yang disetujui.</div>`;
            return;
        }

        guestbookMessages.forEach(msg => {
            const commentCard = document.createElement('div');
            commentCard.className = 'comment-card';

            commentCard.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${escapeHTML(msg.name)}</span>
                    <span class="comment-role">${escapeHTML(msg.role)}</span>
                </div>
                <p class="comment-text">${escapeHTML(msg.message)}</p>
                <div class="comment-date">${msg.date}</div>
            `;
            messagesList.appendChild(commentCard);
        });
    };

    // Handle new message submission
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('input-name');
            const roleInput = document.getElementById('input-role');
            const messageInput = document.getElementById('input-message');

            const payload = {
                name: nameInput.value.trim(),
                role: roleInput.value,
                message: messageInput.value.trim()
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/guestbook`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Gagal mengirim pesan');

                // Reset form
                commentForm.reset();

                // Show dynamic premium toast / notification
                showNotification("Terima kasih! Pesan Anda berhasil dikirim dan sedang menunggu persetujuan admin.", "success");
            } catch (error) {
                console.error(error);
                showNotification("Gagal mengirim pesan. Silakan coba beberapa saat lagi.", "error");
            }
        });
    }

    // Dynamic premium toast notification helper
    const showNotification = (message, type = "success") => {
        let toast = document.getElementById('custom-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'custom-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '30px';
            toast.style.right = '30px';
            toast.style.zIndex = '10000';
            toast.style.padding = '16px 28px';
            toast.style.borderRadius = '12px';
            toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            toast.style.color = '#FFFFFF';
            toast.style.fontWeight = '600';
            toast.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.background = type === "success" ? "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)" : "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)";

        // Show
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 50);

        // Hide after 5 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
        }, 5000);
    };

    // --- Details Modal & Image Slider Logic ---
    const detailsModal = document.getElementById('details-modal');
    const modalCategoryBadge = document.getElementById('modal-category-badge');
    const modalDate = document.getElementById('modal-date');
    const modalTitle = document.getElementById('modal-title');
    const modalMarkdownContent = document.getElementById('modal-markdown-content');
    const modalGallerySide = document.getElementById('modal-gallery-side');
    const carouselTrack = document.getElementById('carousel-track');
    const carouselDotsContainer = document.getElementById('carousel-dots');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const lightboxOverlay = document.getElementById('lightbox-overlay');
    const lightboxImage = document.getElementById('lightbox-image');

    let currentSlideIndex = 0;
    let activeImages = [];

    const openDetailsModal = (item, itemType) => {
        if (!detailsModal) return;

        // Reset slide index
        currentSlideIndex = 0;

        // Set title
        if (modalTitle) modalTitle.textContent = item.title;

        // Format and render description
        const rawContent = itemType === 'Proker' ? item.description_markdown : item.content_markdown;
        if (modalMarkdownContent) {
            modalMarkdownContent.innerHTML = typeof marked !== 'undefined' ? marked.parse(rawContent) : rawContent;
        }

        // Set badge and date
        if (modalCategoryBadge) {
            modalCategoryBadge.textContent = itemType === 'Proker' ? item.type : item.phase;
            modalCategoryBadge.className = 'badge'; // reset
            if (itemType === 'Proker') {
                modalCategoryBadge.classList.add(item.type === 'Proker Bersama' ? 'badge-success' : 'badge-info');
            } else {
                modalCategoryBadge.classList.add(item.phase === 'Pra-KKN' ? 'badge-warning' : 'badge-success');
            }
        }

        if (modalDate) {
            if (itemType === 'Logbook') {
                const dateObj = new Date(item.date);
                const formattedDate = isNaN(dateObj.getTime()) ? item.date : dateObj.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                modalDate.textContent = formattedDate;
                modalDate.style.display = 'inline-block';
            } else {
                modalDate.textContent = `Status: ${item.status}`;
                modalDate.style.display = 'inline-block';
            }
        }

        // Handle Image Gallery
        activeImages = item.image_urls || [];
        if (activeImages.length === 0) {
            if (modalGallerySide) modalGallerySide.style.display = 'none';
        } else {
            if (modalGallerySide) modalGallerySide.style.display = 'block';

            // Build carousel slides
            if (carouselTrack) {
                carouselTrack.innerHTML = '';
                activeImages.forEach((imgUrl, idx) => {
                    const slide = document.createElement('div');
                    slide.className = 'carousel-slide';

                    const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE_URL}${imgUrl}`;

                    slide.innerHTML = `<img src="${fullUrl}" alt="Slide ${idx + 1}" class="carousel-image">`;

                    // Click to Zoom
                    slide.querySelector('img').addEventListener('click', () => {
                        openLightbox(fullUrl);
                    });

                    carouselTrack.appendChild(slide);
                });
            }

            // Build dot indicators
            if (carouselDotsContainer) {
                carouselDotsContainer.innerHTML = '';
                activeImages.forEach((_, idx) => {
                    const dot = document.createElement('span');
                    dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
                    dot.addEventListener('click', () => {
                        goToSlide(idx);
                    });
                    carouselDotsContainer.appendChild(dot);
                });
            }

            // Update slide positioning
            updateCarousel();
        }

        // Show modal with transition
        detailsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent body scroll
    };

    window.closeDetailsModal = () => {
        if (detailsModal) detailsModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore body scroll
    };

    // Carousel Navigation
    const updateCarousel = () => {
        if (!carouselTrack) return;
        const offset = -currentSlideIndex * 100;
        carouselTrack.style.transform = `translateX(${offset}%)`;

        // Update dots
        if (carouselDotsContainer) {
            const dots = carouselDotsContainer.querySelectorAll('.carousel-dot');
            dots.forEach((dot, idx) => {
                if (idx === currentSlideIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        // Show/hide arrows based on index / wrap-around
        if (prevBtn) prevBtn.style.display = activeImages.length <= 1 ? 'none' : 'flex';
        if (nextBtn) nextBtn.style.display = activeImages.length <= 1 ? 'none' : 'flex';
    };

    const goToSlide = (index) => {
        if (index < 0) {
            currentSlideIndex = activeImages.length - 1;
        } else if (index >= activeImages.length) {
            currentSlideIndex = 0;
        } else {
            currentSlideIndex = index;
        }
        updateCarousel();
    };

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToSlide(currentSlideIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToSlide(currentSlideIndex + 1);
        });
    }

    // Touch support (swipe) for Carousel
    let touchStartX = 0;
    let touchEndX = 0;

    if (carouselTrack) {
        carouselTrack.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carouselTrack.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    const handleSwipe = () => {
        const threshold = 50; // swipe minimum distance in pixels
        if (touchStartX - touchEndX > threshold) {
            // Swiped left, next slide
            goToSlide(currentSlideIndex + 1);
        } else if (touchEndX - touchStartX > threshold) {
            // Swiped right, prev slide
            goToSlide(currentSlideIndex - 1);
        }
    };

    // --- Lightbox Zoom Logic ---
    const openLightbox = (imgUrl) => {
        if (!lightboxOverlay || !lightboxImage) return;
        lightboxImage.src = imgUrl;
        lightboxOverlay.classList.remove('hidden');
    };

    window.closeLightbox = () => {
        if (lightboxOverlay) lightboxOverlay.classList.add('hidden');
    };

    // --- Dark Mode Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    // Check local storage for saved theme
    const savedTheme = localStorage.getItem('kkn-theme');
    if (savedTheme === 'dark') {
        htmlElement.setAttribute('data-theme', 'dark');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (htmlElement.getAttribute('data-theme') === 'dark') {
                htmlElement.removeAttribute('data-theme');
                localStorage.setItem('kkn-theme', 'light');
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            } else {
                htmlElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('kkn-theme', 'dark');
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            }
        });
    }

    // --- 6. Gallery Functional Logic ---
    const fetchGallery = async () => {
        const galleryContainer = document.getElementById('masonry-gallery-container');
        if (!galleryContainer) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/gallery`);
            if (!response.ok) throw new Error('Gagal mengambil data galeri');
            const galleryItems = await response.json();
            
            galleryContainer.innerHTML = ''; // Clear spinner
            
            if (galleryItems.length === 0) {
                galleryContainer.innerHTML = `<div style="text-align: center; width: 100%; padding: 40px; color: var(--color-text-muted); grid-column: 1 / -1;">Belum ada foto galeri.</div>`;
                return;
            }

            galleryItems.forEach(item => {
                const fullUrl = item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`;
                const dateObj = new Date(item.date);
                const formattedDate = isNaN(dateObj.getTime()) ? item.date : dateObj.toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });

                const html = `
                    <div class="gallery-item" onclick="openLightbox('${fullUrl}')">
                        <img src="${fullUrl}" alt="${escapeHTML(item.title)}" class="gallery-img" loading="lazy">
                        <div class="gallery-info">
                            <h4 class="gallery-title">${escapeHTML(item.title)}</h4>
                            <span class="gallery-date">${formattedDate}</span>
                            ${item.description ? `<p style="font-size: 0.8rem; margin-top: 5px; color: #eee;">${escapeHTML(item.description)}</p>` : ''}
                        </div>
                    </div>
                `;
                galleryContainer.insertAdjacentHTML('beforeend', html);
            });
            
        } catch (error) {
            console.error(error);
            galleryContainer.innerHTML = `<div class="error-msg" style="color: var(--color-primary); font-weight: 600; padding: 20px; text-align: center; grid-column: 1 / -1;">Gagal memuat galeri.</div>`;
        }
    };

    // --- 11. WebGIS Initialization ---
    const initWebGIS = () => {
        const mapContainer = document.getElementById('webgis-map');
        if (!mapContainer || typeof L === 'undefined') return;

        // Koordinat area Dusun Wungurejo (Berdasarkan foto peta aktual)
        const wungurejoCoords = [-7.874, 110.605]; 
        
        const map = L.map('webgis-map').setView(wungurejoCoords, 15);

        // Tambahkan Tile Layer (OpenStreetMap - 100% Gratis)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Buat Custom Icon untuk Marker
        const createCustomIcon = (color, iconClass) => {
            return L.divIcon({
                className: 'custom-leaflet-icon',
                html: `<div style="background-color: ${color}; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;"><i class="${iconClass}"></i></div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 34],
                popupAnchor: [0, -34]
            });
        };

        // --- 1. GARIS BATAS WILAYAH DUSUN (POLYGON) ---
        // Koordinat batas wilayah presisi (Mengikuti kontur garis merah lengkap dari peta)
        const wungurejoBoundary = [
            [-7.8705, 110.6065], // Titik paling utara (Barat laut Griya Sehat)
            [-7.8705, 110.6085], // Timur laut
            [-7.8740, 110.6090], // Timur atas
            [-7.8770, 110.6105], // Timur tengah (tonjolan ke luar)
            [-7.8800, 110.6090], // Timur bawah
            [-7.8830, 110.6075], // Tenggara
            [-7.8840, 110.6060], // Ujung paling selatan
            [-7.8825, 110.6045], // Barat daya
            [-7.8790, 110.6040], // Barat bawah
            [-7.8750, 110.6045], // Barat tengah
            [-7.8720, 110.6055]  // Barat atas
        ];

        // Gambar area polygon di peta
        const desaPolygon = L.polygon(wungurejoBoundary, {
            color: '#6C0820',      // Warna garis tepi (Tema KKN)
            weight: 3,             // Ketebalan garis
            opacity: 0.8,
            fillColor: '#6C0820',  // Warna isian area
            fillOpacity: 0.1       // Sangat transparan agar jalan di bawahnya tetap terlihat
        }).addTo(map);
        
        // Pop-up saat area desa diklik (bukan di markernya)
        desaPolygon.bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; text-align: center;">
                <h4 style="margin: 0; color: #6C0820; font-weight: 800;">Wilayah Dusun Wungurejo</h4>
                <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #666;">Estimasi Pemetaan Area KKN 84.095</p>
            </div>
        `);

        // --- 2. DATA TITIK LOKASI (MARKERS) DARI PETA ASLI ---
        const locations = [
            {
                name: "Posko KKN 84.095",
                coords: [-7.874000, 110.605389], // Presisi dari 7°52'26.4"S 110°36'19.4"E
                color: "#6C0820", 
                icon: "fa-solid fa-house-user",
                desc: "Pusat koordinasi dan tempat tinggal mahasiswa KKN selama mengabdi.",
                type: "Posko Utama"
            },
            {
                name: "Balai Padukuhan Wungurejo",
                coords: [-7.873732597455154, 110.60495672624596], // Presisi dari user
                color: "#4A90E2", 
                icon: "fa-solid fa-landmark",
                desc: "Pusat administrasi dusun dan lokasi berbagai sosialisasi proker.",
                type: "Fasilitas Umum"
            },
            {
                name: "Masjid Al Amin",
                coords: [-7.8740193, 110.6040767], // Koordinat presisi dari Google Maps
                color: "#9B59B6", 
                icon: "fa-solid fa-mosque",
                desc: "Pusat kegiatan ibadah kemasyarakatan dan pendidikan keagamaan warga.",
                type: "Fasilitas Ibadah"
            },
            {
                name: "Omah Kayu Toko Mebel",
                coords: [-7.8717, 110.6075], // Sisi utara agak timur
                color: "#F5A623", 
                icon: "fa-solid fa-hammer",
                desc: "Potensi UMKM kerajinan dan furnitur kayu unggulan dusun.",
                type: "UMKM Lokal"
            },
            {
                name: "Toko Qutis",
                coords: [-7.873920390437767, 110.60660252927839], // Presisi dari user
                color: "#1ABC9C", 
                icon: "fa-solid fa-store",
                desc: "Salah satu warung kelontong penggerak ekonomi mikro warga.",
                type: "UMKM Lokal"
            },
            {
                name: "Rumah Jahit PW NUR",
                coords: [-7.8705, 110.6070], // Ujung utara wilayah
                color: "#E67E22", 
                icon: "fa-solid fa-scissors",
                desc: "Jasa konveksi dan penjahit pakaian lokal Dusun Wungurejo.",
                type: "UMKM Lokal"
            },
            {
                name: "AB Squad Polishing",
                coords: [-7.8722, 110.6080], // Dekat Toko Qutis
                color: "#FF69B4", 
                icon: "fa-solid fa-car",
                desc: "Jasa pengecatan dan pemolesan bodi otomotif (Potensi wirausaha mandiri).",
                type: "UMKM Lokal"
            }
        ];

        // --- 3. RENDER MARKERS KE PETA ---
        locations.forEach(loc => {
            const marker = L.marker(loc.coords, { icon: createCustomIcon(loc.color, loc.icon) }).addTo(map);
            
            const popupContent = `
                <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 220px; padding: 5px;">
                    <span style="display: inline-block; padding: 4px 8px; border-radius: 20px; background-color: ${loc.color}15; font-size: 0.7rem; font-weight: 800; color: ${loc.color}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${loc.type}</span>
                    <h4 style="margin: 0 0 8px 0; font-size: 1.15rem; color: #2C3E50; font-weight: 800; line-height: 1.2;">${loc.name}</h4>
                    <p style="margin: 0; font-size: 0.85rem; color: #666; line-height: 1.5;">${loc.desc}</p>
                </div>
            `;
            
            marker.bindPopup(popupContent);
        });
    };

    // Load dynamic data on startup
    fetchProkers();
    fetchLogbook();
    fetchGuestbook();
    fetchGallery();
    
    // Initialize WebGIS Map safely
    setTimeout(initWebGIS, 500);
});
