import React, { useRef, useEffect } from 'react';
import { ArrowLeft, Clock, Download, Check, Trash2 } from 'lucide-react';

export default function Editor({
  page,
  onUpdatePage,
  onExportPage,
  onDeletePage,
  onBack,
  isSaved,
  dbSource,
}) {
  const titleInputRef = useRef(null);

  // Focus title when a newly created page opens
  useEffect(() => {
    if (page && !page.content && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [page?.id]);

  if (!page) return null;

  const wordCount = page.content?.trim()
    ? page.content.trim().split(/\s+/).length
    : 0;
  const charCount = page.content?.length || 0;

  const lastUpdated = page.updated_at || page.updatedAt || page.created_at || page.createdAt;

  const formattedUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <main className="editor-main">
      {/* Editor Top Bar */}
      <div className="editor-header">
        <div className="editor-header-left">
          <button
            type="button"
            onClick={onBack}
            className="back-btn"
            title="Back to All Notes"
          >
            <ArrowLeft size={16} />
            <span>All Notes</span>
          </button>

          <div className="editor-date-badge hide-mobile">
            <Clock size={14} />
            <span>Updated: {formattedUpdated}</span>
          </div>
        </div>

        <div className="editor-actions">
          <button
            type="button"
            onClick={() => onExportPage(page)}
            className="action-btn"
            title="Export to Text file"
          >
            <Download size={14} />
            <span className="hide-mobile">Export</span>
          </button>

          <button
            type="button"
            onClick={() => onDeletePage(page.id)}
            className="action-btn delete"
            title="Delete note"
          >
            <Trash2 size={14} />
            <span className="hide-mobile">Delete</span>
          </button>
        </div>
      </div>

      {/* Mobile date bar */}
      <div className="mobile-date-bar show-mobile">
        <Clock size={12} />
        <span>Updated: {formattedUpdated}</span>
      </div>

      {/* Editor Writing Area */}
      <div className="editor-body">
        <div className="editor-content-container">
          <input
            ref={titleInputRef}
            type="text"
            placeholder="Title..."
            value={page.title || ''}
            onChange={(e) => onUpdatePage('title', e.target.value)}
            className="title-input"
          />

          <textarea
            placeholder="Write whatever comes to mind..."
            value={page.content || ''}
            onChange={(e) => onUpdatePage('content', e.target.value)}
            className="diary-textarea"
          />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="editor-footer">
        <div>
          {wordCount} {wordCount === 1 ? 'word' : 'words'} • {charCount} characters
        </div>
        <div className="save-status">
          <Check size={13} className="check-icon" />
          <span>{isSaved ? 'Saved' : 'Saving...'}</span>
        </div>
      </div>
    </main>
  );
}
