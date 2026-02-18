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
    initPublicNews();
    initPublicGallery();
    initPublicSpeakers();
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
    // if (!langToggle) return; // Removed early return to ensure updateLanguage is exposed

    let currentLang = localStorage.getItem('srif_lang') || 'en';
    const updateUI = (lang) => {
        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
        document.body.classList.toggle('rtl', lang === 'ar');
        if (langToggle) langToggle.textContent = (lang === 'ar') ? 'English' : 'العربية';

        document.querySelectorAll('[data-en]').forEach(el => {
            el.textContent = el.getAttribute(`data-${lang}`);
        });
        document.querySelectorAll('[data-placeholder-en]').forEach(el => {
            el.placeholder = el.getAttribute(`data-placeholder-${lang}`);
        });
        localStorage.setItem('srif_lang', lang);
    };

    // Expose for external use (e.g. committee.html)
    window.updateLanguage = () => updateUI(localStorage.getItem('srif_lang') || 'en');

    updateUI(currentLang);

    if (langToggle) {
        langToggle.addEventListener('click', () => {
            currentLang = (currentLang === 'en') ? 'ar' : 'en';
            updateUI(currentLang);
        });
    }
}

// ==================== PUBLIC NEWS ====================
let allNewsItems = [];

function initPublicNews() {
    const container = document.getElementById('publicNewsList');
    if (!container) return;

    const lang = localStorage.getItem('srif_lang') || 'en';

    fetch('/api/news')
        .then(res => res.json())
        .then(data => {
            if (!data.success || !data.data.length) {
                container.innerHTML = `
                    <div class="news-empty">
                        <i class="fas fa-newspaper"></i>
                        <p>${lang === 'ar' ? 'لا توجد أخبار متاحة حالياً' : 'No news available yet'}</p>
                    </div>`;
                return;
            }

            allNewsItems = data.data;
            renderNewsCards(lang);
        })
        .catch(() => {
            container.innerHTML = `
                <div class="news-empty">
                    <i class="fas fa-newspaper"></i>
                    <p>${lang === 'ar' ? 'لا توجد أخبار متاحة حالياً' : 'No news available yet'}</p>
                </div>`;
        });
}

function renderNewsCards(lang) {
    const container = document.getElementById('publicNewsList');
    if (!container || !allNewsItems.length) return;

    container.innerHTML = allNewsItems.map(item => {
        const title = lang === 'ar' && item.title_ar ? item.title_ar : item.title_en;
        const content = lang === 'ar' && item.content_ar ? item.content_ar : item.content_en;
        const typeClass = item.type === 'deadline' ? 'deadline-type' :
            item.type === 'announcement' ? 'announcement-type' : 'news-type';
        const typeLabel = lang === 'ar' ?
            (item.type === 'deadline' ? 'موعد نهائي' : item.type === 'announcement' ? 'إعلان' : 'خبر') :
            item.type.charAt(0).toUpperCase() + item.type.slice(1);
        const date = new Date(item.published_at || item.created_at);
        const dateStr = date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US',
            { month: 'short', day: 'numeric', year: 'numeric' });

        const imageHtml = item.image_path
            ? `<div class="news-card-image"><img src="/${item.image_path}" alt="${title}" loading="lazy"></div>`
            : `<div class="news-card-image news-card-no-image"><i class="fas fa-newspaper"></i></div>`;

        return `
            <div class="news-card" onclick="openNewsDetail(${item.id})" style="cursor:pointer;" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                ${imageHtml}
                <div class="news-card-header">
                    <span class="news-type-badge ${typeClass}">
                        <i class="fas fa-${item.type === 'deadline' ? 'clock' : item.type === 'announcement' ? 'bullhorn' : 'newspaper'}"></i>
                        ${typeLabel}
                    </span>
                    <span class="news-date">${dateStr}</span>
                </div>
                <div class="news-card-body">
                    <h3>${title}</h3>
                    <p>${content}</p>
                </div>
            </div>
        `;
    }).join('');
}

function openNewsDetail(id) {
    const lang = localStorage.getItem('srif_lang') || 'en';
    const item = allNewsItems.find(n => n.id === id);
    if (!item) return;

    const title = lang === 'ar' && item.title_ar ? item.title_ar : item.title_en;
    const content = lang === 'ar' && item.content_ar ? item.content_ar : item.content_en;
    const typeLabel = lang === 'ar' ?
        (item.type === 'deadline' ? 'موعد نهائي' : item.type === 'announcement' ? 'إعلان' : 'خبر') :
        item.type.charAt(0).toUpperCase() + item.type.slice(1);
    const date = new Date(item.published_at || item.created_at);
    const dateStr = date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US',
        { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const typeClass = item.type === 'deadline' ? 'deadline-type' :
        item.type === 'announcement' ? 'announcement-type' : 'news-type';

    // Create modal
    let modal = document.getElementById('newsDetailModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'newsDetailModal';
    modal.className = 'news-detail-modal active';
    modal.dir = lang === 'ar' ? 'rtl' : 'ltr';
    modal.innerHTML = `
        <div class="news-detail-overlay" onclick="closeNewsDetail()"></div>
        <div class="news-detail-content">
            <button class="news-detail-close" onclick="closeNewsDetail()"><i class="fas fa-times"></i></button>
            ${item.image_path ? `<div class="news-detail-image"><img src="/${item.image_path}" alt="${title}"></div>` : ''}
            <div class="news-detail-body">
                <div class="news-detail-meta">
                    <span class="news-type-badge ${typeClass}">
                        <i class="fas fa-${item.type === 'deadline' ? 'clock' : item.type === 'announcement' ? 'bullhorn' : 'newspaper'}"></i>
                        ${typeLabel}
                    </span>
                    <span class="news-detail-date"><i class="far fa-calendar-alt"></i> ${dateStr}</span>
                </div>
                <h2 class="news-detail-title">${title}</h2>
                <div class="news-detail-text">${content.replace(/\n/g, '<br>')}</div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Close on ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') closeNewsDetail();
    };
    document.addEventListener('keydown', escHandler);
    modal._escHandler = escHandler;
}

function closeNewsDetail() {
    const modal = document.getElementById('newsDetailModal');
    if (modal) {
        if (modal._escHandler) document.removeEventListener('keydown', modal._escHandler);
        modal.remove();
        document.body.style.overflow = '';
    }
}

window.openNewsDetail = openNewsDetail;
window.closeNewsDetail = closeNewsDetail;

// ==================== PUBLIC GALLERY ====================
let galleryImages = [];
let currentImageIndex = 0;

function initPublicGallery() {
    const container = document.getElementById('publicGalleryGrid');
    if (!container) return;

    const lang = document.documentElement.lang || 'en';

    // Load gallery images
    fetch('/api/gallery')
        .then(res => res.json())
        .then(data => {
            if (!data.success || !data.data.length) {
                container.innerHTML = `
                    <div class="gallery-empty">
                        <i class="fas fa-images"></i>
                        <p data-en="Gallery coming soon" data-ar="المعرض قريباً">
                            ${lang === 'ar' ? 'المعرض قريباً' : 'Gallery coming soon'}</p>
                    </div>`;
                return;
            }

            galleryImages = data.data;
            renderGallery(galleryImages);
        })
        .catch(() => {
            container.innerHTML = `
                <div class="gallery-empty">
                    <i class="fas fa-images"></i>
                    <p>${lang === 'ar' ? 'المعرض قريباً' : 'Gallery coming soon'}</p>
                </div>`;
        });

    // Filter buttons
    const filterBtns = document.querySelectorAll('.gallery-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            if (category === 'all') {
                renderGallery(galleryImages);
            } else {
                renderGallery(galleryImages.filter(img => img.category === category));
            }
        });
    });

    // Lightbox
    initLightbox();
}

// ... existing gallery render ...

function initPublicSpeakers() {
    const grid = document.getElementById('publicSpeakersGrid');
    const placeholder = document.getElementById('speakersPlaceholder');
    if (!grid) return;

    fetch('/api/speakers')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data.length > 0) {
                if (placeholder) placeholder.style.display = 'none';
                grid.style.display = 'grid';
                grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
                grid.style.gap = '30px';
                grid.style.marginTop = '40px';

                const lang = document.documentElement.lang || 'en';

                grid.innerHTML = data.data.map(s => {
                    const name = lang === 'ar' ? s.name_ar : s.name_en;
                    const role = lang === 'ar' ? s.role_ar : s.role_en;

                    return `
                <div class="speaker-card" data-aos="fade-up" style="background: #fff; padding: 30px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); text-align: center; transition: transform 0.3s;">
                    <div class="speaker-img" style="width: 140px; height: 140px; margin: 0 auto 20px; border-radius: 50%; overflow: hidden; border: 4px solid #00d4ff;">
                        <img src="/${s.image_path || 'images/unnamed.webp'}" alt="Speaker" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <h3 style="margin: 0 0 10px; color: #1e293b; font-size: 1.25rem; font-weight: 700;">
                        <span data-en="${s.name_en}" data-ar="${s.name_ar}">${name}</span>
                    </h3>
                    <p style="margin: 0 0 15px; color: #64748b; font-size: 0.95rem; font-weight: 500;">
                        <span data-en="${s.role_en}" data-ar="${s.role_ar}">${role}</span>
                    </p>
                    ${s.speaker_type ? `<span class="badge" style="background: rgba(0, 212, 255, 0.1); color: #0096c7; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; display: inline-block;">${s.speaker_type}</span>` : ''}
                </div>
                `;
                }).join('');
            } else {
                if (placeholder) placeholder.style.display = 'block';
                grid.style.display = 'none';
            }
        })
        .catch(console.error);
}

function renderGallery(images) {
    const container = document.getElementById('publicGalleryGrid');
    const lang = document.documentElement.lang || 'en';

    if (!images.length) {
        container.innerHTML = `
            <div class="gallery-empty">
                <i class="fas fa-images"></i>
                <p>${lang === 'ar' ? 'لا توجد صور في هذا التصنيف' : 'No images in this category'}</p>
            </div>`;
        return;
    }

    container.innerHTML = images.map((img, index) => {
        const caption = lang === 'ar' && img.caption_ar ? img.caption_ar : (img.caption_en || '');
        return `
            <div class="gallery-card" onclick="openLightbox(${index})">
                <img src="/${img.image_path}" alt="${caption}" loading="lazy">
                <div class="gallery-card-overlay">
                    ${caption ? `<p>${caption}</p>` : ''}
                    <span>${img.category}</span>
                </div>
            </div>
        `;
    }).join('');
}

function initLightbox() {
    const modal = document.getElementById('lightboxModal');
    if (!modal) return;

    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', () => navigateLightbox(-1));
    document.getElementById('lightboxNext').addEventListener('click', () => navigateLightbox(1));

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
}

function openLightbox(index) {
    const filtered = getFilteredImages();
    if (!filtered.length) return;
    currentImageIndex = index;
    const img = filtered[index];
    const lang = document.documentElement.lang || 'en';
    const caption = lang === 'ar' && img.caption_ar ? img.caption_ar : (img.caption_en || '');

    document.getElementById('lightboxImage').src = `/${img.image_path}`;
    document.getElementById('lightboxCaption').textContent = caption;
    document.getElementById('lightboxModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightboxModal').classList.remove('active');
    document.body.style.overflow = '';
}

function navigateLightbox(dir) {
    const filtered = getFilteredImages();
    currentImageIndex = (currentImageIndex + dir + filtered.length) % filtered.length;
    const img = filtered[currentImageIndex];
    const lang = document.documentElement.lang || 'en';
    const caption = lang === 'ar' && img.caption_ar ? img.caption_ar : (img.caption_en || '');

    const imgEl = document.getElementById('lightboxImage');
    imgEl.style.opacity = 0;
    setTimeout(() => {
        imgEl.src = `/${img.image_path}`;
        document.getElementById('lightboxCaption').textContent = caption;
        imgEl.style.opacity = 1;
    }, 200);
}

function getFilteredImages() {
    const activeFilter = document.querySelector('.gallery-filter-btn.active');
    const category = activeFilter ? activeFilter.dataset.category : 'all';
    return category === 'all' ? galleryImages : galleryImages.filter(i => i.category === category);
}

window.openLightbox = openLightbox;
