// SRIF 2026 - Professional JavaScript
document.addEventListener('DOMContentLoaded', function () {
    initScienceBackground();
    initHeader();
    initNavigation();
    initCountdown();
    initScrollAnimations();
    initCounters();
    initFormHandlers();
    initContactForm();
    initLanguageSwitcher();
});

// Science Background Animation
function initScienceBackground() {
    const canvas = document.getElementById('scienceCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let connections = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
            this.color = Math.random() > 0.5 ? 'rgba(0, 212, 255, 0.6)' : 'rgba(124, 58, 237, 0.6)';
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    // Initialize particles
    const particleCount = Math.min(80, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${0.15 * (1 - dist / 150)})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        drawConnections();
        requestAnimationFrame(animate);
    }
    animate();
}

// Header scroll effect
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Navigation
function initNavigation() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                navMenu?.classList.remove('active');
            }
        });
    });

    // Active nav on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Countdown Timer
function initCountdown() {
    const deadline = new Date('April 18, 2026 23:59:59').getTime();

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('mins');

    if (!daysEl || !hoursEl || !minsEl) return;

    function updateTimer() {
        const now = new Date().getTime();
        const diff = deadline - now;

        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            daysEl.textContent = String(days).padStart(2, '0');
            hoursEl.textContent = String(hours).padStart(2, '0');
            minsEl.textContent = String(mins).padStart(2, '0');
        } else {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minsEl.textContent = '00';
        }
    }

    updateTimer();
    setInterval(updateTimer, 60000);
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.about-card, .track-card, .timeline-item, .contact-card, .stat-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add animation class styles
    const style = document.createElement('style');
    style.textContent = `.animate-in { opacity: 1 !important; transform: translateY(0) !important; }`;
    document.head.appendChild(style);
}

// Animated Counters
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');

    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-count'));
                animateCounter(counter, target);
                observer.unobserve(counter);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));

    function animateCounter(element, target) {
        let current = 0;
        const increment = target / 50;
        const duration = 2000;
        const stepTime = duration / 50;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, stepTime);
    }
}

// Form Handlers
function initFormHandlers() {
    // Radio button selection styling
    const radioOptions = document.querySelectorAll('.radio-option');
    radioOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
            radio.addEventListener('change', () => {
                radioOptions.forEach(opt => opt.classList.remove('selected'));
                if (radio.checked) {
                    option.classList.add('selected');
                }

                // Handle external institution field
                const externalField = document.getElementById('externalInstitution');
                if (externalField) {
                    if (radio.value === 'external') {
                        externalField.style.display = 'block';
                        externalField.querySelector('input')?.setAttribute('required', 'required');
                    } else {
                        externalField.style.display = 'none';
                        externalField.querySelector('input')?.removeAttribute('required');
                    }
                }
            });
        }
    });

    // File upload handling
    const fileUpload = document.querySelector('.file-upload');
    const fileInput = document.getElementById('fileInput');

    if (fileUpload && fileInput) {
        // Click to upload
        fileUpload.addEventListener('click', () => fileInput.click());

        // File selected
        fileInput.addEventListener('change', (e) => {
            handleFileSelect(e.target.files);
        });

        // Drag and drop
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.classList.add('dragover');
        });

        fileUpload.addEventListener('dragleave', () => {
            fileUpload.classList.remove('dragover');
        });

        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.classList.remove('dragover');
            handleFileSelect(e.dataTransfer.files);
        });

        function handleFileSelect(files) {
            if (files.length > 0) {
                const file = files[0];
                const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

                if (!validTypes.includes(file.type)) {
                    alert('Please upload a PDF, DOC, or DOCX file.');
                    return;
                }

                if (file.size > 10 * 1024 * 1024) {
                    alert('File size must be less than 10MB.');
                    return;
                }

                // Show file name
                let fileName = fileUpload.querySelector('.file-name');
                if (!fileName) {
                    fileName = document.createElement('div');
                    fileName.className = 'file-name';
                    fileUpload.appendChild(fileName);
                }
                fileName.innerHTML = `<i class="fas fa-file-alt"></i> ${file.name}`;
            }
        }
    }

    // Form submission - Dynamic API
    const form = document.getElementById('abstractForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Validate form
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value && field.type !== 'radio') {
                    isValid = false;
                    field.classList.add('error');
                } else if (field.type !== 'radio') {
                    field.classList.remove('error');
                }
            });

            // Check radio buttons
            const affiliationRadio = form.querySelector('input[name="affiliation"]:checked');
            if (!affiliationRadio) {
                isValid = false;
            }

            if (!isValid) {
                alert('Please fill in all required fields.');
                return;
            }

            // Determine submission type
            const isResearch = window.location.pathname.includes('research');
            const apiUrl = `/api/submissions/${isResearch ? 'research' : 'innovation'}`;

            // Build FormData for file upload support
            const formData = new FormData();

            if (isResearch) {
                formData.append('authorName', form.querySelector('[name="author"]').value);
                formData.append('supervisorName', form.querySelector('[name="supervisor"]').value);
                formData.append('teamMembers', form.querySelector('[name="team"]')?.value || '');
                formData.append('email', form.querySelector('[name="email"]').value);
                formData.append('affiliation', affiliationRadio.value);
                formData.append('externalInstitution', form.querySelector('[name="institution"]')?.value || '');
                formData.append('title', form.querySelector('[name="title"]').value);
                formData.append('background', form.querySelector('[name="background"]').value);
                formData.append('methods', form.querySelector('[name="methods"]').value);
                formData.append('results', form.querySelector('[name="results"]').value);
                formData.append('conclusion', form.querySelector('[name="conclusion"]').value);
            } else {
                formData.append('innovatorName', form.querySelector('[name="author"]').value);
                formData.append('mentorName', form.querySelector('[name="supervisor"]').value);
                formData.append('teamMembers', form.querySelector('[name="team"]')?.value || '');
                formData.append('email', form.querySelector('[name="email"]').value);
                formData.append('affiliation', affiliationRadio.value);
                formData.append('externalInstitution', form.querySelector('[name="institution"]')?.value || '');
                formData.append('title', form.querySelector('[name="title"]').value);
                formData.append('problemStatement', form.querySelector('[name="background"]').value);
                formData.append('innovationDescription', form.querySelector('[name="methods"]').value);
                formData.append('keyFeatures', form.querySelector('[name="results"]').value);
                formData.append('implementation', form.querySelector('[name="conclusion"]').value);
            }

            // Add file
            const fileInput = form.querySelector('[name="file"]');
            if (fileInput && fileInput.files[0]) {
                formData.append('file', fileInput.files[0]);
            }

            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    const formCard = document.querySelector('.form-card');
                    formCard.innerHTML = `
                        <div class="success-message">
                            <i class="fas fa-check-circle"></i>
                            <h3>Submission Successful!</h3>
                            <p>Your submission ID is: <strong>${data.data.submissionId}</strong></p>
                            <p>Thank you for your submission. You will receive a confirmation email at the address you provided.</p>
                            <p style="margin-top: 10px; font-size: 0.9rem; color: var(--gray-400);">Please save your submission ID for tracking purposes.</p>
                            <a href="index.html" class="btn btn-primary">
                                <i class="fas fa-home"></i> Return to Home
                            </a>
                        </div>
                    `;
                } else {
                    alert(data.message || 'Submission failed. Please try again.');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }

            } catch (error) {
                console.error('Submission error:', error);
                alert('Connection error. Please check your internet connection and try again.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Contact Form Handler
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = document.getElementById('contactSubmitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        const payload = {
            name: contactForm.querySelector('[name="contactName"]').value,
            email: contactForm.querySelector('[name="contactEmail"]').value,
            subject: contactForm.querySelector('[name="contactSubject"]')?.value || '',
            message: contactForm.querySelector('[name="contactMessage"]').value
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                contactForm.reset();
                const successEl = document.getElementById('contactSuccess');
                successEl.style.display = 'block';
                setTimeout(() => { successEl.style.display = 'none'; }, 5000);
            } else {
                alert(data.message || 'Failed to send message.');
            }
        } catch (error) {
            alert('Connection error. Please try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Language Switcher
function initLanguageSwitcher() {
    const langToggle = document.getElementById('langToggle');
    if (!langToggle) return;

    // Translations
    const translations = {
        // Hero Section
        'Scientific Research': 'البحث العلمي',
        '& Innovation Forum': 'ومنتدى الابتكار',
        'High Quality Performers Will Be Awarded': 'سيتم تكريم المتميزين',
        'AlMaarefa University': 'جامعة المعرفة',
        'Igniting Minds: Shaping the Future': 'إضاءة الأفكار: بلورة المستقبل',
        'Submission Deadline': 'الموعد النهائي للتقديم',
        'Days': 'يوم',
        'Hours': 'ساعة',
        'Mins': 'دقيقة',
        'Submit Abstract': 'تقديم الملخص',
        'Learn More': 'اعرف المزيد',

        // About Section
        'About SRIF': 'عن المنتدى',
        'About the Forum': 'عن المنتدى',
        'Fostering Excellence in Scientific Research and Innovation': 'تعزيز التميز في البحث العلمي والابتكار',
        'Multidisciplinary': 'متعدد التخصصات',
        'Covering medicine, pharmacy, and applied medical sciences': 'يغطي الطب والصيدلة والعلوم الطبية التطبيقية',
        'Awards': 'الجوائز',
        'Recognition for outstanding research and innovation': 'تقدير للبحوث والابتكارات المتميزة',
        'Networking': 'التواصل',
        'Connect with researchers and industry experts': 'تواصل مع الباحثين وخبراء الصناعة',
        'Publication': 'النشر',
        'Opportunity for publication in indexed journals': 'فرصة للنشر في مجلات مفهرسة',

        // Tracks Section
        'Call for Abstracts': 'دعوة لتقديم الملخصات',
        'Submit Your Work': 'قدم عملك',
        'Choose your track and submit your abstract for review and presentation opportunity.': 'اختر مسارك وقدم ملخصك للمراجعة وفرصة العرض.',
        'Scientific Research': 'البحث العلمي',
        'Original research abstracts in health sciences fields including clinical studies, basic sciences, and public health.': 'ملخصات بحثية أصلية في مجالات العلوم الصحية بما في ذلك الدراسات السريرية والعلوم الأساسية والصحة العامة.',
        'Poster Presentation': 'عرض الملصقات',
        'Oral Presentation': 'العرض الشفهي',
        'Submit Research Abstract': 'تقديم ملخص البحث',
        'Innovation': 'الابتكار',
        'Creative solutions and innovative projects addressing healthcare challenges and improving patient outcomes.': 'حلول إبداعية ومشاريع مبتكرة تعالج تحديات الرعاية الصحية وتحسن نتائج المرضى.',
        'Prototype/Device': 'النموذج الأولي/الجهاز',
        'Submit Innovation Abstract': 'تقديم ملخص الابتكار',

        // Timeline Section
        'Event Timeline': 'الجدول الزمني',
        'Important Dates': 'المواعيد المهمة',
        'Mark your calendar with these key dates for SRIF 2026.': 'ضع هذه التواريخ المهمة في تقويمك لمنتدى 2026.',
        'Abstract Submission Opens': 'بدء استقبال الملخصات',
        'Start submitting your research and innovation abstracts': 'ابدأ بتقديم ملخصات البحث والابتكار',
        'Submission Deadline': 'الموعد النهائي للتقديم',
        'Last day to submit your abstracts': 'آخر يوم لتقديم الملخصات',
        'Acceptance Notification': 'إشعار القبول',
        'Authors will be notified of acceptance': 'سيتم إخطار المؤلفين بالقبول',
        'Forum Days': 'أيام المنتدى',
        'Main event at AlMaarefa University': 'الفعالية الرئيسية في جامعة المعرفة',

        // Stats
        'Expected Participants': 'المشاركون المتوقعون',
        'Research Tracks': 'مسارات البحث',
        'Awards & Prizes': 'الجوائز والمكافآت',
        'Partner Institutions': 'المؤسسات الشريكة',

        // Contact Section
        'Get in Touch': 'تواصل معنا',
        'Contact Us': 'اتصل بنا',
        'Have questions? Reach out to our organizing committee.': 'لديك أسئلة؟ تواصل مع اللجنة المنظمة.',
        'Email': 'البريد الإلكتروني',
        'Contact us for inquiries': 'تواصل معنا للاستفسارات',
        'Location': 'الموقع',
        'Riyadh, Saudi Arabia': 'الرياض، المملكة العربية السعودية',
        'Date': 'التاريخ',

        // Footer
        'Quick Links': 'روابط سريعة',
        'Home': 'الرئيسية',
        'About': 'عن المنتدى',
        'Timeline': 'الجدول الزمني',
        'Contact': 'اتصل بنا',
        'Tracks': 'المسارات',
        'All rights reserved.': 'جميع الحقوق محفوظة.',
        'Admin Panel': 'لوحة الإدارة'
    };

    let currentLang = localStorage.getItem('srif_lang') || 'en';

    // Apply saved language on load
    if (currentLang === 'ar') {
        applyArabic();
    }

    langToggle.addEventListener('click', () => {
        if (currentLang === 'en') {
            applyArabic();
            currentLang = 'ar';
        } else {
            applyEnglish();
            currentLang = 'en';
        }
        localStorage.setItem('srif_lang', currentLang);
    });

    function applyArabic() {
        document.body.classList.add('rtl');
        document.documentElement.lang = 'ar';

        // Toggle button text
        langToggle.querySelector('.lang-en').style.display = 'none';
        langToggle.querySelector('.lang-ar').style.display = 'inline';

        // Translate elements with data-ar attribute
        document.querySelectorAll('[data-ar]').forEach(el => {
            el.textContent = el.dataset.ar;
        });

        // Translate other text content
        translatePage(translations, 'ar');
    }

    function applyEnglish() {
        document.body.classList.remove('rtl');
        document.documentElement.lang = 'en';

        // Toggle button text
        langToggle.querySelector('.lang-en').style.display = 'inline';
        langToggle.querySelector('.lang-ar').style.display = 'none';

        // Restore elements with data-en attribute
        document.querySelectorAll('[data-en]').forEach(el => {
            el.textContent = el.dataset.en;
        });

        // Restore original text
        translatePage(translations, 'en');
    }

    function translatePage(dict, lang) {
        // Get all text nodes and translate
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        while (walker.nextNode()) {
            if (walker.currentNode.textContent.trim()) {
                textNodes.push(walker.currentNode);
            }
        }

        textNodes.forEach(node => {
            const text = node.textContent.trim();
            if (lang === 'ar' && dict[text]) {
                node.textContent = node.textContent.replace(text, dict[text]);
            } else if (lang === 'en') {
                // Find reverse translation
                for (const [en, ar] of Object.entries(dict)) {
                    if (text === ar) {
                        node.textContent = node.textContent.replace(ar, en);
                        break;
                    }
                }
            }
        });
    }
}
