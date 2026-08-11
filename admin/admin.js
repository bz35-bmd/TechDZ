/* ============================================
   TechDZ Admin — Script
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const dtLocale = window.__lang === 'ar' ? 'ar-DZ' : window.__lang === 'en' ? 'en-US' : 'fr-FR';
  const d = (x) => new Date(x).toLocaleDateString(dtLocale);
  const roleName = (rr) => rr === 'admin' ? t('common.admin') : rr === 'moderator' ? t('common.moderator') : t('common.member');
  // ==========================================
  // Bouton Actualiser — attaché immédiatement (même si l'init Supabase échoue)
  // ==========================================
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + t('admin.refreshing');
      refreshBtn.disabled = true;
      loadStats()
        .then(() => {
          refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> ' + t('admin.refresh');
          refreshBtn.disabled = false;
          const alertEl = document.getElementById('dashboardError');
          if (alertEl) alertEl.style.display = 'none';
        })
        .catch((err) => {
          console.error('Erreur actualisation:', err);
          refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> ' + t('admin.refresh');
          refreshBtn.disabled = false;
          const alertEl = document.getElementById('dashboardError');
          if (alertEl) {
            alertEl.textContent = t('admin.refreshError') + (err && err.message ? err.message : t('common.unknown'));
            alertEl.style.display = 'block';
          }
        });
    });
  }

  // Init Supabase
  const ok = Auth.init();
  console.log('Auth.init():', ok);
  if (!ok) {
    console.error('Auth init failed');
    return;
  }

  // Check auth
  const { user, error: userError } = await Auth.getUser();
  console.log('User:', user?.email, 'Error:', userError);
  if (user && !Auth.isEmailConfirmed(user)) {
    await Auth.signOut('../login.html');
    return;
  }
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const isAdmin = await Auth.isAdmin(user.id);
  console.log('Is admin:', isAdmin);
  if (!isAdmin) {
    window.location.href = 'login.html';
    return;
  }

  // Load profile
  const { data: profile } = await Auth.getProfile(user.id);
  if (profile) {
    document.getElementById('sidebarName').textContent = profile.full_name || t('common.admin');
    document.getElementById('sidebarAvatar').textContent = (profile.full_name || 'A')[0].toUpperCase();
  }

  // ==========================================
  // Sidebar Navigation
  // ==========================================
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const sections = document.querySelectorAll('.admin-section');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Liens vers d'autres pages (ex: stats.html) → navigation normale
      const href = link.getAttribute('href');
      if (href && href !== '#') return;
      e.preventDefault();
      const page = link.getAttribute('data-page');

      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      sections.forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${page}`).classList.add('active');

      // Load data for section
      loadSection(page);
    });
  });

  // ==========================================
  // Load Stats
  // ==========================================
  async function loadStats() {
    const stats = await DB.getAdminStats();
    document.getElementById('statUsers').textContent = stats.users.toLocaleString();
    document.getElementById('statCities').textContent = stats.cities.toLocaleString();
    document.getElementById('statPosts').textContent = stats.posts.toLocaleString();
    document.getElementById('statReplies').textContent = stats.replies.toLocaleString();
    document.getElementById('statJobs').textContent = stats.jobsTotal.toLocaleString();
    document.getElementById('statCourses').textContent = stats.coursesTotal.toLocaleString();
    document.getElementById('statEnrollments').textContent = stats.courseEnrollments.toLocaleString();
    document.getElementById('statEvents').textContent = stats.eventsTotal.toLocaleString();
    document.getElementById('statRegistrations').textContent = stats.eventRegistrations.toLocaleString();
    document.getElementById('statNews').textContent = stats.newsTotal.toLocaleString();
    document.getElementById('statNewsViews').textContent = stats.newsViews.toLocaleString();
    document.getElementById('usersCount').textContent = stats.users;
    document.getElementById('networkingCount').textContent = stats.users;
    document.getElementById('postsCount').textContent = stats.posts;
    document.getElementById('jobsCount').textContent = stats.jobsTotal;
    document.getElementById('coursesCount').textContent = stats.coursesTotal;
    document.getElementById('eventsCount').textContent = stats.eventsTotal;
    document.getElementById('newsCount').textContent = stats.newsTotal;

    // Aperçu par page
    const rows = [
      [t('admin.users'), 'fas fa-users', stats.users, stats.users, `${stats.cities} ${t('admin.citiesInfo')}`],
      [t('admin.forum'), 'fas fa-comments', stats.posts, stats.posts, `${stats.replies} ${t('admin.repliesInfo')}`],
      [t('admin.jobs'), 'fas fa-briefcase', stats.jobsActive, stats.jobsTotal, ''],
      [t('admin.courses'), 'fas fa-graduation-cap', stats.coursesPublished, stats.coursesTotal, `${stats.courseEnrollments} ${t('admin.enrollmentsInfo')}`],
      [t('admin.events'), 'fas fa-calendar-alt', stats.eventsActive, stats.eventsTotal, `${stats.eventRegistrations} ${t('admin.participantsInfo')}`],
      [t('admin.news'), 'fas fa-newspaper', stats.newsPublished, stats.newsTotal, `${stats.newsViews} ${t('admin.viewsInfo')}`],
      [t('admin.networking'), 'fas fa-handshake', stats.users, stats.users, `${stats.cities} ${t('admin.citiesInfo')}`]
    ];
    document.getElementById('pagesOverviewBody').innerHTML = rows.map(([name, icon, active, total, detail]) => `
      <tr>
        <td><i class="${icon}" style="margin-right:8px; color:var(--primary);"></i><strong>${name}</strong></td>
        <td>${active.toLocaleString()}</td>
        <td>${total.toLocaleString()}</td>
        <td style="color:var(--text-muted); font-size:0.85rem;">${detail}</td>
      </tr>
    `).join('');
  }

  // ==========================================
  // Load Section Data
  // ==========================================
  async function loadSection(page) {
    switch (page) {
      case 'dashboard': await loadStats(); break;
      case 'users': await loadUsers(); break;
      case 'networking': await loadNetworking(); break;
      case 'posts': await loadPosts(); break;
      case 'jobs': await loadJobs(); break;
      case 'courses': await loadCourses(); break;
      case 'events': await loadEvents(); break;
      case 'news': await loadNews(); break;
    }
  }

  // ==========================================
  // Users
  // ==========================================
  let usersPage = 1;
  let usersTotal = 0;
  const USERS_PAGE_SIZE = 10;

  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  async function loadUsers(search = '', page = usersPage) {
    usersPage = page;
    const { data, count } = await DB.getAllUsers({ search, page, limit: USERS_PAGE_SIZE });
    const tbody = document.getElementById('usersTableBody');

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">' + t('admin.noUsers') + '</td></tr>';
      usersTotal = count || 0;
      renderUsersPagination(search);
      return;
    }

    usersTotal = count || 0;

    tbody.innerHTML = data.map(u => `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-cell-avatar">${(u.full_name || 'U')[0].toUpperCase()}</div>
            <div>
              <strong>${u.full_name || 'N/A'}</strong><br>
              <span style="color:var(--text-muted); font-size:0.78rem;">${u.job_title || ''}</span>
            </div>
          </div>
        </td>
        <td>${u.email || '—'}</td>
        <td>
          <select class="role-select ${u.role}" data-original-role="${u.role}" onchange="setRole('${u.id}', this.value, this)" ${u.id === user.id ? 'disabled title="' + t('admin.ownRole') + '"' : ''}>
            <option value="member" ${u.role === 'member' ? 'selected' : ''}>${t('common.member')}</option>
            <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>${t('common.moderator')}</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>${t('common.admin')}</option>
          </select>
        </td>
        <td>${u.city || '—'}</td>
        <td>${d(u.created_at)}</td>
        <td>
          <div class="actions-cell">
            <button class="edit" title="${t('admin.edit')}" onclick="openEditUser(this)" data-id="${u.id}" data-name="${esc(u.full_name)}" data-email="${esc(u.email)}" data-role="${esc(u.role)}" data-city="${esc(u.city)}" data-job="${esc(u.job_title)}"><i class="fas fa-pen"></i></button>
            <button class="delete" title="${t('admin.delete')}" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    renderUsersPagination(search);
  }

  function renderUsersPagination(search) {
    const totalPages = Math.max(1, Math.ceil(usersTotal / USERS_PAGE_SIZE));
    document.getElementById('usersInfo').textContent = `${usersTotal} ${t('admin.usersInfo')}`;

    let start = Math.max(1, usersPage - 2);
    let end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);

    const buttons = [
      `<button ${usersPage <= 1 ? 'disabled' : ''} onclick="goUsersPage(${usersPage - 1})"><i class="fas fa-chevron-left"></i></button>`
    ];
    for (let i = start; i <= end; i++) {
      buttons.push(`<button class="${i === usersPage ? 'active' : ''}" onclick="goUsersPage(${i})">${i}</button>`);
    }
    buttons.push(`<button ${usersPage >= totalPages ? 'disabled' : ''} onclick="goUsersPage(${usersPage + 1})"><i class="fas fa-chevron-right"></i></button>`);

    document.getElementById('usersPagination').innerHTML = buttons.join('');
  }

  window.goUsersPage = (page) => {
    loadUsers(document.getElementById('usersSearch').value, page);
  };

  window.setRole = async (userId, role, selectEl) => {
    if (!confirm(t('admin.confirmRole') + ` "${role}" ?`)) {
      if (selectEl) selectEl.value = selectEl.dataset.originalRole;
      return;
    }
    const { error } = await DB.updateUserRole(userId, role);
    if (error) {
      alert(t('admin.errorPrefix') + error.message);
      if (selectEl) selectEl.value = selectEl.dataset.originalRole;
      return;
    }
    selectEl.dataset.originalRole = role;
    selectEl.className = `role-select ${role}`;
    loadUsers(document.getElementById('usersSearch').value, usersPage);
  };

  window.deleteUser = async (userId) => {
    if (userId === user.id) {
      alert(t('admin.cannotDeleteSelf'));
      return;
    }
    if (!confirm(t('admin.confirmDeleteUser'))) return;

    // Suppression complète via RPC (profil + compte auth)
    const { error } = await DB.deleteUserFull(userId);
    if (error) {
      // Fallback : suppression du profil uniquement (si le RPC n'est pas encore configuré)
      const { error: fallbackError } = await DB.deleteUser(userId);
      if (fallbackError) {
        alert('Erreur: ' + (fallbackError.message || error.message));
        return;
      }
    }
    loadUsers(document.getElementById('usersSearch').value, usersPage);
    loadStats();
  };

  document.getElementById('usersSearch')?.addEventListener('input', (e) => {
    clearTimeout(window._usersSearchTimeout);
    window._usersSearchTimeout = setTimeout(() => loadUsers(e.target.value, 1), 300);
  });

  // ==========================================
  // Networking
  // ==========================================
  let networkingPage = 1;
  let networkingTotal = 0;
  const NETWORKING_PAGE_SIZE = 10;

  async function loadNetworking(search = '', page = networkingPage) {
    networkingPage = page;
    const { data, count } = await DB.getAllUsers({ search, page, limit: NETWORKING_PAGE_SIZE });
    const tbody = document.getElementById('networkingTableBody');

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">' + t('admin.noMembers') + '</td></tr>';
      networkingTotal = count || 0;
      renderNetworkingPagination(search);
      return;
    }

    networkingTotal = count || 0;

    tbody.innerHTML = data.map(u => `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-cell-avatar">${(u.full_name || 'U')[0].toUpperCase()}</div>
            <div>
              <strong>${u.full_name || 'N/A'}</strong><br>
              <span style="color:var(--text-muted); font-size:0.78rem;">${u.job_title || ''}</span>
            </div>
          </div>
        </td>
        <td>${u.email || '—'}</td>
        <td>${u.city || '—'}</td>
        <td>${(u.skills || []).slice(0, 3).map(s => `<span class="status-badge active" style="margin:2px;">${esc(s)}</span>`).join('') || '—'}</td>
        <td><span class="role-badge ${u.role}">${roleName(u.role)}</span></td>
        <td>${d(u.created_at)}</td>
        <td>
          <div class="actions-cell">
            <button class="edit" title="${t('admin.edit')}" onclick="openEditUser(this)" data-id="${u.id}" data-name="${esc(u.full_name)}" data-email="${esc(u.email)}" data-role="${esc(u.role)}" data-city="${esc(u.city)}" data-job="${esc(u.job_title)}"><i class="fas fa-pen"></i></button>
            <button class="delete" title="${t('admin.delete')}" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    renderNetworkingPagination(search);
  }

  function renderNetworkingPagination(search) {
    const totalPages = Math.max(1, Math.ceil(networkingTotal / NETWORKING_PAGE_SIZE));
    document.getElementById('networkingInfo').textContent = `${networkingTotal} ${t('admin.membersInfo')}`;

    let start = Math.max(1, networkingPage - 2);
    let end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);

    const buttons = [
      `<button ${networkingPage <= 1 ? 'disabled' : ''} onclick="goNetworkingPage(${networkingPage - 1})"><i class="fas fa-chevron-left"></i></button>`
    ];
    for (let i = start; i <= end; i++) {
      buttons.push(`<button class="${i === networkingPage ? 'active' : ''}" onclick="goNetworkingPage(${i})">${i}</button>`);
    }
    buttons.push(`<button ${networkingPage >= totalPages ? 'disabled' : ''} onclick="goNetworkingPage(${networkingPage + 1})"><i class="fas fa-chevron-right"></i></button>`);

    document.getElementById('networkingPagination').innerHTML = buttons.join('');
  }

  window.goNetworkingPage = (page) => {
    loadNetworking(document.getElementById('networkingSearch').value, page);
  };

  document.getElementById('networkingSearch')?.addEventListener('input', (e) => {
    clearTimeout(window._networkingSearchTimeout);
    window._networkingSearchTimeout = setTimeout(() => loadNetworking(e.target.value, 1), 300);
  });

  // ==========================================
  // Edit User (modal)
  // ==========================================
  window.openEditUser = (btn) => {
    document.getElementById('editUserId').value = btn.dataset.id;
    document.getElementById('editName').value = btn.dataset.name || '';
    document.getElementById('editEmail').value = btn.dataset.email || '';
    document.getElementById('editRole').value = btn.dataset.role || 'member';
    document.getElementById('editCity').value = btn.dataset.city || '';
    document.getElementById('editJobTitle').value = btn.dataset.job || '';
    document.getElementById('modalUserEdit').classList.add('open');
  };

  document.getElementById('formUserEdit')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('editName').value.trim();
    const role = document.getElementById('editRole').value;
    const city = document.getElementById('editCity').value.trim();
    const jobTitle = document.getElementById('editJobTitle').value.trim();

    const { error } = await DB.updateUserProfile(userId, {
      full_name: name,
      role,
      city: city || null,
      job_title: jobTitle || null
    });
    if (error) { alert(t('admin.errorPrefix') + error.message); return; }

    document.getElementById('modalUserEdit').classList.remove('open');
    const activeSection = document.querySelector('.admin-section.active').id;
    if (activeSection === 'section-networking') {
      loadNetworking(document.getElementById('networkingSearch').value, networkingPage);
    } else {
      loadUsers(document.getElementById('usersSearch').value, usersPage);
    }
  });

  // ==========================================
  // Posts
  // ==========================================
  async function loadPosts(search = '') {
    const { data } = await DB.getAllForumPosts({ search });
    const tbody = document.getElementById('postsTableBody');

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">' + t('admin.noPosts') + '</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td><strong>${p.title}</strong></td>
        <td>${p.author?.full_name || 'N/A'}</td>
        <td>${p.category?.name || '—'}</td>
        <td>${p.reply_count}</td>
        <td>${d(p.created_at)}</td>
        <td>
          <div class="actions-cell">
            <button title="${t('admin.delete')}" class="delete" onclick="deletePost(${p.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.deletePost = async (postId) => {
    if (!confirm(t('admin.confirmDeletePost'))) return;
    await DB.deleteForumPost(postId);
    loadPosts();
  };

  document.getElementById('postsSearch')?.addEventListener('input', (e) => {
    clearTimeout(window._postsSearchTimeout);
    window._postsSearchTimeout = setTimeout(() => loadPosts(e.target.value), 300);
  });

  // ==========================================
  // Jobs
  // ==========================================
  async function loadJobs() {
    const { data } = await DB.getAllJobOffers();
    const tbody = document.getElementById('jobsTableBody');

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">' + t('admin.noJobs') + '</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(j => `
      <tr>
        <td><strong>${j.title}</strong></td>
        <td>${j.company}</td>
        <td>${j.location}</td>
        <td><span class="role-badge ${j.job_type}">${t('jobs.' + j.job_type)}</span></td>
        <td>${d(j.created_at)}</td>
        <td>
          <div class="actions-cell">
            <button class="delete" title="${t('admin.delete')}" onclick="deleteJob(${j.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.deleteJob = async (jobId) => {
    if (!confirm(t('admin.confirmDeleteJob'))) return;
    await DB.deleteJobOffer(jobId);
    loadJobs();
  };

  // ==========================================
  // Courses
  // ==========================================
  async function loadCourses() {
    const client = Auth.getClient();
    const { data } = await client
      .from('training_courses')
      .select('*, instructor:profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false });
    const tbody = document.getElementById('coursesTableBody');

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">' + t('admin.noCourses') + '</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(c => `
      <tr>
        <td><strong>${c.title}</strong></td>
        <td><span class="role-badge ${c.level}">${t('training.' + c.level)}</span></td>
        <td>${c.enrollment_count}</td>
        <td>⭐ ${c.rating}</td>
        <td><span class="status-badge ${c.is_published ? 'active' : 'inactive'}">${c.is_published ? t('admin.published') : t('admin.draft')}</span></td>
        <td>
          <div class="actions-cell">
            <button title="${c.is_published ? t('admin.unpublish') : t('admin.publish')}" onclick="toggleCourse(${c.id}, ${!c.is_published})"><i class="fas fa-${c.is_published ? 'eye-slash' : 'eye'}"></i></button>
            <button class="delete" title="${t('admin.delete')}" onclick="deleteCourse(${c.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.toggleCourse = async (id, publish) => {
    const { error } = await DB.toggleCoursePublish(id, publish);
    if (error) console.error('Toggle course error:', error);
    loadCourses();
  };

  window.deleteCourse = async (id) => {
    if (!confirm(t('admin.confirmDeleteCourse'))) return;
    const { error } = await DB.deleteCourse(id);
    if (error) console.error('Delete course error:', error);
    loadCourses();
  };

  // ==========================================
  // Events
  // ==========================================
  async function loadEvents() {
    const client = Auth.getClient();
    const { data } = await client
      .from('events')
      .select('*, organizer:profiles(full_name, avatar_url)')
      .order('event_date', { ascending: false });
    const tbody = document.getElementById('eventsTableBody');

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">' + t('admin.noEvents') + '</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(e => `
      <tr>
        <td><strong>${e.title}</strong></td>
        <td><span class="role-badge">${t('events.type' + e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1))}</span></td>
        <td>${e.location || '—'}</td>
        <td>${d(e.event_date)}</td>
        <td>${e.registration_count || 0}/${e.max_participants || '∞'}</td>
        <td>
          <div class="actions-cell">
            <button class="delete" title="${t('admin.delete')}" onclick="deleteEvent(${e.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.deleteEvent = async (id) => {
    if (!confirm(t('admin.confirmDeleteEvent'))) return;
    const { error } = await DB.deleteEvent(id);
    if (error) console.error('Delete event error:', error);
    loadEvents();
  };

  // ==========================================
  // News
  // ==========================================
  async function loadNews() {
    const client = Auth.getClient();
    const { data } = await client.from('news_articles').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('newsTableBody');

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">' + t('admin.noNews') + '</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(n => `
      <tr>
        <td><strong>${n.title}</strong></td>
        <td>${n.category}</td>
        <td>${n.author_name || '—'}</td>
        <td>${n.views || 0}</td>
        <td><span class="status-badge ${n.is_published ? 'active' : 'inactive'}">${n.is_published ? t('admin.published') : t('admin.draft')}</span></td>
        <td>
          <div class="actions-cell">
            <button title="${n.is_published ? t('admin.unpublish') : t('admin.publish')}" onclick="toggleNews(${n.id}, ${!n.is_published})"><i class="fas fa-${n.is_published ? 'eye-slash' : 'eye'}"></i></button>
            <button class="delete" title="${t('admin.delete')}" onclick="deleteNews(${n.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.toggleNews = async (id, publish) => {
    const { error } = await DB.toggleNewsPublish(id, publish);
    if (error) console.error('Toggle news error:', error);
    loadNews();
  };

  window.deleteNews = async (id) => {
    if (!confirm(t('admin.confirmDeleteNews'))) return;
    const { error } = await DB.deleteNewsArticle(id);
    if (error) console.error('Delete news error:', error);
    loadNews();
  };

  // ==========================================
  // Logout
  // ==========================================
  document.getElementById('adminLogoutBtn')?.addEventListener('click', async () => {
    await Auth.signOut();
  });

  // ==========================================
  // FORM: Add Job
  // ==========================================
  document.getElementById('formJob')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const client = Auth.getClient();
    const { error } = await client.from('job_offers').insert({
      title: document.getElementById('jobTitle').value.trim(),
      company: document.getElementById('jobCompany').value.trim(),
      location: document.getElementById('jobLocation').value.trim(),
      job_type: document.getElementById('jobType').value,
      category: document.getElementById('jobCategory').value,
      description: document.getElementById('jobDesc').value.trim(),
      contact_email: document.getElementById('jobEmail').value.trim() || null,
      author_id: user.id
    });
    if (error) { alert(t('admin.errorPrefix') + error.message); return; }
    document.getElementById('modalJob').classList.remove('open');
    e.target.reset();
    loadJobs();
  });

  // ==========================================
  // FORM: Add Course
  // ==========================================
  document.getElementById('formCourse')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const client = Auth.getClient();
    const { error } = await client.from('training_courses').insert({
      title: document.getElementById('courseTitle').value.trim(),
      description: document.getElementById('courseDesc').value.trim(),
      level: document.getElementById('courseLevel').value,
      category: document.getElementById('courseCat').value,
      duration_hours: parseInt(document.getElementById('courseDuration').value) || null,
      instructor_id: user.id,
      is_published: true
    });
    if (error) { alert(t('admin.errorPrefix') + error.message); return; }
    document.getElementById('modalCourse').classList.remove('open');
    e.target.reset();
    loadCourses();
  });

  // ==========================================
  // FORM: Add Event
  // ==========================================
  document.getElementById('formEvent')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const client = Auth.getClient();
    const { error } = await client.from('events').insert({
      title: document.getElementById('eventTitle').value.trim(),
      description: document.getElementById('eventDesc').value.trim(),
      event_type: document.getElementById('eventType').value,
      event_date: document.getElementById('eventDate').value,
      event_time: document.getElementById('eventTime').value,
      location: document.getElementById('eventLocation').value.trim() || null,
      max_participants: parseInt(document.getElementById('eventMax').value) || null,
      organizer_id: user.id
    });
    if (error) { alert(t('admin.errorPrefix') + error.message); return; }
    document.getElementById('modalEvent').classList.remove('open');
    e.target.reset();
    loadEvents();
  });

  // ==========================================
  // FORM: Add News
  // ==========================================
  document.getElementById('formNews')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const client = Auth.getClient();
    const { error } = await client.from('news_articles').insert({
      title: document.getElementById('newsTitle').value.trim(),
      content: document.getElementById('newsContent').value.trim(),
      category: document.getElementById('newsCat').value,
      external_link: document.getElementById('newsLink').value.trim() || null,
      author_id: user.id,
      author_name: profile?.full_name || 'Admin'
    });
    if (error) { alert(t('admin.errorPrefix') + error.message); return; }
    document.getElementById('modalNews').classList.remove('open');
    e.target.reset();
    loadNews();
  });

  // ==========================================
  // FORM: Add User
  // ==========================================
  document.getElementById('formUser')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const fullName = document.getElementById('userName').value.trim();
    const role = document.getElementById('userRole').value;
    const city = document.getElementById('userCity').value.trim();
    const jobTitle = document.getElementById('userJobTitle').value.trim();

    const { data, error: signUpError } = await Auth.signUp(email, password, fullName);
    if (signUpError) { alert('Erreur: ' + signUpError.message); return; }

    if (data?.user) {
      const client = Auth.getClient();
      await client.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        city: city || null,
        job_title: jobTitle || null
      }, { onConflict: 'id' });
    }

    document.getElementById('modalUser').classList.remove('open');
    e.target.reset();
    const activeSection = document.querySelector('.admin-section.active').id;
    if (activeSection === 'section-networking') {
      loadNetworking(document.getElementById('networkingSearch').value, networkingPage);
    } else {
      loadUsers(document.getElementById('usersSearch').value, usersPage);
    }
  });

  // ==========================================
  // FORM: Add Post
  // ==========================================
  document.getElementById('formPost')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const client = Auth.getClient();
    const { error } = await client.from('forum_posts').insert({
      title: document.getElementById('postTitle').value.trim(),
      content: document.getElementById('postContent').value.trim(),
      category_id: parseInt(document.getElementById('postCategory').value),
      author_id: user.id
    });
    if (error) { alert(t('admin.errorPrefix') + error.message); return; }
    document.getElementById('modalPost').classList.remove('open');
    e.target.reset();
    loadPosts();
  });

  // ==========================================
  // Initial Load
  // ==========================================
  try {
    await loadStats();
  } catch (e) {
    console.error('Erreur stats initiales:', e);
    const alertEl = document.getElementById('dashboardError');
    if (alertEl) {
      alertEl.textContent = t('admin.statsError') + (e && e.message ? e.message : t('common.unknown'));
      alertEl.style.display = 'block';
    }
  }

  // Ouverture d'une section via hash (ex: index.html#users depuis stats.html)
  const target = window.location.hash.replace('#', '');
  if (target) {
    const link = document.querySelector(`.sidebar-link[data-page="${target}"]`);
    if (link) setTimeout(() => link.click(), 50);
  }
});
