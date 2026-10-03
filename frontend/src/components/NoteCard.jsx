import React from 'react';
import { Trash2, Download, Clock, FileText, ArrowRight } from 'lucide-react';

export default function NoteCard({ page, onSelect, onDelete, onExport }) {
  const lastUpdated = page.updated_at || page.updatedAt || page.created_at || page.createdAt;

  const dateDisplay = lastUpdated
    ? new Date(lastUpdated).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const wordCount = page.content?.trim()
    ? page.content.trim().split(/\s+/).length
    : 0;

  return (
    <div className="note-card" onClick={onSelect}>
      <div className="note-card-header">
        <div className="note-card-title-group">
          <div className="note-card-icon">
            <FileText size={16} />
          </div>
          <h3 className="note-card-title">{page.title || 'Untitled Note'}</h3>
        </div>

        <div className="note-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="card-action-btn"
            title="Export as TXT"
            onClick={() => onExport(page)}
          >
            <Download size={13} />
          </button>
          <button
            type="button"
            className="card-action-btn delete"
            title="Delete note"
            onClick={() => onDelete(page.id)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <p className="note-card-snippet">
        {page.content ? page.content : <span className="empty-snippet">Empty note...</span>}
      </p>

      <div className="note-card-footer">
        <div className="note-card-meta">
          <Clock size={12} />
          <span>{dateDisplay}</span>
        </div>
        <div className="note-card-meta">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <ArrowRight size={13} className="card-arrow" />
        </div>
      </div>
    </div>
  );
}
