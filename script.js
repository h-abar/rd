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

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() { this.reset(); }
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

    const particleCount = Math.min(80, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();
}

function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 100);
    });
}

function initNavigation() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                navMenu?.classList.remove('active');
                mobileToggle?.classList.remove('active');
            }
        });
    });
}

function initCountdown() {
    const countdownElement = document.getElementById('countdownTimer');
    if (!countdownElement) return;

    // Target Date: 5 May 2026
    const targetDate = new Date('May 5, 2026 09:00:00').getTime();

    function update() {
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff < 0) {
            // Event started
            document.getElementById('days').innerText = "00";
            document.getElementById('hours').innerText = "00";
            document.getElementById('mins').innerText = "00";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        const dElem = document.getElementById('days');
        const hElem = document.getElementById('hours');
        const mElem = document.getElementById('mins');

        if (dElem) dElem.innerText = days.toString().padStart(2, '0');
        if (hElem) hElem.innerText = hours.toString().padStart(2, '0');
        if (mElem) mElem.innerText = minutes.toString().padStart(2, '0');
    }

    update(); // Run immediately
    setInterval(update, 60000); // Update every minute
}

function initScrollAnimations() {
    const options = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, options);
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.dataset.count);
                if (isNaN(target)) return;

                const duration = 2000; // 2 seconds
                const frameDuration = 1000 / 60; // 60fps
                const totalFrames = Math.round(duration / frameDuration);
                let frame = 0;

                const easeOutQuad = t => t * (2 - t);

                const timer = setInterval(() => {
                    frame++;
                    const progress = easeOutQuad(frame / totalFrames);
                    const currentCount = Math.round(target * progress);

                    if (frame === totalFrames) {
                        counter.innerText = target; // Ensure exact final number
                        clearInterval(timer);
                    } else {
                        counter.innerText = currentCount;
                    }
                }, frameDuration);

                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
}

function initFormHandlers() {
    const form = document.getElementById('abstractForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.btn-submit');
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            const formData = new FormData(form);
            const type = window.location.pathname.includes('innovation') ? 'innovation' : 'research';
            const response = await fetch(`/api/submissions/${type}`, { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success) {
                alert(document.documentElement.lang === 'ar' ? 'تم الإرسال بنجاح!' : 'Submitted successfully!');
                form.reset();
            } else {
                alert(data.message || (document.documentElement.lang === 'ar' ? 'فشل الإرسال' : 'Submission failed'));
            }
        } catch (error) {
            alert('Error connecting to server.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });

    const extRadio = form.querySelector('input[name="affiliation"][value="external"]');
    const radios = form.querySelectorAll('input[name="affiliation"]');
    const extBox = document.getElementById('externalInstitution');
    radios.forEach(r => r.addEventListener('change', () => {
        if (extBox) extBox.style.display = extRadio.checked ? 'block' : 'none';
        if (extBox) extBox.querySelector('input').required = extRadio.checked;
    }));
}

function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const submitBtn = document.getElementById('contactSubmitBtn');
        const originalHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
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
                const successMsg = document.getElementById('contactSuccess');
                if (successMsg) {
                    successMsg.style.display = 'block';
                    setTimeout(() => successMsg.style.display = 'none', 5000);
                }
            } else {
                alert(data.message || 'Failed to send message.');
            }
        } catch (error) {
            alert('Connection error. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
        }
    });
}

function initLanguageSwitcher() {
    const langToggle = document.getElementById('langToggle');
    if (!langToggle) return;
    let currentLang = localStorage.getItem('srif_lang') || 'en';
    const updateUI = (lang) => {
        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
        document.body.classList.toggle('rtl', lang === 'ar');
        langToggle.textContent = (lang === 'ar') ? 'English' : 'العربية';
        document.querySelectorAll('[data-en]').forEach(el => {
            el.textContent = el.getAttribute(`data-${lang}`);
        });
        document.querySelectorAll('[data-placeholder-en]').forEach(el => {
            el.placeholder = el.getAttribute(`data-placeholder-${lang}`);
        });
        localStorage.setItem('srif_lang', lang);
    };
    updateUI(currentLang);
    langToggle.addEventListener('click', () => {
        currentLang = (currentLang === 'en') ? 'ar' : 'en';
        updateUI(currentLang);
    });
}
