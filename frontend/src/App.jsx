import React, { useState, useEffect, useRef, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import Editor from './components/Editor';
import {
  fetchNotesFromBackend,
  createNoteInBackend,
  updateNoteInBackend,
  deleteNoteFromBackend,
} from './api';

const STORAGE_KEY = 'notpad_diary_pages_v2';
const THEME_KEY = 'notpad_theme_v2';

export default function App() {
  const [pages, setPages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Default to null so landing page with all notes opens and NO note is pre-opened
  const [activePageId, setActivePageId] = useState(null);

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch {
      return 'light';
    }
  });

  const [isSaved, setIsSaved] = useState(true);
  const [dbSource, setDbSource] = useState('local');
  const updateTimeoutRef = useRef(null);
  const isEditingRef = useRef(false);

  // Fetch latest notes from Express + Supabase backend
  const refreshNotes = useCallback(async () => {
    if (isEditingRef.current) return;

    const result = await fetchNotesFromBackend();
    if (result.success && Array.isArray(result.notes)) {
      const sorted = [...result.notes].sort(
        (a, b) =>
          new Date(b.updated_at || b.updatedAt || b.created_at) -
          new Date(a.updated_at || a.updatedAt || a.created_at)
      );

      setPages(sorted);
      setDbSource(result.source || 'supabase');

      // Keep activePageId null if user is on landing page, or check if active note still exists
      setActivePageId((prev) => {
        if (!prev) return null;
        const exists = sorted.some((p) => p.id === prev);
        return exists ? prev : null;
      });
    }
  }, []);

  // Initial Load + Auto Sync (Polls every 3.5 seconds)
  useEffect(() => {
    refreshNotes();

    const intervalId = setInterval(refreshNotes, 3500);

    const handleFocus = () => refreshNotes();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshNotes]);

  // Backup to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  }, [pages]);

  // Apply Theme
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Current active page object
  const activePage = pages.find((p) => p.id === activePageId) || null;

  // Add New Diary Note
  const handleAddNewPage = async () => {
    const todayStr = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    const now = new Date().toISOString();
    const newPage = {
      id: `page-${Date.now()}`,
      title: `Entry — ${todayStr}`,
      content: '',
      created_at: now,
      updated_at: now,
      createdAt: now,
      updatedAt: now,
    };

    setPages((prev) => [newPage, ...prev]);
    setActivePageId(newPage.id);

    await createNoteInBackend(newPage);
    refreshNotes();
  };

  // Update Page Title or Content
  const handleUpdatePage = (field, value) => {
    setIsSaved(false);
    isEditingRef.current = true;
    const now = new Date().toISOString();

    const updatedPages = pages.map((page) => {
      if (page.id === activePageId) {
        return {
          ...page,
          [field]: value,
          updated_at: now,
          updatedAt: now,
        };
      }
      return page;
    });

    const sorted = [...updatedPages].sort(
      (a, b) =>
        new Date(b.updated_at || b.updatedAt || b.created_at) -
        new Date(a.updated_at || a.updatedAt || a.created_at)
    );

    setPages(sorted);

    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

    updateTimeoutRef.current = setTimeout(async () => {
      const activeObj = sorted.find((p) => p.id === activePageId);
      if (activeObj) {
        await updateNoteInBackend(activeObj.id, activeObj.title, activeObj.content);
        setIsSaved(true);
        isEditingRef.current = false;
      }
    }, 400);
  };

  // Delete Page
  const handleDeletePage = async (id) => {
    const updated = pages.filter((p) => p.id !== id);
    setPages(updated);
    if (activePageId === id) {
      setActivePageId(null);
    }
    await deleteNoteFromBackend(id);
    refreshNotes();
  };

  // Export Page as TXT
  const handleExportPage = (pageToExport) => {
    const target = pageToExport || activePage;
    if (!target) return;
    const lastDate = target.updated_at || target.updatedAt || target.createdAt;
    const text = `${target.title || 'Untitled Note'}\nLast Updated: ${new Date(
      lastDate
    ).toLocaleString()}\n\n${target.content || ''}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${target.title || 'Diary_Page'}.txt`;
    a.click();
  };

  return (
    <div className="app-container">
      {activePageId === null ? (
        <LandingPage
          pages={pages}
          onSelectPage={setActivePageId}
          onAddPage={handleAddNewPage}
          onDeletePage={handleDeletePage}
          onExportPage={handleExportPage}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />
      ) : (
        <Editor
          page={activePage}
          onUpdatePage={handleUpdatePage}
          onExportPage={handleExportPage}
          onDeletePage={handleDeletePage}
          onBack={() => setActivePageId(null)}
          isSaved={isSaved}
          dbSource={dbSource}
        />
      )}
    </div>
  );
}
