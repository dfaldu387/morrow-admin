'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout, { useAuthReady } from '@/components/AdminLayout';
import { IconEdit, IconClipboard, IconBarChart, IconBell, IconSend, IconInbox, IconCheckCircle, IconMailOpen, IconTrendingUp, IconInfo, IconZap, IconStar, IconWarning, IconTool, IconGlobe, IconUser } from '@/components/Icons';
import { api } from '@/lib/api';

const TEMPLATES = [
  { id: 'welcome', icon: <IconUser size={16} />, title: 'Welcome!', body: 'Welcome to Morrow! Start building great habits today.', type: 'info' },
  { id: 'update', icon: <IconZap size={16} />, title: 'New Update Available', body: 'We\'ve added exciting new features! Update your app to check them out.', type: 'update' },
  { id: 'streak', icon: <IconTrendingUp size={16} />, title: 'Keep Your Streak!', body: 'Don\'t forget to complete your habits today and keep your streak alive!', type: 'info' },
  { id: 'motivation', icon: <IconStar size={16} />, title: 'You\'re Doing Great!', body: 'Your consistency is paying off. Keep pushing towards your goals!', type: 'info' },
  { id: 'promo', icon: <IconStar size={16} />, title: 'Special Offer', body: 'Unlock premium features and take your habit tracking to the next level!', type: 'promotion' },
  { id: 'maintenance', icon: <IconTool size={16} />, title: 'Scheduled Maintenance', body: 'We\'ll be performing maintenance on our servers. The app may be briefly unavailable.', type: 'alert' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  info: <IconInfo size={18} />,
  update: <IconZap size={18} />,
  promotion: <IconStar size={18} />,
  alert: <IconWarning size={18} />,
  general: <IconBell size={18} />,
};

interface NotifHistory {
  title: string;
  body: string;
  type: string;
  sent_at: string;
  recipient_count: number;
  read_count: number;
  unread_count: number;
}

interface NotifStats {
  totalSent: number;
  readCount: number;
  unreadCount: number;
  readRate: number;
  byType: Array<{ type: string; count: number }>;
  last7Days: Array<{ day: string; count: number }>;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
}

function NotificationsContent() {
  const authReady = useAuthReady();
  const [tab, setTab] = useState<'compose' | 'history' | 'stats'>('compose');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('info');
  const [target, setTarget] = useState<'all' | 'specific'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [history, setHistory] = useState<NotifHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const [stats, setStats] = useState<NotifStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    api.getUsersList().then((data: any) => setUsers(data.users || [])).catch(() => {});
  }, [authReady]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getNotificationHistory(historyPage);
      setHistory(data.notifications);
      setHistoryTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    if (tab === 'history' && authReady) fetchHistory();
  }, [tab, authReady, fetchHistory]);

  useEffect(() => {
    if (tab === 'stats' && authReady) {
      setStatsLoading(true);
      api.getNotificationStats()
        .then(setStats)
        .catch(console.error)
        .finally(() => setStatsLoading(false));
    }
  }, [tab, authReady]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    setType(tpl.type);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (target === 'specific' && selectedUsers.length === 0) {
      setToast({ type: 'error', message: 'Please select at least one user' });
      return;
    }

    setSending(true);
    try {
      const data = await api.sendNotification({
        title, body, type, target,
        ...(target === 'specific' ? { userIds: selectedUsers } : {}),
      });
      setToast({ type: 'success', message: `Notification sent to ${data.count} user${data.count !== 1 ? 's' : ''}` });
      setTitle('');
      setBody('');
      setType('info');
      setSelectedUsers([]);
      setTarget('all');
    } catch (err: unknown) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to send' });
    } finally {
      setSending(false);
    }
  };

  const toggleUser = (id: string) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <>
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'compose' ? 'active' : ''}`} onClick={() => setTab('compose')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconEdit size={14} /> Compose</span>
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconClipboard size={14} /> History</span>
        </button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IconBarChart size={14} /> Stats</span>
        </button>
      </div>

      {tab === 'compose' && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>
            Quick Templates
          </h3>
          <div className="templates-grid">
            {TEMPLATES.map(tpl => (
              <div
                key={tpl.id}
                className={`template-card ${title === tpl.title && body === tpl.body ? 'selected' : ''}`}
                onClick={() => applyTemplate(tpl)}
              >
                <h4>{tpl.icon} {tpl.title}</h4>
                <p>{tpl.body}</p>
              </div>
            ))}
          </div>

          <div className="notif-layout">
            <div className="card">
              <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600 }}>Compose Notification</h3>
              <form onSubmit={handleSend}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Notification title"
                    maxLength={100}
                    required
                    style={{ paddingLeft: 14 }}
                  />
                  <div className={`char-count ${title.length > 80 ? 'warn' : ''} ${title.length > 95 ? 'danger' : ''}`}>
                    {title.length}/100
                  </div>
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Write your notification message..."
                    rows={4}
                    maxLength={500}
                    required
                  />
                  <div className={`char-count ${body.length > 400 ? 'warn' : ''} ${body.length > 480 ? 'danger' : ''}`}>
                    {body.length}/500
                  </div>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} style={{ paddingLeft: 14 }}>
                    <option value="info">Info</option>
                    <option value="update">Update</option>
                    <option value="promotion">Promotion</option>
                    <option value="alert">Alert</option>
                  </select>
                </div>

                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Send To
                </label>
                <div className="target-selector">
                  <div
                    className={`target-option ${target === 'all' ? 'active' : ''}`}
                    onClick={() => { setTarget('all'); setSelectedUsers([]); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <IconGlobe size={14} /> All Users ({users.length})
                  </div>
                  <div
                    className={`target-option ${target === 'specific' ? 'active' : ''}`}
                    onClick={() => setTarget('specific')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <IconUser size={14} /> Specific Users
                  </div>
                </div>

                {target === 'specific' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {selectedUsers.length} selected
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: 'var(--bg)', fontSize: 11 }}
                        onClick={selectAllUsers}
                      >
                        {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        style={{
                          width: '100%', padding: '8px 12px',
                          border: '1px solid var(--border)', borderRadius: 8,
                          fontSize: 13, outline: 'none',
                        }}
                      />
                    </div>
                    <div className="user-select-list">
                      {filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className="user-select-item"
                          onClick={() => toggleUser(user.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUser(user.id)}
                          />
                          <div className="user-select-avatar">
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{user.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                          </div>
                        </div>
                      ))}
                      {filteredUsers.length === 0 && (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          No users found
                        </div>
                      )}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={sending || !title.trim() || !body.trim()}
                  style={{ marginTop: 8, width: '100%', padding: 12, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {sending ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <IconSend size={15} />
                      {target === 'all'
                        ? `Send to All Users (${users.length})`
                        : `Send to ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`
                      }
                    </>
                  )}
                </button>
              </form>
            </div>

            <div>
              <div className="card" style={{ position: 'sticky', top: 32 }}>
                <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Preview
                </h3>
                {title || body ? (
                  <div className="notif-preview">
                    <div className="notif-preview-header">
                      <div className={`notif-icon ${type}`}>
                        {TYPE_ICONS[type] || <IconBell size={18} />}
                      </div>
                      <div>
                        <h4>{title || 'Notification Title'}</h4>
                      </div>
                    </div>
                    <p>{body || 'Your message will appear here...'}</p>
                    <div className="notif-time">Just now</div>
                  </div>
                ) : (
                  <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Start typing to see preview
                  </div>
                )}

                <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Type</span>
                    <span className={`type-badge ${type}`}>{type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Recipients</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {target === 'all' ? `${users.length} users` : `${selectedUsers.length} users`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'history' && (
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Notification History</h3>
          {historyLoading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <IconBell size={48} />
              <p style={{ marginTop: 12 }}>No notifications sent yet</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Notification</th>
                      <th>Type</th>
                      <th>Recipients</th>
                      <th>Read / Unread</th>
                      <th>Sent At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((n, i) => (
                      <tr key={i}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {n.body}
                            </div>
                          </div>
                        </td>
                        <td><span className={`type-badge ${n.type}`}>{n.type}</span></td>
                        <td>{n.recipient_count}</td>
                        <td>
                          <span style={{ color: 'var(--success)', fontWeight: 500 }}>{n.read_count}</span>
                          {' / '}
                          <span style={{ color: 'var(--text-muted)' }}>{n.unread_count}</span>
                        </td>
                        <td>{new Date(n.sent_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {historyTotalPages > 1 && (
                <div className="pagination">
                  <button disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}>Previous</button>
                  <span>Page {historyPage} of {historyTotalPages}</span>
                  <button disabled={historyPage >= historyTotalPages} onClick={() => setHistoryPage(p => p + 1)}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'stats' && (
        <>
          {statsLoading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : !stats ? (
            <div className="empty-state"><p>Failed to load stats</p></div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon blue"><IconSend size={22} /></div>
                  <div className="stat-info">
                    <h3>{stats.totalSent}</h3>
                    <p>Total Sent</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green"><IconCheckCircle size={22} /></div>
                  <div className="stat-info">
                    <h3>{stats.readCount}</h3>
                    <p>Read</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon yellow"><IconMailOpen size={22} /></div>
                  <div className="stat-info">
                    <h3>{stats.unreadCount}</h3>
                    <p>Unread</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon pink"><IconTrendingUp size={22} /></div>
                  <div className="stat-info">
                    <h3>{stats.readRate}%</h3>
                    <p>Read Rate</p>
                  </div>
                </div>
              </div>

              <div className="charts-grid">
                <div className="card">
                  <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>By Type</h3>
                  {stats.byType.length === 0 ? (
                    <div className="empty-state" style={{ padding: '30px 0' }}><p>No data</p></div>
                  ) : (
                    <div>
                      {stats.byType.map(t => {
                        const pct = stats.totalSent > 0 ? Math.round((t.count / stats.totalSent) * 100) : 0;
                        return (
                          <div key={t.type} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                              <span className={`type-badge ${t.type}`}>{t.type}</span>
                              <span style={{ fontWeight: 600 }}>{t.count} ({pct}%)</span>
                            </div>
                            <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${pct}%`,
                                background: t.type === 'info' ? '#36A2EB' : t.type === 'update' ? '#2ed573' : t.type === 'promotion' ? '#FFED00' : t.type === 'alert' ? '#ff4757' : '#8888a0',
                                borderRadius: 4,
                                transition: 'width 0.5s ease',
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Last 7 Days</h3>
                  {stats.last7Days.length === 0 ? (
                    <div className="empty-state" style={{ padding: '30px 0' }}><p>No notifications sent recently</p></div>
                  ) : (
                    <div>
                      {stats.last7Days.map(d => {
                        const maxCount = Math.max(...stats.last7Days.map(x => x.count), 1);
                        const pct = Math.round((d.count / maxCount) * 100);
                        return (
                          <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                            <span style={{ width: 36, fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{d.day}</span>
                            <div style={{ flex: 1, height: 24, background: 'var(--bg)', borderRadius: 6, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${pct}%`,
                                background: 'var(--primary)',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: 8,
                                minWidth: d.count > 0 ? 30 : 0,
                                transition: 'width 0.5s ease',
                              }}>
                                <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{d.count}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

export default function NotificationsPage() {
  return (
    <AdminLayout>
      <div className="page-header">
        <h2>Notifications</h2>
        <p>Send, track, and manage notifications</p>
      </div>
      <NotificationsContent />
    </AdminLayout>
  );
}
