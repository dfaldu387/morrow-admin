async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request('/auth/me'),

  getDashboard: () => request('/dashboard'),

  getUsers: (page = 1, search = '') =>
    request(`/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`),

  getUser: (id: string) => request(`/users/${id}`),

  deleteUser: (id: string) =>
    request(`/users/${id}`, { method: 'DELETE' }),

  getHabits: (page = 1, search = '') =>
    request(`/habits?page=${page}&limit=20&search=${encodeURIComponent(search)}`),

  broadcastNotification: (title: string, body: string, type: string) =>
    request('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, body, type }),
    }),

  sendNotification: (data: { title: string; body: string; type: string; target: string; userIds?: string[] }) =>
    request('/notifications/send', { method: 'POST', body: JSON.stringify(data) }),

  getNotificationHistory: (page = 1) =>
    request(`/notifications?page=${page}&limit=20`),

  getNotificationStats: () => request('/notifications/stats'),

  getUsersList: () => request('/users?page=1&limit=100&search='),

  getCategories: () => request('/categories'),

  createCategory: (data: { name: string; emoji: string; sort_order: number }) =>
    request('/categories', { method: 'POST', body: JSON.stringify(data) }),

  updateCategory: (id: string, data: { name?: string; emoji?: string; is_active?: boolean; sort_order?: number }) =>
    request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCategory: (id: string) =>
    request(`/categories/${id}`, { method: 'DELETE' }),
};
