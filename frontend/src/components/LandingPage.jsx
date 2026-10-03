import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Grid,
  List,
  Sun,
  Moon,
  BookOpen,
  SortAsc,
  Sparkles,
  X,
} from 'lucide-react';
import NoteCard from './NoteCard';
import EmptyState from './EmptyState';

export default function LandingPage({
  pages,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onExportPage,
  theme,
  onToggleTheme,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'title'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Filter & Sort Pages
  const filteredAndSortedPages = useMemo(() => {
    let result = [...pages];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.content && p.content.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      const dateA = new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt || 0);
      const dateB = new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt || 0);
      if (sortBy === 'oldest') {
        return dateA - dateB;
      }
      // default: newest
      return dateB - dateA;
    });

    return result;
  }, [pages, searchQuery, sortBy]);

  return (
    <div className="landing-container">
      {/* 1. Navbar / Top Banner */}
      <header className="landing-header">
        <div className="landing-brand">
          <div className="landing-logo-icon">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="landing-title">NotPad</h1>
            <p className="landing-subtitle">Personal Diary & Notes</p>
          </div>
        </div>

        <div className="landing-header-actions">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            <span className="hide-mobile">{theme === 'light' ? 'Dark Mode' : 'Green Sage'}</span>
          </button>

          <button
            type="button"
            className="create-note-btn"
            onClick={onAddPage}
          >
            <Plus size={18} />
            <span>New Note</span>
          </button>
        </div>
      </header>

      {/* 2. Hero & Toolbar Area */}
      <main className="landing-main">
        <div className="landing-hero">
          <div className="hero-text">
            <h2>All Notes ({pages.length})</h2>
            <p>Your thoughts, ideas, and memories stored safely.</p>
          </div>

          <div className="hero-stats hide-mobile">
            <div className="stat-badge">
              <Sparkles size={14} />
              <span>{pages.length} {pages.length === 1 ? 'Note' : 'Notes'}</span>
            </div>
          </div>
        </div>

        {/* 3. Search & Control Bar */}
        <div className="controls-bar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              spellCheck={false}
              autoCorrect="off"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="controls-right">
            <div className="sort-dropdown-wrap">
              <SortAsc size={14} className="sort-icon" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <Grid size={15} />
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Notes Grid / List */}
        {pages.length === 0 ? (
          <EmptyState onAddPage={onAddPage} />
        ) : filteredAndSortedPages.length === 0 ? (
          <div className="no-search-results">
            <p>No notes found matching "{searchQuery}"</p>
            <button
              type="button"
              className="action-btn"
              onClick={() => setSearchQuery('')}
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          <div className={`notes-container ${viewMode}-view`}>
            {/* Create New Note CTA Card */}
            <div className="create-card" onClick={onAddPage}>
              <div className="create-card-icon">
                <Plus size={24} />
              </div>
              <span className="create-card-text">Create New Note</span>
            </div>

            {/* Note Cards */}
            {filteredAndSortedPages.map((page) => (
              <NoteCard
                key={page.id}
                page={page}
                onSelect={() => onSelectPage(page.id)}
                onDelete={onDeletePage}
                onExport={onExportPage}
              />
            ))}
          </div>
        )}
      </main>

      {/* 5. Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        className="mobile-fab"
        onClick={onAddPage}
        title="Create Note"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
