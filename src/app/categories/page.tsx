'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { IconTag, IconTrash, IconEdit, IconEye, IconEyeOff } from '@/components/Icons';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  emoji: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const EMOJI_OPTIONS = [
  '❤️', '💪', '🧘', '📚', '⚡', '🌿', '💰', '👥', '🎨', '📌',
  '🎯', '🏃', '🧠', '💼', '🎵', '🍎', '🏠', '✈️', '🐾', '💊',
  '🙏', '📝', '🎮', '🧹', '☕', '🌍', '🤝', '🛌', '📱', '🎓',
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', emoji: '', sort_order: 0 });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function loadCategories() {
    try {
      const data = await api.getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCategory(null);
    setForm({ name: '', emoji: '', sort_order: categories.length + 1 });
    setShowModal(true);
  }

  function openEditModal(cat: Category) {
    setEditingCategory(cat);
    setForm({ name: cat.name, emoji: cat.emoji, sort_order: cat.sort_order });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, {
          name: form.name.trim(),
          emoji: form.emoji || '📌',
          sort_order: form.sort_order,
        });
        setToast({ message: 'Category updated successfully', type: 'success' });
      } else {
        await api.createCategory({
          name: form.name.trim(),
          emoji: form.emoji || '📌',
          sort_order: form.sort_order,
        });
        setToast({ message: 'Category created successfully', type: 'success' });
      }
      setShowModal(false);
      loadCategories();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save category', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(cat: Category) {
    try {
      await api.updateCategory(cat.id, { is_active: !cat.is_active });
      setToast({ message: `Category ${cat.is_active ? 'disabled' : 'enabled'}`, type: 'info' });
      loadCategories();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update', type: 'error' });
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await api.deleteCategory(deleteId);
      setToast({ message: 'Category deleted', type: 'success' });
      setDeleteId(null);
      loadCategories();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete', type: 'error' });
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-screen"><div className="spinner" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <style>{`
        .cat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }
        .cat-header h1 {
          font-size: 26px;
          font-weight: 700;
          margin: 0;
        }
        .cat-header p {
          color: var(--text-muted);
          font-size: 14px;
          margin: 4px 0 0;
        }
        .cat-add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--primary);
          color: #fff;
          border: none;
          padding: 10px 22px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(254,141,161,0.3);
        }
        .cat-add-btn:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(254,141,161,0.4);
        }
        .cat-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .cat-stat {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          text-align: center;
        }
        .cat-stat-val {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .cat-stat-label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .cat-list {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .cat-row {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          transition: all 0.15s;
        }
        .cat-row:last-child { border-bottom: none; }
        .cat-row:hover { background: rgba(254,141,161,0.03); }
        .cat-row.inactive { opacity: 0.45; }
        .cat-row.inactive:hover { opacity: 0.65; }
        .cat-row-emoji {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(254,141,161,0.07);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .cat-row-info {
          flex: 1;
          margin-left: 14px;
        }
        .cat-row-name {
          font-size: 14px;
          font-weight: 600;
        }
        .cat-row-date {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .cat-row-order {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
          background: var(--bg, #f5f6fa);
          padding: 3px 10px;
          border-radius: 20px;
          margin-right: 12px;
        }
        .cat-row-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
          margin-right: 14px;
        }
        .cat-row-badge.on {
          background: rgba(46,213,115,0.1);
          color: var(--success);
        }
        .cat-row-badge.off {
          background: rgba(136,136,160,0.1);
          color: var(--text-muted);
        }
        .cat-actions {
          display: flex;
          gap: 2px;
          flex-shrink: 0;
        }
        .cat-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          background: transparent;
          color: var(--text-muted);
        }
        .cat-action-btn:hover {
          background: rgba(254,141,161,0.1);
          color: var(--primary);
        }
        .cat-action-btn.enable {
          color: #4ade80;
        }
        .cat-action-btn.enable:hover {
          background: rgba(74,222,128,0.1);
          color: #22c55e;
        }
        .cat-action-btn.disable {
          color: #f59e0b;
        }
        .cat-action-btn.disable:hover {
          background: rgba(245,158,11,0.1);
          color: #d97706;
        }
        .cat-action-btn.danger:hover {
          background: rgba(255,71,87,0.1);
          color: var(--danger);
        }
        .cat-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1a1a2e;
          color: #fff;
          padding: 14px 22px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          z-index: 300;
          animation: toastSlide 0.3s ease-out;
        }
        .cat-toast.success { border-left: 4px solid #4ade80; }
        .cat-toast.error { border-left: 4px solid var(--danger); }
        .cat-toast.info { border-left: 4px solid var(--primary); }
        @keyframes toastSlide {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .cat-empty {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
          font-size: 14px;
        }

        /* Improved Modal */
        .cat-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          animation: fadeIn 0.2s;
        }
        .cat-modal {
          background: var(--card-bg);
          border-radius: 20px;
          padding: 0;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          animation: slideIn 0.3s;
          overflow: hidden;
        }
        .cat-modal-header {
          padding: 24px 28px 0;
        }
        .cat-modal-header h2 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .cat-modal-header p {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }
        .cat-modal-body {
          padding: 20px 28px;
        }
        .cat-field {
          margin-bottom: 20px;
        }
        .cat-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text);
        }
        .cat-field input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
          background: var(--bg);
          box-sizing: border-box;
        }
        .cat-field input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(254,141,161,0.1);
        }
        .cat-field input[type="number"] {
          max-width: 120px;
        }
        .cat-emoji-preview {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-tertiary, #f8f8f8);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .cat-emoji-preview-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(254,141,161,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          flex-shrink: 0;
        }
        .cat-emoji-preview-text {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
        }
        .cat-emoji-preview-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .cat-emoji-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 4px;
          margin-bottom: 10px;
        }
        .cat-emoji-btn {
          aspect-ratio: 1;
          border-radius: 10px;
          border: 2px solid transparent;
          background: var(--bg-tertiary, #f5f5f5);
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          padding: 0;
        }
        .cat-emoji-btn:hover {
          background: rgba(254,141,161,0.1);
          transform: scale(1.1);
        }
        .cat-emoji-btn.selected {
          border-color: var(--primary);
          background: rgba(254,141,161,0.15);
          transform: scale(1.1);
        }
        .cat-modal-footer {
          display: flex;
          gap: 10px;
          padding: 0 28px 24px;
        }
        .cat-modal-footer button {
          flex: 1;
          padding: 13px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .cat-btn-cancel {
          background: var(--bg-tertiary, #f5f5f5);
          color: var(--text-secondary);
        }
        .cat-btn-cancel:hover { background: var(--border); }
        .cat-btn-save {
          background: var(--primary);
          color: #fff;
          box-shadow: 0 2px 8px rgba(254,141,161,0.3);
        }
        .cat-btn-save:hover:not(:disabled) {
          background: var(--primary-dark);
          box-shadow: 0 4px 12px rgba(254,141,161,0.4);
        }
        .cat-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

        .cat-delete-modal {
          text-align: center;
          padding: 32px;
        }
        .cat-delete-modal .del-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255,71,87,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: var(--danger);
        }
        .cat-delete-modal h2 {
          font-size: 20px;
          margin: 0 0 8px;
        }
        .cat-delete-modal p {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0 0 24px;
          line-height: 1.5;
        }
        .cat-delete-actions {
          display: flex;
          gap: 10px;
        }
        .cat-delete-actions button {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .cat-del-cancel {
          background: var(--bg-tertiary, #f5f5f5);
          color: var(--text-secondary);
        }
        .cat-del-confirm {
          background: var(--danger);
          color: #fff;
        }
        .cat-del-confirm:hover { opacity: 0.9; }
      `}</style>

      {/* Header */}
      <div className="cat-header">
        <div>
          <h1>Categories</h1>
          <p>Manage habit categories shown in the app</p>
        </div>
        <button className="cat-add-btn" onClick={openCreateModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="cat-stats">
        <div className="cat-stat">
          <div className="cat-stat-val">{categories.length}</div>
          <div className="cat-stat-label">Total</div>
        </div>
        <div className="cat-stat">
          <div className="cat-stat-val" style={{ color: '#4ade80' }}>{categories.filter(c => c.is_active).length}</div>
          <div className="cat-stat-label">Active</div>
        </div>
        <div className="cat-stat">
          <div className="cat-stat-val" style={{ color: '#f87171' }}>{categories.filter(c => !c.is_active).length}</div>
          <div className="cat-stat-label">Inactive</div>
        </div>
      </div>

      {/* List */}
      <div className="cat-list">
        {categories.map((cat) => (
          <div key={cat.id} className={`cat-row ${cat.is_active ? '' : 'inactive'}`}>
            <div className="cat-row-emoji">{cat.emoji}</div>
            <div className="cat-row-info">
              <div className="cat-row-name">{cat.name}</div>
            </div>
            <div className="cat-row-order">#{cat.sort_order}</div>
            <div className={`cat-row-badge ${cat.is_active ? 'on' : 'off'}`}>
              {cat.is_active ? 'Active' : 'Inactive'}
            </div>
            <div className="cat-actions">
              <button className="cat-action-btn" onClick={() => openEditModal(cat)} title="Edit">
                <IconEdit size={14} />
              </button>
              <button
                className={`cat-action-btn ${cat.is_active ? 'disable' : 'enable'}`}
                onClick={() => handleToggleActive(cat)}
                title={cat.is_active ? 'Disable' : 'Enable'}
              >
                {cat.is_active ? <IconEyeOff size={14} /> : <IconEye size={14} />}
              </button>
              <button className="cat-action-btn danger" onClick={() => setDeleteId(cat.id)} title="Delete">
                <IconTrash size={14} />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="cat-empty">No categories yet. Click &quot;Add Category&quot; to create one.</div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="cat-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cat-modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'New Category'}</h2>
              <p>{editingCategory ? 'Update the category details' : 'Add a new category for habits'}</p>
            </div>

            <div className="cat-modal-body">
              {/* Live Preview */}
              <div className="cat-emoji-preview">
                <div className="cat-emoji-preview-icon">{form.emoji || '📌'}</div>
                <div>
                  <div className="cat-emoji-preview-text">{form.name || 'Category Name'}</div>
                  <div className="cat-emoji-preview-sub">Preview</div>
                </div>
              </div>

              <div className="cat-field">
                <label>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Health, Fitness, Travel..."
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div className="cat-field">
                <label>Emoji</label>
                <div className="cat-emoji-grid">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      className={`cat-emoji-btn ${form.emoji === em ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, emoji: em })}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  placeholder="Or paste a custom emoji"
                  maxLength={10}
                />
              </div>

              <div className="cat-field">
                <label>Sort Order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>

            <div className="cat-modal-footer">
              <button className="cat-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="cat-btn-save" onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="cat-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cat-delete-modal">
              <div className="del-icon"><IconTrash size={24} /></div>
              <h2>Delete Category?</h2>
              <p>This will permanently remove this category and all user selections linked to it.</p>
              <div className="cat-delete-actions">
                <button className="cat-del-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="cat-del-confirm" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`cat-toast ${toast.type}`}>
          {toast.type === 'success' && '✓'}
          {toast.type === 'error' && '✕'}
          {toast.type === 'info' && 'ℹ'}
          {toast.message}
        </div>
      )}
    </AdminLayout>
  );
}
