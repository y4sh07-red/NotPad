const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
).replace(/\/$/, '') + '/api';

export async function fetchNotesFromBackend() {
  try {
    const res = await fetch(`${API_BASE_URL}/notes`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      return { success: true, notes: data.data, source: data.source };
    }
    return { success: false, notes: [] };
  } catch (err) {
    console.warn('Backend API connection failed, using local cache:', err.message);
    return { success: false, error: err.message };
  }
}

export async function createNoteInBackend(note) {
  try {
    const res = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return await res.json();
  } catch (err) {
    console.warn('Failed to create note in backend:', err.message);
    return { success: false, error: err.message };
  }
}

export async function updateNoteInBackend(id, title, content) {
  try {
    const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    return await res.json();
  } catch (err) {
    console.warn('Failed to update note in backend:', err.message);
    return { success: false, error: err.message };
  }
}

export async function deleteNoteFromBackend(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (err) {
    console.warn('Failed to delete note in backend:', err.message);
    return { success: false, error: err.message };
  }
}
