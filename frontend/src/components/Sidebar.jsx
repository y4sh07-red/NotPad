import React from 'react';
import { Plus, Moon, Sun, BookOpen, ArrowLeft, X } from 'lucide-react';
import PageItem from './PageItem';

export default function Sidebar({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onBackToLanding,
  theme,
  onToggleTheme,
  isOpen,
  onClose,
}) {
  return (
    <>
      {/* Backdrop for mobile sidebar drawer */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* 1. Header */}
        <div className="sidebar-header">
          <div className="logo-group" onClick={onBackToLanding} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="logo-title">NotPad</div>
              <div className="logo-subtitle">Personal Diary</div>
            </div>
          </div>

          <button type="button" onClick={onClose} className="sidebar-close-btn show-mobile">
            <X size={18} />
          </button>
        </div>

        {/* 2. Back to All Notes button */}
        <div className="sidebar-landing-link" onClick={() => { onBackToLanding(); if(onClose) onClose(); }}>
          <ArrowLeft size={15} />
          <span>All Notes Overview</span>
        </div>

        {/* 3. Add New Page Action */}
        <button
          type="button"
          onClick={() => { onAddPage(); if(onClose) onClose(); }}
          className="add-page-btn"
        >
          <Plus size={16} />
          <span>Add New Page</span>
        </button>

        {/* 4. List of Pages */}
        <div className="pages-list">
          {pages.map((page) => (
            <PageItem
              key={page.id}
              page={page}
              isActive={page.id === activePageId}
              onSelect={() => { onSelectPage(page.id); if(onClose) onClose(); }}
              onDelete={onDeletePage}
            />
          ))}
        </div>

        {/* 5. Footer */}
        <div className="sidebar-footer">
          <button
            type="button"
            onClick={onToggleTheme}
            className="theme-toggle-btn"
          >
            {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Green Sage'}</span>
          </button>
          <span className="page-count">
            {pages.length} {pages.length === 1 ? 'page' : 'pages'}
          </span>
        </div>
      </aside>
    </>
  );
}
