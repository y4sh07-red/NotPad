import React from 'react';
import { Trash2, FileText, Clock } from 'lucide-react';

export default function PageItem({ page, isActive, onSelect, onDelete }) {
  // Use updated_at timestamp or fallback to createdAt
  const lastUpdated = page.updated_at || page.updatedAt || page.created_at || page.createdAt;
  
  const dateDisplay = lastUpdated
    ? new Date(lastUpdated).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      onClick={onSelect}
      className={`page-item ${isActive ? 'active' : ''}`}
    >
      <div className="page-item-header">
        <div className="page-item-title-wrapper">
          <FileText size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
          <span className="page-item-title">{page.title || 'Untitled Page'}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(page.id);
          }}
          title="Delete page"
          className="delete-btn"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <div className="page-item-preview">
        {page.content || 'Blank page...'}
      </div>
      <div className="page-item-date" style={{ display: 'flex', itemsCenter: 'center', gap: '4px' }}>
        <Clock size={10} style={{ opacity: 0.7 }} />
        <span>Updated: {dateDisplay}</span>
      </div>
    </div>
  );
}
