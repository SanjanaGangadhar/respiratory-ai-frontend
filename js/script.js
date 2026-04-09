/* =============================================
   RespiAI — Main JavaScript
   ============================================= */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    /* -----------------------------------------
       1. NAVBAR — Scroll shadow effect
       ----------------------------------------- */
    const navbar = document.getElementById('navbar');

    const handleScroll = () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Run once on load


    /* -----------------------------------------
       2. MOBILE MENU — Toggle open/close
       ----------------------------------------- */
    const navToggle = document.getElementById('nav-toggle');
    const navLinks  = document.getElementById('nav-links');

    // Create overlay element for mobile menu background
    const overlay = document.createElement('div');
    overlay.classList.add('nav-overlay');
    document.body.appendChild(overlay);

    const openMenu = () => {
        navToggle.classList.add('active');
        navLinks.classList.add('open');
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    };

    const closeMenu = () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
    };

    navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.contains('open');
        isOpen ? closeMenu() : openMenu();
    });

    // Close menu when clicking overlay
    overlay.addEventListener('click', closeMenu);

    // Close menu when clicking a navigation link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });


    /* -----------------------------------------
       3. ACTIVE NAV LINK — Highlight on scroll
       ----------------------------------------- */
    const sections = document.querySelectorAll('.section');
    const navLinkElements = document.querySelectorAll('.nav-link');

    const activateNavLink = () => {
        let currentSection = '';
        const scrollPos = window.scrollY + 150; // Offset for navbar height

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinkElements.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === currentSection) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', activateNavLink, { passive: true });
    activateNavLink(); // Run once on load


    /* -----------------------------------------
       4. SMOOTH SCROLL — For nav link clicks
       ----------------------------------------- */
    navLinkElements.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });


    /* -----------------------------------------
       5. HERO — Scroll indicator fade
       ----------------------------------------- */
    const scrollIndicator = document.getElementById('scroll-indicator');

    if (scrollIndicator) {
        const fadeScrollIndicator = () => {
            // Fade out the scroll indicator as user scrolls down
            const opacity = Math.max(0, 1 - (window.scrollY / 300));
            scrollIndicator.style.opacity = opacity;
            scrollIndicator.style.pointerEvents = opacity < 0.3 ? 'none' : 'auto';
        };

        window.addEventListener('scroll', fadeScrollIndicator, { passive: true });
    }


    /* -----------------------------------------
       6. HERO — Parallax mouse move effect
       ----------------------------------------- */
    const heroImage = document.getElementById('hero-image');
    const heroSection = document.querySelector('.hero-section');

    if (heroImage && heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            // Calculate mouse position relative to center (-0.5 to 0.5)
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            // Apply subtle parallax movement
            requestAnimationFrame(() => {
                heroImage.style.transform = `translateY(${Math.sin(Date.now() / 1000) * 12}px) translate(${x * 15}px, ${y * 10}px)`;
            });
        });

        // Reset position when mouse leaves
        heroSection.addEventListener('mouseleave', () => {
            heroImage.style.transition = 'transform 0.5s ease-out';
            heroImage.style.transform = '';
            setTimeout(() => {
                heroImage.style.transition = '';
            }, 500);
        });
    }


    /* -----------------------------------------
       7. HERO — CTA button smooth scroll
       ----------------------------------------- */
    const ctaButtons = document.querySelectorAll('.hero-actions .btn');
    ctaButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });


    /* -----------------------------------------
       8. SCROLL REVEAL — Animate on scroll
       ----------------------------------------- */
    const animateElements = document.querySelectorAll('[data-animate]');

    if (animateElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-visible');
                    // Don't unobserve so elements can re-animate if needed
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        animateElements.forEach(el => revealObserver.observe(el));
    }


    /* -----------------------------------------
       9. ABOUT — Animated stat counters
       ----------------------------------------- */
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');

    if (statNumbers.length > 0) {
        let statsCounted = false;

        const countUp = (el) => {
            const target = parseInt(el.getAttribute('data-count'));
            const suffix = el.getAttribute('data-suffix') || '';
            const duration = 1500; // ms
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(eased * target);

                el.textContent = current + suffix;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        };

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !statsCounted) {
                    statsCounted = true;
                    statNumbers.forEach(el => countUp(el));
                    statsObserver.disconnect();
                }
            });
        }, { threshold: 0.5 });

        const statsBar = document.querySelector('.about-stats');
        if (statsBar) statsObserver.observe(statsBar);
    }


    /* -----------------------------------------
       10. UPLOAD — Drag & Drop File Handling
       ----------------------------------------- */
    const setupUploadZone = (config) => {
        const { dropzoneId, inputId, contentId, previewId, removeId, fileInfoId, fileNameId, fileSizeId, type } = config;

        const dropzone = document.getElementById(dropzoneId);
        const input = document.getElementById(inputId);
        const content = document.getElementById(contentId);
        const preview = document.getElementById(previewId);
        const removeBtn = document.getElementById(removeId);
        const fileInfo = document.getElementById(fileInfoId);
        const fileName = document.getElementById(fileNameId);
        const fileSize = document.getElementById(fileSizeId);

        if (!dropzone || !input) return;

        // Utility: format file size
        const formatSize = (bytes) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / 1048576).toFixed(1) + ' MB';
        };

        // Handle file selection
        const handleFile = (file) => {
            if (!file) return;

            // Show file info
            fileName.textContent = file.name;
            fileSize.textContent = formatSize(file.size);
            fileInfo.style.display = 'flex';

            if (type === 'image') {
                // Show image preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.getElementById('xray-preview-img');
                    img.src = e.target.result;
                    content.style.display = 'none';
                    preview.style.display = 'flex';
                    dropzone.classList.add('has-file');
                };
                reader.readAsDataURL(file);
            } else if (type === 'audio') {
                // Show audio preview
                const player = document.getElementById('audio-preview-player');
                const url = URL.createObjectURL(file);
                player.src = url;
                content.style.display = 'none';
                preview.style.display = 'flex';
                dropzone.classList.add('has-file');
            }

            updateAnalyzeButton();
        };

        // Remove file
        const removeFile = () => {
            input.value = '';
            content.style.display = 'flex';
            preview.style.display = 'none';
            fileInfo.style.display = 'none';
            dropzone.classList.remove('has-file');
            updateAnalyzeButton();
        };

        if (removeBtn) removeBtn.addEventListener('click', removeFile);

        // Input change event
        input.addEventListener('change', (e) => {
            handleFile(e.target.files[0]);
        });

        // Drag & drop events
        ['dragenter', 'dragover'].forEach(event => {
            dropzone.addEventListener(event, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('drag-active');
            });
        });

        ['dragleave', 'drop'].forEach(event => {
            dropzone.addEventListener(event, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('drag-active');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (file) {
                // Set the file on the input for form submission
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                handleFile(file);
            }
        });
    };

    // Initialize both upload zones
    setupUploadZone({
        dropzoneId: 'xray-dropzone',
        inputId: 'xray-input',
        contentId: 'xray-dropzone-content',
        previewId: 'xray-preview',
        removeId: 'xray-remove',
        fileInfoId: 'xray-file-info',
        fileNameId: 'xray-file-name',
        fileSizeId: 'xray-file-size',
        type: 'image'
    });

    setupUploadZone({
        dropzoneId: 'audio-dropzone',
        inputId: 'audio-input',
        contentId: 'audio-dropzone-content',
        previewId: 'audio-preview',
        removeId: 'audio-remove',
        fileInfoId: 'audio-file-info',
        fileNameId: 'audio-file-name',
        fileSizeId: 'audio-file-size',
        type: 'audio'
    });


    /* -----------------------------------------
       11. UPLOAD — Analyze button logic
       ----------------------------------------- */
    const btnAnalyze = document.getElementById('btn-analyze');
    const analyzeStatus = document.getElementById('analyze-status');

    const updateAnalyzeButton = () => {
        const xrayInput = document.getElementById('xray-input');
        const audioInput = document.getElementById('audio-input');
        const hasFile = (xrayInput && xrayInput.files.length > 0) ||
                        (audioInput && audioInput.files.length > 0);

        if (btnAnalyze) {
            btnAnalyze.disabled = !hasFile;
        }
    };

    if (btnAnalyze) {
        btnAnalyze.addEventListener('click', async () => {
            const textEl = btnAnalyze.querySelector('.btn-analyze-text');
            const loadingEl = btnAnalyze.querySelector('.btn-analyze-loading');

            // Show loading state
            textEl.style.display = 'none';
            loadingEl.style.display = 'inline-flex';
            btnAnalyze.disabled = true;
            analyzeStatus.textContent = 'Processing your data with AI models...';
            analyzeStatus.className = 'analyze-status';

            try {
                // Use API layer if available
                const apiInstance = window.api;

                if (apiInstance) {
                    // Step 1: Upload files via API
                    analyzeStatus.textContent = 'Uploading files to server...';

                    const xrayInput = document.getElementById('xray-input');
                    const audioInput = document.getElementById('audio-input');

                    if (xrayInput?.files[0]) {
                        await apiInstance.uploadXray(xrayInput.files[0], (pct) => {
                            analyzeStatus.textContent = `Uploading X-ray... ${pct}%`;
                        });
                    }

                    if (audioInput?.files[0]) {
                        await apiInstance.uploadAudio(audioInput.files[0], (pct) => {
                            analyzeStatus.textContent = `Uploading audio... ${pct}%`;
                        });
                    }

                    // Step 2: Trigger analysis
                    analyzeStatus.textContent = 'Extracting features from input data...';
                    const task = await apiInstance.triggerAnalysis({
                        xrayFileId: 'xray_latest',
                        audioFileId: 'audio_latest'
                    });

                    // Step 3: Get results
                    analyzeStatus.textContent = 'Running classification models...';
                    const results = await apiInstance.getResults(task.taskId);

                    // Step 4: Update dashboard with results
                    if (results.prediction) {
                        const nameEl = document.getElementById('result-disease-name');
                        const pctEl = document.getElementById('confidence-pct');
                        if (nameEl) nameEl.textContent = results.prediction.disease;
                        if (pctEl) pctEl.textContent = Math.round(results.prediction.confidence * 100) + '%';
                    }

                    console.log('📊 Analysis results:', results);
                } else {
                    // Fallback: simulate without API
                    await new Promise(r => setTimeout(r, 1200));
                    analyzeStatus.textContent = 'Extracting features from input data...';
                    await new Promise(r => setTimeout(r, 1300));
                    analyzeStatus.textContent = 'Running classification models...';
                    await new Promise(r => setTimeout(r, 1500));
                }

                // Complete
                textEl.style.display = 'inline-flex';
                loadingEl.style.display = 'none';
                btnAnalyze.disabled = false;
                analyzeStatus.textContent = '✅ Analysis complete! Scroll down to view results.';
                analyzeStatus.className = 'analyze-status success';

                // Smooth scroll to dashboard
                const dashboard = document.getElementById('dashboard');
                if (dashboard) {
                    setTimeout(() => {
                        dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 600);
                }
            } catch (error) {
                // Handle errors
                console.error('❌ Analysis failed:', error);
                textEl.style.display = 'inline-flex';
                loadingEl.style.display = 'none';
                btnAnalyze.disabled = false;
                analyzeStatus.textContent = `❌ Analysis failed: ${error.message}`;
                analyzeStatus.className = 'analyze-status error';
            }
        });
    }


    /* -----------------------------------------
       12. DASHBOARD — Draw fake waveform
       ----------------------------------------- */
    const waveformCanvas = document.getElementById('waveform-canvas');
    if (waveformCanvas) {
        const ctx = waveformCanvas.getContext('2d');
        const drawWaveform = () => {
            const w = waveformCanvas.width = waveformCanvas.parentElement.clientWidth;
            const h = waveformCanvas.height = 150;
            ctx.clearRect(0, 0, w, h);

            // Dark background
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, w, h);

            // Draw waveform
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            const centerY = h / 2;
            for (let x = 0; x < w; x++) {
                const t = x / w;
                const amp = Math.sin(t * Math.PI) * 40; // Envelope
                const wave = Math.sin(t * 60) * amp * (0.5 + Math.random() * 0.5);
                const y = centerY + wave;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw center line
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(w, centerY);
            ctx.stroke();
        };

        drawWaveform();
        window.addEventListener('resize', drawWaveform);
    }


    /* -----------------------------------------
       13. DASHBOARD — Draw fake pie chart
       ----------------------------------------- */
    const chartCanvas = document.getElementById('classification-chart');
    if (chartCanvas) {
        const ctx = chartCanvas.getContext('2d');
        const drawChart = () => {
            const w = chartCanvas.width = chartCanvas.parentElement.clientWidth;
            const h = chartCanvas.height = 250;
            ctx.clearRect(0, 0, w, h);

            const cx = w / 2;
            const cy = h / 2;
            const r = Math.min(w, h) / 2 - 30;
            const innerR = r * 0.55;

            const data = [
                { value: 0.90, color: '#3b82f6', label: 'Pneumonia' },
                { value: 0.06, color: '#ef4444', label: 'TB' },
                { value: 0.03, color: '#f97316', label: 'COPD' },
                { value: 0.01, color: '#8b5cf6', label: 'Asthma' }
            ];

            let startAngle = -Math.PI / 2;
            data.forEach(d => {
                const sliceAngle = d.value * 2 * Math.PI;
                ctx.beginPath();
                ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
                ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
                ctx.closePath();
                ctx.fillStyle = d.color;
                ctx.fill();
                startAngle += sliceAngle;
            });

            // Center text
            ctx.fillStyle = '#1e293b';
            ctx.font = '700 20px "Space Grotesk", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('90%', cx, cy - 8);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 11px "Inter", sans-serif';
            ctx.fillText('Pneumonia', cx, cy + 12);
        };

        drawChart();
        window.addEventListener('resize', drawChart);

        // Hide overlay after drawing
        const overlay = document.querySelector('.chart-overlay');
        if (overlay) overlay.style.display = 'none';
    }


    /* -----------------------------------------
       14. REAL-TIME — ESP32 connection simulation
       ----------------------------------------- */
    const rtBtnConnect = document.getElementById('rt-btn-connect');
    const rtBtnDisconnect = document.getElementById('rt-btn-disconnect');
    const rtBtnAnalyze = document.getElementById('rt-btn-analyze');
    const rtDot = document.getElementById('rt-dot');
    const rtStatusText = document.getElementById('rt-status-text');
    const rtLiveBadge = document.getElementById('rt-live-badge');
    const rtOverlay = document.getElementById('rt-waveform-overlay');
    const rtCanvas = document.getElementById('rt-waveform-canvas');

    let rtAnimationId = null;
    let rtConnected = false;
    let rtSampleCount = 0;

    // Simulated live waveform drawing
    const drawLiveWaveform = () => {
        if (!rtCanvas || !rtConnected) return;

        const ctx = rtCanvas.getContext('2d');
        const w = rtCanvas.width = rtCanvas.parentElement.clientWidth;
        const h = rtCanvas.height = 200;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
        ctx.lineWidth = 0.5;
        for (let y = 0; y < h; y += 25) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw waveform
        const time = performance.now() / 1000;
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const centerY = h / 2;
        for (let x = 0; x < w; x++) {
            const t = x / w;
            // Simulated breath cycle + crackle noise
            const breathEnvelope = Math.sin(t * Math.PI * 2 + time * 0.8) * 0.5 + 0.5;
            const wave = (
                Math.sin((t * 40 + time * 4) * Math.PI) * 25 * breathEnvelope +
                Math.sin((t * 80 + time * 6) * Math.PI) * 8 * breathEnvelope +
                (Math.random() - 0.5) * 10 * breathEnvelope
            );
            const y = centerY + wave;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glow effect
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Center line
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Update sample count
        rtSampleCount += 16;

        rtAnimationId = requestAnimationFrame(drawLiveWaveform);
    };

    // Update live stats
    let rtStatsInterval = null;
    const updateLiveStats = () => {
        const freq = document.getElementById('rt-freq');
        const amp = document.getElementById('rt-amp');
        const cls = document.getElementById('rt-class');
        const samples = document.getElementById('rt-samples');

        if (freq) freq.textContent = (200 + Math.random() * 600).toFixed(0) + ' Hz';
        if (amp) amp.textContent = (0.3 + Math.random() * 0.5).toFixed(2) + ' V';
        if (cls) cls.textContent = ['Crackle', 'Wheeze', 'Normal', 'Crackle'][Math.floor(Math.random() * 4)];
        if (samples) samples.textContent = rtSampleCount.toLocaleString();
    };

    // Connect
    const connectESP32 = () => {
        rtConnected = true;

        // Update UI states
        rtBtnConnect.style.display = 'none';
        rtBtnDisconnect.style.display = 'inline-flex';
        rtBtnAnalyze.disabled = false;
        rtDot.classList.add('connected');
        rtStatusText.textContent = 'Connected';
        rtStatusText.classList.add('connected');
        rtLiveBadge.classList.add('active');
        rtOverlay.classList.add('hidden');

        // Update meta
        document.getElementById('rt-ip').textContent = '192.168.1.42';
        document.getElementById('rt-uptime').textContent = '00:00:00';
        document.getElementById('rt-signal').textContent = '-42 dBm';

        // Start waveform animation
        drawLiveWaveform();

        // Start live stats
        rtStatsInterval = setInterval(updateLiveStats, 800);

        // Start uptime counter
        let seconds = 0;
        window.rtUptimeInterval = setInterval(() => {
            seconds++;
            const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
            const s = String(seconds % 60).padStart(2, '0');
            document.getElementById('rt-uptime').textContent = `${h}:${m}:${s}`;
        }, 1000);
    };

    // Disconnect
    const disconnectESP32 = () => {
        rtConnected = false;

        // Cancel animation
        if (rtAnimationId) cancelAnimationFrame(rtAnimationId);
        if (rtStatsInterval) clearInterval(rtStatsInterval);
        if (window.rtUptimeInterval) clearInterval(window.rtUptimeInterval);

        // Update UI states
        rtBtnConnect.style.display = 'inline-flex';
        rtBtnDisconnect.style.display = 'none';
        rtBtnAnalyze.disabled = true;
        rtDot.classList.remove('connected');
        rtStatusText.textContent = 'Disconnected';
        rtStatusText.classList.remove('connected');
        rtLiveBadge.classList.remove('active');
        rtOverlay.classList.remove('hidden');

        // Reset meta
        document.getElementById('rt-ip').textContent = '—';
        document.getElementById('rt-uptime').textContent = '—';
        document.getElementById('rt-signal').textContent = '—';

        // Reset stats
        ['rt-freq', 'rt-amp', 'rt-class', 'rt-samples'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '—';
        });

        rtSampleCount = 0;
    };

    if (rtBtnConnect) rtBtnConnect.addEventListener('click', connectESP32);
    if (rtBtnDisconnect) rtBtnDisconnect.addEventListener('click', disconnectESP32);


    /* -----------------------------------------
       15. CONTACT — Form submission
       ----------------------------------------- */
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('btn-submit');
            const originalHTML = submitBtn.innerHTML;

            // Show loading
            submitBtn.innerHTML = '<div class="spinner"></div> Sending...';
            submitBtn.disabled = true;
            formStatus.textContent = '';
            formStatus.className = 'form-status';

            // Simulate sending (fake — will connect to backend later)
            setTimeout(() => {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
                formStatus.textContent = '✅ Message sent successfully! We\'ll get back to you soon.';
                formStatus.className = 'form-status success';
                contactForm.reset();

                // Clear status after 5 seconds
                setTimeout(() => {
                    formStatus.textContent = '';
                }, 5000);
            }, 2000);
        });
    }


    /* -----------------------------------------
       16. FOOTER — Newsletter form
       ----------------------------------------- */
    const newsletterForm = document.getElementById('newsletter-form');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = newsletterForm.querySelector('.newsletter-input');
            if (input && input.value) {
                const original = input.value;
                input.value = '';
                input.placeholder = '✅ Subscribed!';
                setTimeout(() => {
                    input.placeholder = 'your@email.com';
                }, 3000);
            }
        });
    }


    /* -----------------------------------------
       17. PRELOADER — Hide on load
       ----------------------------------------- */
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Give a short delay for visuals, then hide
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 1200);
    }


    /* -----------------------------------------
       18. BACK TO TOP BUTTON
       ----------------------------------------- */
    const backToTopBtn = document.getElementById('back-to-top');

    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 600) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }, { passive: true });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    /* -----------------------------------------
       19. ACTIVE NAV LINK HIGHLIGHTING
       ----------------------------------------- */
    const allSections = document.querySelectorAll('section[id]');
    const allNavLinks = document.querySelectorAll('.nav-link');

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                allNavLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    });

    allSections.forEach(section => navObserver.observe(section));


    /* -----------------------------------------
       20. SCROLL PROGRESS BAR
       ----------------------------------------- */
    // Create progress bar element
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.prepend(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    }, { passive: true });


    /* -----------------------------------------
       21. KEYBOARD ACCESSIBILITY
       ----------------------------------------- */
    // Allow Enter/Space to trigger dropzone click
    document.querySelectorAll('.dropzone').forEach(dz => {
        dz.setAttribute('tabindex', '0');
        dz.setAttribute('role', 'button');
        dz.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const input = dz.querySelector('.dropzone-input');
                if (input) input.click();
            }
        });
    });


    /* -----------------------------------------
       22. SMOOTH NAV SCROLL with offset
       ----------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = document.querySelector('.navbar')?.offsetHeight || 80;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const navLinks = document.querySelector('.nav-links');
                const hamburger = document.querySelector('.hamburger');
                if (navLinks?.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    hamburger?.classList.remove('active');
                }
            }
        });
    });


    // Log successful initialization
    console.log('✅ RespiAI — All phases initialized successfully!');
    console.log('🫁 RespiAI v1.0 — AI-Based Respiratory Disease Detection System');
});
