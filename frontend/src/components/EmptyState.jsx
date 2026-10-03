import React from 'react';
import { NotebookPen, Plus } from 'lucide-react';

export default function EmptyState({ onAddPage }) {
  return (
    <div className="empty-state">
      <div className="empty-icon-wrap">
        <NotebookPen size={32} />
      </div>
      <div className="empty-title">Your Diary is Empty</div>
      <p className="empty-desc">
        There are no pages yet. Start your personal diary by creating your first page.
      </p>
      <button
        type="button"
        onClick={onAddPage}
        className="add-page-btn"
        style={{ margin: '8px 0 0 0' }}
      >
        <Plus size={16} />
        <span>Create First Page</span>
      </button>
    </div>
  );
}
