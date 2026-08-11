// ============================================
// TechDZ — Database Module
// ============================================

const DB = {
  getClient() {
    return window.Auth.getClient();
  },

  // ==========================================
  // FORUM
  // ==========================================
  async getForumCategories() {
    const client = this.getClient();
    const { data, error } = await client
      .from('forum_categories')
      .select('*')
      .order('sort_order');
    return { data, error };
  },

  async getForumPosts({ category, page = 1, limit = 20, search } = {}) {
    const client = this.getClient();
    let query = client
      .from('forum_posts')
      .select('*, author:profiles(full_name, avatar_url, role), category:forum_categories(name, slug, color)', { count: 'exact' })
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (category) query = query.eq('category_id', category);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

    const { data, error, count } = await query;
    return { data, error, count };
  },

  async getForumPost(postId) {
    const client = this.getClient();
    const { data, error } = await client
      .from('forum_posts')
      .select('*, author:profiles(full_name, avatar_url, role, job_title), category:forum_categories(name, slug, color)')
      .eq('id', postId)
      .single();
    return { data, error };
  },

  async createForumPost(post) {
    const client = this.getClient();
    const { data, error } = await client
      .from('forum_posts')
      .insert(post)
      .select()
      .single();
    return { data, error };
  },

  async updateForumPost(postId, updates) {
    const client = this.getClient();
    const { data, error } = await client
      .from('forum_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();
    return { data, error };
  },

  async deleteForumPost(postId) {
    const client = this.getClient();
    const { error } = await client
      .from('forum_posts')
      .delete()
      .eq('id', postId);
    return { error };
  },

  async getForumReplies(postId) {
    const client = this.getClient();
    const { data, error } = await client
      .from('forum_replies')
      .select('*, author:profiles(full_name, avatar_url, role, job_title)')
      .eq('post_id', postId)
      .order('is_accepted', { ascending: false })
      .order('created_at');
    return { data, error };
  },

  async createForumReply(reply) {
    const client = this.getClient();
    const { data, error } = await client
      .from('forum_replies')
      .insert(reply)
      .select()
      .single();
    return { data, error };
  },

  async votePost(postId, userId, value) {
    const client = this.getClient();
    const { data, error } = await client
      .from('forum_votes')
      .upsert({ post_id: postId, user_id: userId, value })
      .select();
    return { data, error };
  },

  async incrementViews(table, id) {
    const client = this.getClient();
    await client.rpc('increment_views', { table_name: table, row_id: id });
  },

  // ==========================================
  // JOBS
  // ==========================================
  async getJobOffers({ category, location, type, page = 1, limit = 20 } = {}) {
    const client = this.getClient();
    let query = client
      .from('job_offers')
      .select('*, author:profiles(full_name, avatar_url)', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (category) query = query.eq('category', category);
    if (location) query = query.ilike('location', `%${location}%`);
    if (type) query = query.eq('job_type', type);

    const { data, error, count } = await query;
    return { data, error, count };
  },

  async createJobOffer(job) {
    const client = this.getClient();
    const { data, error } = await client
      .from('job_offers')
      .insert(job)
      .select()
      .single();
    return { data, error };
  },

  async deleteJobOffer(jobId) {
    const client = this.getClient();
    const { error } = await client
      .from('job_offers')
      .delete()
      .eq('id', jobId);
    return { error };
  },

  // ==========================================
  // TRAINING
  // ==========================================
  async getTrainingCourses({ level, category, page = 1, limit = 20 } = {}) {
    const client = this.getClient();
    let query = client
      .from('training_courses')
      .select('*, instructor:profiles(full_name, avatar_url)', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (level) query = query.eq('level', level);
    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    return { data, error, count };
  },

  async createCourse(course) {
    const client = this.getClient();
    const { data, error } = await client
      .from('training_courses')
      .insert(course)
      .select()
      .single();
    return { data, error };
  },

  // ==========================================
  // EVENTS
  // ==========================================
  async getEvents({ type, page = 1, limit = 20 } = {}) {
    const client = this.getClient();
    let query = client
      .from('events')
      .select('*, organizer:profiles(full_name, avatar_url)', { count: 'exact' })
      .order('event_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (type) query = query.eq('event_type', type);

    const { data, error, count } = await query;
    return { data, error, count };
  },

  async deleteEvent(eventId) {
    const client = this.getClient();
    const { error } = await client
      .from('events')
      .delete()
      .eq('id', eventId);
    return { error };
  },

  async deleteCourse(courseId) {
    const client = this.getClient();
    const { error } = await client
      .from('training_courses')
      .delete()
      .eq('id', courseId);
    return { error };
  },

  async toggleCoursePublish(courseId, isPublished) {
    const client = this.getClient();
    const { data, error } = await client
      .from('training_courses')
      .update({ is_published: isPublished })
      .eq('id', courseId)
      .select()
      .single();
    return { data, error };
  },

  async toggleNewsPublish(articleId, isPublished) {
    const client = this.getClient();
    const { data, error } = await client
      .from('news_articles')
      .update({ is_published: isPublished })
      .eq('id', articleId)
      .select()
      .single();
    return { data, error };
  },

  async deleteNewsArticle(articleId) {
    const client = this.getClient();
    const { error } = await client
      .from('news_articles')
      .delete()
      .eq('id', articleId);
    return { error };
  },

  async enrollCourse(courseId, userId) {
    const client = this.getClient();
    const { data: course, error: fetchErr } = await client
      .from('training_courses')
      .select('enrollment_count')
      .eq('id', courseId)
      .single();
    if (fetchErr) return { data: null, error: fetchErr };
    const { data, error } = await client
      .from('training_courses')
      .update({ enrollment_count: (course.enrollment_count || 0) + 1 })
      .eq('id', courseId)
      .select()
      .single();
    return { data, error };
  },

  async rsvpEvent(eventId, userId) {
    const client = this.getClient();
    const { data, error } = await client
      .from('event_registrations')
      .insert({ event_id: eventId, user_id: userId })
      .select()
      .single();
    if (!error) {
      const { data: ev } = await client.from('events').select('registration_count').eq('id', eventId).single();
      if (ev) {
        await client.from('events').update({ registration_count: (ev.registration_count || 0) + 1 }).eq('id', eventId);
      }
    }
    return { data, error };
  },

  async checkEventRegistration(eventId, userId) {
    const client = this.getClient();
    const { data } = await client
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
    return !!data;
  },

  async createEvent(event) {
    const client = this.getClient();
    const { data, error } = await client
      .from('events')
      .insert(event)
      .select()
      .single();
    return { data, error };
  },

  async registerForEvent(eventId, userId) {
    const client = this.getClient();
    const { data, error } = await client
      .from('event_registrations')
      .insert({ event_id: eventId, user_id: userId })
      .select()
      .single();
    return { data, error };
  },

  // ==========================================
  // NEWS
  // ==========================================
  async getNewsArticles({ category, page = 1, limit = 20 } = {}) {
    return this.getNews({ category, page, limit });
  },

  async createNewsArticle(article) {
    const client = this.getClient();
    const { data, error } = await client
      .from('news_articles')
      .insert(article)
      .select()
      .single();
    return { data, error };
  },

  async getNews({ category, page = 1, limit = 20 } = {}) {
    const client = this.getClient();
    let query = client
      .from('news_articles')
      .select('*, author:profiles(full_name, avatar_url)', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    return { data, error, count };
  },

  // ==========================================
  // NETWORKING / MEMBERS
  // ==========================================
  async getMembers({ search, city, skill, page = 1, limit = 30 } = {}) {
    const client = this.getClient();
    let query = client
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) query = query.or(`full_name.ilike.%${search}%,job_title.ilike.%${search}%`);
    if (city) query = query.eq('city', city);

    const { data, error, count } = await query;
    return { data, error, count };
  },

  async getMemberCities() {
    const client = this.getClient();
    const { data, error } = await client
      .from('profiles')
      .select('city')
      .not('city', 'is', null)
      .order('city');
    const cities = [...new Set(data?.map(p => p.city).filter(Boolean))];
    return { data: cities, error };
  },

  async getMemberSkills() {
    const client = this.getClient();
    const { data, error } = await client
      .from('profiles')
      .select('skills')
      .not('skills', 'is', null);
    const allSkills = [...new Set(data?.flatMap(p => p.skills || []).filter(Boolean))];
    return { data: allSkills, error };
  },

  // ==========================================
  // ADMIN STATISTICS
  // ==========================================
  async getUsers() {
    const client = this.getClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getJobOffersForStats() {
    const client = this.getClient();
    const { data, error } = await client
      .from('job_offers')
      .select('*')
      .eq('is_active', true);
    return { data, error };
  },

  async getAdminStats() {
    const client = this.getClient();

    // Comptage sûr : chaque requête est isolée — si une colonne/table manque,
    // les autres statistiques continuent de s'afficher avec les vraies données.
    const safeCount = async (table, filters = []) => {
      try {
        let q = client.from(table).select('*', { count: 'exact', head: true });
        filters.forEach(([col, val]) => { q = q.eq(col, val); });
        const { count } = await q;
        return count || 0;
      } catch (e) {
        console.error(`getAdminStats: count ${table}:`, e.message);
        return 0;
      }
    };

    const safeSum = async (table, column) => {
      try {
        const { data } = await client.from(table).select(column);
        return (data || []).reduce((s, r) => s + (r[column] || 0), 0);
      } catch (e) {
        console.error(`getAdminStats: sum ${table}.${column}:`, e.message);
        return 0;
      }
    };

    const [users, cities, posts, replies, jobsActive, jobsTotal, coursesPub, coursesTotal, enrollments, eventsActive, eventsTotal, registrations, newsPub, newsTotal, views] = await Promise.all([
      safeCount('profiles'),
      this.getMemberCities().then(r => (r.data || []).length).catch(() => 0),
      safeCount('forum_posts'),
      safeCount('forum_replies'),
      safeCount('job_offers', [['is_active', true]]),
      safeCount('job_offers'),
      safeCount('training_courses', [['is_published', true]]),
      safeCount('training_courses'),
      safeSum('training_courses', 'enrollment_count'),
      safeCount('events', [['is_active', true]]),
      safeCount('events'),
      safeSum('events', 'registration_count'),
      safeCount('news_articles', [['is_published', true]]),
      safeCount('news_articles'),
      safeSum('news_articles', 'views')
    ]);

    return {
      users,
      cities,
      posts,
      replies,
      jobsActive,
      jobsTotal,
      coursesPublished: coursesPub,
      coursesTotal,
      courseEnrollments: enrollments,
      eventsActive,
      eventsTotal,
      eventRegistrations: registrations,
      newsPublished: newsPub,
      newsTotal,
      newsViews: views
    };
  },

  async getAllUsers({ page = 1, limit = 50, search } = {}) {
    const client = this.getClient();
    let query = client
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) query = query.or(`full_name.ilike.%${search}%,job_title.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error, count } = await query;
    return { data, error, count };
  },

  async updateUserRole(userId, role) {
    const client = this.getClient();
    const { data, error } = await client
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  async updateUserProfile(userId, updates) {
    const client = this.getClient();
    const { data, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  // Suppression complète (profil + compte auth) via la fonction
  // admin_delete_user (voir supabase-admin-setup.sql)
  async deleteUserFull(userId) {
    const client = this.getClient();
    const { data, error } = await client.rpc('admin_delete_user', { target: userId });
    return { data, error };
  },

  async deleteUser(userId) {
    const client = this.getClient();
    const { error } = await client
      .from('profiles')
      .delete()
      .eq('id', userId);
    return { error };
  },

  // Get all forum posts (admin)
  async getAllForumPosts({ page = 1, limit = 50, search } = {}) {
    const client = this.getClient();
    let query = client
      .from('forum_posts')
      .select('*, author:profiles(full_name), category:forum_categories(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

    const { data, error, count } = await query;
    return { data, error, count };
  },

  // Get all job offers (admin)
  async getAllJobOffers({ page = 1, limit = 50 } = {}) {
    const client = this.getClient();
    const { data, error, count } = await client
      .from('job_offers')
      .select('*, author:profiles(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    return { data, error, count };
  },

  // Notifications
  async getNotifications(userId) {
    const client = this.getClient();
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return { data, error };
  },

  async markNotificationRead(notifId) {
    const client = this.getClient();
    await client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);
  },

  // ==========================================
  // ACTIVITY TRACKING & ONLINE USERS
  // ==========================================

  // Insère une ligne dans connection_logs (login / logout / heartbeat / page_view)
  async logConnection(action, page) {
    const client = this.getClient();
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return { data: null, error: null };
    const pageName = page || window.location.pathname.split('/').pop() || 'index.html';
    const { data, error } = await client
      .from('connection_logs')
      .insert({
        user_id: session.user.id,
        action,
        page: pageName,
        user_agent: navigator.userAgent ? navigator.userAgent.substring(0, 400) : null
      });
    return { data, error };
  },

  // Utilisateurs en ligne (last_active < 5 minutes), pour le widget public
  async getOnlineUsers(limit = 20) {
    const client = this.getClient();
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data, error } = await client
      .from('profiles')
      .select('id, full_name, avatar_url, job_title, city, role, last_active')
      .gt('last_active', cutoff)
      .order('last_active', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  // Nombre d'utilisateurs en ligne
  async getOnlineCount() {
    const client = this.getClient();
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    try {
      const { count, error } = await client
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('last_active', cutoff);
      return { count: count || 0, error };
    } catch (e) {
      return { count: 0, error: { message: e.message } };
    }
  },

  // Appel générique d'une fonction RPC
  async rpc(name, params = {}) {
    const client = this.getClient();
    const { data, error } = await client.rpc(name, params);
    return { data, error };
  },

  // ==========================================
  // DAILY STATS (agrégats journaliers)
  // ==========================================

  async getDailyStats(limit = 30) {
    const client = this.getClient();
    const { data, error } = await client
      .from('daily_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  // Stats temps réel du jour (admin) — via RPC admin_today_stats
  async getTodayStats() {
    return this.rpc('admin_today_stats');
  },

  // ==========================================
  // ADMIN — STATISTIQUES D'ACTIVITÉ
  // ==========================================

  async getOnlineUsersDetailed() {
    return this.rpc('admin_online_now');
  },

  async getHourlyActive(hours = 24) {
    return this.rpc('admin_hourly_active', { hours });
  },

  async getDailyTotals(days = 7) {
    return this.rpc('admin_daily_totals', { days });
  },

  async getPageDistribution(days = 30) {
    return this.rpc('admin_page_distribution', { days });
  },

  async getPageStats() {
    return this.rpc('admin_page_stats');
  },

  async getCumulativeUsers(days = 30) {
    return this.rpc('admin_cumulative_users', { days });
  },

  async getUserStats(userId) {
    return this.rpc('admin_user_stats', { target: userId });
  },

  // Historique des connexions (admin) avec pagination + filtres
  async getConnectionLogs({ page = 1, limit = 50, date, userId, action, search } = {}) {
    const client = this.getClient();
    let q = client
      .from('connection_logs')
      .select('*, user:profiles(full_name, avatar_url)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (userId) q = q.eq('user_id', userId);
    if (action) q = q.eq('action', action);
    if (date) {
      const start = new Date(date + 'T00:00:00');
      const end = new Date(date + 'T23:59:59.999');
      q = q.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
    }
    if (search) {
      const { data: users } = await client
        .from('profiles')
        .select('id')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(25);
      const ids = (users || []).map(u => u.id);
      if (ids.length) q = q.in('user_id', ids);
      else q = q.in('user_id', []);
    }

    const { data, error, count } = await q;
    return { data, error, count };
  },

  // Historique complet d'un utilisateur (fiche admin)
  async getUserLogs(userId, { page = 1, limit = 50 } = {}) {
    const client = this.getClient();
    const { data, error, count } = await client
      .from('connection_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    return { data, error, count };
  }
};

window.DB = DB;
