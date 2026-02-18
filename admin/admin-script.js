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
            if (pageId === 'gallery') loadGallery();
            if (pageId === 'settings') loadSettings();
            if (pageId === 'committees') loadCommittees();
            if (pageId === 'speakers') loadSpeakers();
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
        <div class="submission-detail">
            <label>نوع العرض</label>
            <p style="font-weight: bold; color: var(--primary);">${submission.presentation_type || 'غير محدد'}</p>
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
    // News form (with image upload)
    const newsForm = document.getElementById('newsForm');
    newsForm?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append('titleEn', document.getElementById('newsTitle').value);
        formData.append('titleAr', document.getElementById('newsTitleAr')?.value || '');
        formData.append('type', document.getElementById('newsType').value);
        formData.append('contentEn', document.getElementById('newsContent').value);
        formData.append('contentAr', document.getElementById('newsContentAr')?.value || '');
        formData.append('isPublished', 'true');

        const imageFile = document.getElementById('newsImage')?.files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

        try {
            const response = await fetch(`${API_BASE}/announcements`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });

            const data = await response.json();
            if (data && data.success) {
                showNotification('تم نشر الإعلان بنجاح', 'success');
                this.reset();
                loadNewsList();
            } else {
                showNotification(data.message || 'فشل النشر', 'error');
            }
        } catch (error) {
            showNotification('فشل النشر', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
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
// Export
async function handleExport(type) {
    if (type === 'all') {
        await handleExport('research');
        await handleExport('innovation');
        return;
    }

    const btn = document.querySelector(`[data-action="export-${type}"]`);
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
    }

    try {
        const response = await fetch(`${API_BASE}/export/${type}?format=csv`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.status === 404) {
            showNotification('No data to export', 'warning');
            return;
        }

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_submissions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('Export successful', 'success');
    } catch (error) {
        console.error(error);
        showNotification('Export failed', 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
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

// Committees Management
async function loadCommittees() {
    const list = document.getElementById('committeesList');
    if (!list) return;

    list.innerHTML = '<div class="text-center p-5"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const response = await fetch('/api/committees');
        const data = await response.json();

        if (!data.success) throw new Error(data.message);

        const committees = data.data;
        if (committees.length === 0) {
            list.innerHTML = '<div class="text-center p-5">No committees found. Create one above.</div>';
            return;
        }

        list.innerHTML = committees.map(c => `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center" style="display: flex; justify-content: space-between;">
                    <h3>${c.name_en} / ${c.name_ar}</h3>
                    <button class="btn-danger btn-sm" onclick="deleteCommittee(${c.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;"><i class="fas fa-trash"></i> Delete</button>
                </div>
                <div class="card-body">
                    <h4 class="mb-3" style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Members</h4>
                    <div class="members-list mb-3" id="members-${c.id}">
                        ${c.members && c.members.length > 0 ? c.members.map(m => `
                            <div class="member-item" style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #f8f9fa;">
                                <img src="/${m.image_path || 'images/default-avatar.png'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 15px; border: 1px solid #ddd;">
                                <div style="flex: 1;">
                                    <strong>${m.name_en}</strong> <span class="text-muted">(${m.role_en || '-'})</span><br>
                                    <small>${m.name_ar} <span class="text-muted">(${m.role_ar || '-'})</span></small>
                                </div>
                                <button class="btn-icon delete" onclick="deleteMember(${m.id})" style="color: #dc3545; background: none; border: none; cursor: pointer;"><i class="fas fa-times"></i></button>
                            </div>
                        `).join('') : '<p class="text-muted">No members yet.</p>'}
                    </div>
                    
                    <div class="add-member-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <h5 style="margin-bottom: 15px;"><i class="fas fa-user-plus"></i> Add New Member</h5>
                        <form onsubmit="event.preventDefault(); addMember(this, ${c.id})">
                            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <input type="text" name="name_en" placeholder="Name (English)" required class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <input type="text" name="name_ar" placeholder="Name (Arabic)" required dir="rtl" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <input type="text" name="role_en" placeholder="Role (English)" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <input type="text" name="role_ar" placeholder="Role (Arabic)" dir="rtl" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <div style="grid-column: span 2;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">Member Photo</label>
                                    <input type="file" name="image" accept="image/*" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: white;">
                                </div>
                            </div>
                            <button type="submit" class="btn-primary" style="margin-top: 15px; width: 100%;">Add Member</button>
                        </form>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        list.innerHTML = `<div class="alert alert-danger" style="color: red; padding: 20px; background: #fff3f3; border: 1px solid #ffc9c9; border-radius: 5px;">Error loading committees: ${error.message}</div>`;
    }
}

// Create Committee Form
document.getElementById('createCommitteeForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name_en = document.getElementById('committeeNameEn').value;
    const name_ar = document.getElementById('committeeNameAr').value;
    const btn = this.querySelector('button[type="submit"]');

    // Simple validation
    if (!name_en || !name_ar) {
        alert('Please fill in both names');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

    try {
        const response = await fetch('/api/committees/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name_en, name_ar })
        });
        const data = await response.json();

        if (data.success) {
            this.reset();
            loadCommittees();
            alert('Committee created successfully');
        } else {
            alert(data.message || 'Error creating committee');
        }
    } catch (error) {
        alert('Server error');
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create Committee';
    }
});

// Delete Committee
async function deleteCommittee(id) {
    if (!confirm('Are you sure you want to delete this committee and all its members?')) return;

    try {
        const response = await fetch(`/api/committees/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
            loadCommittees();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error deleting committee');
    }
}

// Add Member
async function addMember(form, committeeId) {
    const formData = new FormData(form);
    formData.append('committee_id', committeeId);

    // Add loading state to button
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Adding...';

    try {
        const response = await fetch('/api/committees/member/add', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            form.reset();
            loadCommittees();
            // alert('Member added successfully'); // No need for alert if it updates UI
        } else {
            alert(data.message || 'Error adding member');
        }
    } catch (error) {
        alert('Error adding member');
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// Delete Member
async function deleteMember(memberId) {
    if (!confirm('Remove this member?')) return;

    try {
        const response = await fetch(`/api/committees/member/${memberId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
            loadCommittees();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error removing member');
    }
}

/* Speakers Management */
function loadSpeakers() {
    const list = document.getElementById('speakersList');
    if (!list) return;

    list.innerHTML = '<div class="text-center p-5"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    fetch('/api/speakers', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(res => res.json())
        .then(data => {
            if (!data.success) throw new Error(data.message);

            const speakers = data.data;
            if (speakers.length === 0) {
                list.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-user-slash" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>No speakers added yet. The "Stay Tuned" message will be shown on the homepage.</p>
                </div>
            `;
                return;
            }

            list.innerHTML = speakers.map(speaker => `
            <div class="card speaker-card" style="box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 10px; overflow: hidden; background: #fff;">
                <div style="height: 200px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8f9fa;">
                    ${speaker.image_path ?
                    `<img src="/${speaker.image_path}" alt="${speaker.name_en}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    `<i class="fas fa-user" style="font-size: 4rem; color: #ccc;"></i>`
                }
                </div>
                <div class="card-body" style="padding: 15px;">
                    <span class="badge" style="background: #e3f2fd; color: #0d47a1; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; margin-bottom: 10px; display: inline-block;">${speaker.speaker_type}</span>
                    <h5 style="margin: 0 0 5px; font-weight: 600;">${speaker.name_en}</h5>
                    <p style="margin: 0 0 10px; color: #666; font-size: 0.9rem;">${speaker.role_en}</p>
                    <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px; text-align: right;">
                        <button onclick="deleteSpeaker(${speaker.id})" class="btn-danger-sm" style="background: #ffebee; color: #c62828; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        })
        .catch(err => {
            console.error(err);
            list.innerHTML = '<div class="text-danger p-5">Error loading speakers</div>';
        });
}

async function deleteSpeaker(id) {
    if (!confirm('Delete this speaker?')) return;

    try {
        const res = await fetch(`/api/speakers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.success) {
            loadSpeakers();
        } else {
            alert('Error deleting speaker');
        }
    } catch (e) {
        console.error(e);
        alert('Server Error');
    }
}

// Add Speaker Form Helper
document.getElementById('createSpeakerForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    const formData = new FormData(this);

    try {
        const res = await fetch('/api/speakers/create', {
            method: 'POST',
            body: formData,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();

        if (data.success) {
            this.reset();
            loadSpeakers();
            alert('Speaker added successfully');
        } else {
            alert(data.message || 'Error adding speaker');
        }
    } catch (e) {
        console.error(e);
        alert('Server Error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// Expose functions globally
window.addMember = addMember;
window.deleteMember = deleteMember;
window.deleteCommittee = deleteCommittee;
window.deleteSpeaker = deleteSpeaker;
window.loadSpeakers = loadSpeakers;
