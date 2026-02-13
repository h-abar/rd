// Admin Panel - Dynamic JavaScript with PostgreSQL Backend
const API_BASE = '/api/admin';
let authToken = localStorage.getItem('adminToken');
let currentUser = JSON.parse(localStorage.getItem('adminUser') || 'null');

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }

    // Set admin name
    if (currentUser) {
        document.getElementById('adminName').textContent = currentUser.name || 'Admin';
    }

    // Initialize
    initNavigation();
    initSidebar();
    initModal();
    loadDashboardData();
    initForms();
});

// API Helper
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...(options.headers || {})
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token expired
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = 'login.html';
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification('خطأ في الاتصال بالخادم', 'error');
        return null;
    }
}

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = this.dataset.page;

            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Show page
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(`page-${pageId}`).classList.add('active');

            // Load page-specific data
            if (pageId === 'dashboard') loadDashboardData();
            if (pageId === 'research') loadResearchTable();
            if (pageId === 'innovation') loadInnovationTable();
            if (pageId === 'news') loadNewsList();
            if (pageId === 'gallery') loadGallery();
            if (pageId === 'settings') loadSettings();
        });
    });
}

// Sidebar Toggle
function initSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    menuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    });
}

// Modal
let currentSubmission = null;
let currentType = null;

function initModal() {
    const modal = document.getElementById('submissionModal');
    const modalClose = document.getElementById('modalClose');

    modalClose?.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Approve button
    document.getElementById('btnApprove')?.addEventListener('click', async () => {
        if (currentSubmission && currentType) {
            await updateSubmissionStatus(currentType, currentSubmission.id, 'approved');
            modal.classList.remove('active');
        }
    });

    // Reject button
    document.getElementById('btnReject')?.addEventListener('click', async () => {
        if (currentSubmission && currentType) {
            await updateSubmissionStatus(currentType, currentSubmission.id, 'rejected');
            modal.classList.remove('active');
        }
    });

    // Download button
    document.getElementById('btnDownload')?.addEventListener('click', () => {
        if (currentSubmission && currentSubmission.file_path) {
            window.open(`/${currentSubmission.file_path}`, '_blank');
        } else {
            showNotification('لا يوجد ملف مرفق', 'warning');
        }
    });
}

// Dashboard Data
async function loadDashboardData() {
    const data = await apiRequest('/dashboard');
    if (!data || !data.success) return;

    const stats = data.data;

    document.getElementById('totalSubmissions').textContent = stats.totalSubmissions || 0;
    document.getElementById('researchCount').textContent = stats.researchCount || 0;
    document.getElementById('innovationCount').textContent = stats.innovationCount || 0;
    document.getElementById('approvedCount').textContent = stats.approvedCount || 0;

    // Recent submissions
    const tbody = document.getElementById('recentSubmissions');
    if (tbody && stats.recentSubmissions) {
        tbody.innerHTML = stats.recentSubmissions.map(s => `
            <tr>
                <td>${truncate(s.title, 30)}</td>
                <td>${s.author}</td>
                <td>${s.type === 'research' ? 'بحث علمي' : 'ابتكار'}</td>
                <td><span class="status ${s.status}">${getStatusAr(s.status)}</span></td>
                <td>${formatDate(s.created_at)}</td>
            </tr>
        `).join('');
    }
}

// Research Table
async function loadResearchTable() {
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const affiliationFilter = document.getElementById('affiliationFilter')?.value || '';

    let endpoint = '/research?';
    if (statusFilter) endpoint += `status=${statusFilter}&`;
    if (affiliationFilter) endpoint += `affiliation=${affiliationFilter}&`;

    const data = await apiRequest(endpoint);
    if (!data || !data.success) return;

    const tbody = document.getElementById('researchTable');
    if (tbody) {
        tbody.innerHTML = data.data.map(s => `
            <tr>
                <td>${s.submission_id}</td>
                <td>${truncate(s.title, 35)}</td>
                <td>${s.author_name}</td>
                <td>${s.email}</td>
                <td>${s.affiliation_name || '-'}</td>
                <td><span class="status ${s.status}">${getStatusAr(s.status)}</span></td>
                <td>${formatDate(s.created_at)}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn-sm view" onclick="viewSubmission('research', ${s.id})" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn-sm approve" onclick="quickUpdateStatus('research', ${s.id}, 'approved')" title="موافقة">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn-sm reject" onclick="quickUpdateStatus('research', ${s.id}, 'rejected')" title="رفض">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

// Innovation Table
async function loadInnovationTable() {
    const statusFilter = document.getElementById('innovationStatusFilter')?.value || '';

    let endpoint = '/innovation?';
    if (statusFilter) endpoint += `status=${statusFilter}&`;

    const data = await apiRequest(endpoint);
    if (!data || !data.success) return;

    const tbody = document.getElementById('innovationTable');
    if (tbody) {
        tbody.innerHTML = data.data.map(s => `
            <tr>
                <td>${s.submission_id}</td>
                <td>${truncate(s.title, 35)}</td>
                <td>${s.innovator_name}</td>
                <td>${s.email}</td>
                <td>${s.affiliation_name || '-'}</td>
                <td><span class="status ${s.status}">${getStatusAr(s.status)}</span></td>
                <td>${formatDate(s.created_at)}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn-sm view" onclick="viewSubmission('innovation', ${s.id})" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn-sm approve" onclick="quickUpdateStatus('innovation', ${s.id}, 'approved')" title="موافقة">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn-sm reject" onclick="quickUpdateStatus('innovation', ${s.id}, 'rejected')" title="رفض">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

// View submission details
async function viewSubmission(type, id) {
    const data = await apiRequest(`/submission/${type}/${id}`);
    if (!data || !data.success) return;

    const submission = data.data;
    currentSubmission = submission;
    currentType = type;

    const modalBody = document.getElementById('modalBody');
    const isResearch = type === 'research';

    modalBody.innerHTML = `
        <div class="submission-detail">
            <label>رقم الطلب</label>
            <p>${submission.submission_id}</p>
        </div>
        <div class="submission-detail">
            <label>العنوان</label>
            <p>${submission.title}</p>
        </div>
        <div class="submission-detail">
            <label>${isResearch ? 'الباحث الرئيسي' : 'المبتكر'}</label>
            <p>${isResearch ? submission.author_name : submission.innovator_name}</p>
        </div>
        <div class="submission-detail">
            <label>البريد الإلكتروني</label>
            <p>${submission.email}</p>
        </div>
        <div class="submission-detail">
            <label>${isResearch ? 'المشرف' : 'المرشد'}</label>
            <p>${isResearch ? submission.supervisor_name : submission.mentor_name}</p>
        </div>
        <div class="submission-detail">
            <label>الانتماء</label>
            <p>${submission.affiliation_name_ar || submission.affiliation_name || '-'}</p>
        </div>
        ${submission.team_members ? `
        <div class="submission-detail">
            <label>أعضاء الفريق</label>
            <p>${submission.team_members}</p>
        </div>
        ` : ''}
        <div class="submission-detail">
            <label>الحالة</label>
            <p><span class="status ${submission.status}">${getStatusAr(submission.status)}</span></p>
        </div>
        
        <div class="submission-section">
            <h4>${isResearch ? 'الخلفية والأهداف' : 'المشكلة'}</h4>
            <p>${isResearch ? submission.background : submission.problem_statement}</p>
        </div>
        <div class="submission-section">
            <h4>${isResearch ? 'المنهجية' : 'وصف الابتكار'}</h4>
            <p>${isResearch ? submission.methods : submission.innovation_description}</p>
        </div>
        <div class="submission-section">
            <h4>${isResearch ? 'النتائج' : 'الميزات الرئيسية'}</h4>
            <p>${isResearch ? submission.results : submission.key_features}</p>
        </div>
        <div class="submission-section">
            <h4>${isResearch ? 'الخلاصة' : 'التنفيذ والنطاق المستقبلي'}</h4>
            <p>${isResearch ? submission.conclusion : submission.implementation}</p>
        </div>
        
        ${submission.file_name ? `
        <div class="submission-detail">
            <label>الملف المرفق</label>
            <p><i class="fas fa-file-pdf"></i> ${submission.file_name}</p>
        </div>
        ` : ''}
    `;

    document.getElementById('submissionModal').classList.add('active');
}

// Quick update status
async function quickUpdateStatus(type, id, status) {
    if (!confirm(`هل أنت متأكد من ${status === 'approved' ? 'الموافقة على' : 'رفض'} هذا الطلب؟`)) {
        return;
    }

    await updateSubmissionStatus(type, id, status);
}

// Update submission status
async function updateSubmissionStatus(type, id, status) {
    const data = await apiRequest(`/submission/${type}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });

    if (data && data.success) {
        showNotification(`تم ${status === 'approved' ? 'الموافقة على' : 'رفض'} الطلب بنجاح`, 'success');
        loadDashboardData();
        if (type === 'research') loadResearchTable();
        if (type === 'innovation') loadInnovationTable();
    } else {
        showNotification('حدث خطأ في تحديث الطلب', 'error');
    }
}

// News List
async function loadNewsList() {
    const data = await apiRequest('/announcements');
    if (!data || !data.success) return;

    const container = document.getElementById('newsList');
    if (container) {
        container.innerHTML = data.data.map(n => `
            <div class="news-item">
                <div class="news-icon">
                    <i class="fas ${getNewsIcon(n.type)}"></i>
                </div>
                <div class="news-content">
                    <h4>${n.title_ar || n.title_en}</h4>
                    <p>${n.content_ar || n.content_en}</p>
                    <div class="news-meta">
                        <span><i class="fas fa-calendar"></i> ${formatDate(n.created_at)}</span>
                        <span><i class="fas fa-tag"></i> ${getTypeAr(n.type)}</span>
                        <span><i class="fas ${n.is_published ? 'fa-eye' : 'fa-eye-slash'}"></i> ${n.is_published ? 'منشور' : 'مسودة'}</span>
                    </div>
                </div>
                <div class="news-actions">
                    <button class="action-btn-sm reject" onclick="deleteNews(${n.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('') || '<p style="text-align:center; color: var(--gray-500);">لا توجد إعلانات</p>';
    }
}

// Get news icon
function getNewsIcon(type) {
    const icons = {
        news: 'fa-newspaper',
        announcement: 'fa-bullhorn',
        deadline: 'fa-clock'
    };
    return icons[type] || 'fa-info-circle';
}

// Get type in Arabic
function getTypeAr(type) {
    const types = {
        news: 'خبر',
        announcement: 'إعلان',
        deadline: 'موعد نهائي'
    };
    return types[type] || type;
}

// Delete news
async function deleteNews(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;

    const data = await apiRequest(`/announcements/${id}`, { method: 'DELETE' });
    if (data && data.success) {
        showNotification('تم حذف الإعلان بنجاح', 'success');
        loadNewsList();
    }
}

// Load settings
async function loadSettings() {
    const data = await apiRequest('/settings');
    if (!data || !data.success) return;

    const settings = data.data;
    settings.forEach(s => {
        const input = document.getElementById(s.key);
        if (input) input.value = s.value;
    });
}

// Forms
function initForms() {
    // News form
    const newsForm = document.getElementById('newsForm');
    newsForm?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = {
            titleEn: document.getElementById('newsTitle').value,
            titleAr: document.getElementById('newsTitleAr')?.value || '',
            type: document.getElementById('newsType').value,
            contentEn: document.getElementById('newsContent').value,
            contentAr: document.getElementById('newsContentAr')?.value || '',
            isPublished: true
        };

        const data = await apiRequest('/announcements', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (data && data.success) {
            showNotification('تم نشر الإعلان بنجاح', 'success');
            this.reset();
            loadNewsList();
        }
    });

    // Settings form
    const settingsForm = document.getElementById('settingsForm');
    settingsForm?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const updates = {
            event_name_en: document.getElementById('event_name_en')?.value,
            event_name_ar: document.getElementById('event_name_ar')?.value,
            event_start_date: document.getElementById('event_start_date')?.value,
            event_end_date: document.getElementById('event_end_date')?.value,
            submission_deadline: document.getElementById('submission_deadline')?.value,
            contact_email: document.getElementById('contact_email')?.value,
            submissions_open: document.getElementById('submissions_open')?.checked ? 'true' : 'false'
        };

        const data = await apiRequest('/settings', {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });

        if (data && data.success) {
            showNotification('تم حفظ الإعدادات بنجاح', 'success');
        }
    });

    // Export handlers
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            const action = this.dataset.action;
            if (action.startsWith('export')) {
                e.preventDefault();
                const type = action.includes('research') ? 'research' :
                    action.includes('innovation') ? 'innovation' : 'all';
                await handleExport(type);
            }
        });
    });

    // Filter handlers
    document.getElementById('statusFilter')?.addEventListener('change', loadResearchTable);
    document.getElementById('affiliationFilter')?.addEventListener('change', loadResearchTable);
    document.getElementById('innovationStatusFilter')?.addEventListener('change', loadInnovationTable);
}

// Export
async function handleExport(type) {
    if (type === 'all') {
        // Export both
        await handleExport('research');
        await handleExport('innovation');
        return;
    }

    const data = await apiRequest(`/export/${type}?format=json`);
    if (!data || !data.success || !data.data.length) {
        showNotification('لا توجد بيانات للتصدير', 'warning');
        return;
    }

    // Generate CSV
    const submissions = data.data;
    const headers = ['ID', 'Title', 'Author', 'Email', 'Affiliation', 'Status', 'Date'];
    const rows = submissions.map(s => [
        s.submission_id,
        `"${(s.title || '').replace(/"/g, '""')}"`,
        `"${(s.author_name || s.innovator_name || '').replace(/"/g, '""')}"`,
        s.email,
        `"${(s.affiliation_name || '').replace(/"/g, '""')}"`,
        s.status,
        new Date(s.created_at).toISOString().split('T')[0]
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_submissions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('تم تصدير البيانات بنجاح', 'success');
}

// Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

// Utility functions
function truncate(str, length) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
}

function getStatusAr(status) {
    const statuses = {
        pending: 'قيد المراجعة',
        approved: 'مقبول',
        rejected: 'مرفوض',
        revision: 'يحتاج تعديل'
    };
    return statuses[status] || status;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Make functions globally accessible
window.viewSubmission = viewSubmission;
window.quickUpdateStatus = quickUpdateStatus;
window.deleteNews = deleteNews;
window.deleteGalleryImage = deleteGalleryImage;

// ==================== GALLERY FUNCTIONS ====================

async function loadGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = '<p style="text-align:center;padding:40px;color:#64748b;"><i class="fas fa-spinner fa-spin"></i> Loading gallery...</p>';

    const result = await apiRequest('/gallery');
    if (!result || !result.success) {
        grid.innerHTML = '<p style="text-align:center;padding:40px;color:#ef4444;">Failed to load gallery</p>';
        return;
    }

    if (result.data.length === 0) {
        grid.innerHTML = '<p style="text-align:center;padding:40px;color:#64748b;"><i class="fas fa-images"></i> No images uploaded yet</p>';
        return;
    }

    grid.innerHTML = result.data.map(img => `
        <div class="gallery-item" data-id="${img.id}">
            <img src="/${img.image_path}" alt="${img.caption_en || 'Gallery image'}" loading="lazy" onclick="window.open('/${img.image_path}','_blank')">
            <div class="gallery-item-info">
                <p class="gallery-caption">${img.caption_en || img.caption_ar || 'No caption'}</p>
                <span class="gallery-category">${img.category}</span>
            </div>
            <div class="gallery-item-actions">
                <button class="btn-icon btn-danger" onclick="deleteGalleryImage(${img.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function deleteGalleryImage(id) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    const result = await apiRequest(`/gallery/${id}`, { method: 'DELETE' });
    if (result && result.success) {
        showNotification('Image deleted successfully', 'success');
        loadGallery();
    }
}

// Gallery Form Handler
function initGalleryForm() {
    const form = document.getElementById('galleryForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('galleryImage');
        if (!fileInput.files[0]) {
            showNotification('Please select an image', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('captionEn', document.getElementById('galleryCaptionEn').value);
        formData.append('captionAr', document.getElementById('galleryCaptionAr').value);
        formData.append('category', document.getElementById('galleryCategory').value);

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        try {
            const response = await fetch(`${API_BASE}/gallery`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                showNotification('Image uploaded successfully!', 'success');
                form.reset();
                loadGallery();
            } else {
                showNotification(result.message || 'Upload failed', 'error');
            }
        } catch (error) {
            showNotification('Failed to upload image', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
        }
    });
}

// Initialize gallery form on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initGalleryForm);
