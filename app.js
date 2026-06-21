document.addEventListener('DOMContentLoaded', () => {

    // --- 0. Preloader ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
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

    // Load dynamic data on startup
    fetchProkers();
    fetchLogbook();
    fetchGuestbook();
});

