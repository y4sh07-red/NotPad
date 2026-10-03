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
  
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  const activePageIdRef = useRef(activePageId);
  activePageIdRef.current = activePageId;

  const updateTimeoutRef = useRef(null);
  const isEditingRef = useRef(false);
  const editVersionRef = useRef(0);

  // Fetch latest notes from Express + Supabase backend
  const refreshNotes = useCallback(async () => {
    // If user is actively typing/editing, skip auto-sync to prevent cursor jumps or text resets
    if (isEditingRef.current) return;

    const result = await fetchNotesFromBackend();
    if (result.success && Array.isArray(result.notes)) {
      const currentActiveId = activePageIdRef.current;
      const currentPages = pagesRef.current;
      const activeLocalNote = currentPages.find((p) => p.id === currentActiveId);

      // Merge backend notes while strictly protecting any active editing note's content
      const mergedNotes = result.notes.map((serverNote) => {
        if (currentActiveId && serverNote.id === currentActiveId && activeLocalNote) {
          return {
            ...serverNote,
            title: activeLocalNote.title,
            content: activeLocalNote.content,
            updated_at: activeLocalNote.updated_at || serverNote.updated_at,
            updatedAt: activeLocalNote.updatedAt || serverNote.updatedAt,
          };
        }
        return serverNote;
      });

      // Keep any local-only notes that haven't synced yet
      currentPages.forEach((localNote) => {
        if (!mergedNotes.some((n) => n.id === localNote.id)) {
          mergedNotes.push(localNote);
        }
      });

      const sorted = mergedNotes.sort(
        (a, b) =>
          new Date(b.updated_at || b.updatedAt || b.created_at || 0) -
          new Date(a.updated_at || a.updatedAt || a.created_at || 0)
      );

      setPages(sorted);
      setDbSource(result.source || 'supabase');

      // Keep activePageId null if user is on landing page, or verify it still exists
      setActivePageId((prev) => {
        if (!prev) return null;
        const exists = sorted.some((p) => p.id === prev);
        return exists ? prev : null;
      });
    }
  }, []);

  // Initial Load + Auto Sync (Polls every 4 seconds)
  useEffect(() => {
    refreshNotes();

    const intervalId = setInterval(refreshNotes, 4000);

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

  // Immediately flush any pending debounced save
  const flushPendingSave = async () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    const currentActiveId = activePageIdRef.current;
    if (!currentActiveId) return;

    const currentActiveObj = pagesRef.current.find((p) => p.id === currentActiveId);
    if (currentActiveObj) {
      await updateNoteInBackend(currentActiveObj.id, currentActiveObj.title, currentActiveObj.content);
      setIsSaved(true);
      isEditingRef.current = false;
    }
  };

  // Add New Diary Note
  const handleAddNewPage = async () => {
    await flushPendingSave();

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
    editVersionRef.current += 1;
    const version = editVersionRef.current;
    const now = new Date().toISOString();
    const targetId = activePageId;

    setPages((prevPages) =>
      prevPages.map((page) => {
        if (page.id === targetId) {
          return {
            ...page,
            [field]: value,
            updated_at: now,
            updatedAt: now,
          };
        }
        return page;
      })
    );

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      const activeObj = pagesRef.current.find((p) => p.id === targetId);
      if (activeObj) {
        await updateNoteInBackend(activeObj.id, activeObj.title, activeObj.content);
        // Only mark saved if no new edits occurred during the backend request
        if (editVersionRef.current === version) {
          setIsSaved(true);
          isEditingRef.current = false;
        }
      }
    }, 450);
  };

  // Delete Page
  const handleDeletePage = async (id) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    setPages((prev) => prev.filter((p) => p.id !== id));
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

  const handleBackToLanding = async () => {
    await flushPendingSave();
    setActivePageId(null);
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
          onBack={handleBackToLanding}
          isSaved={isSaved}
          dbSource={dbSource}
        />
      )}
    </div>
  );
}
