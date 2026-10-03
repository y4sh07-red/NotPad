const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let supabase = null;
const isPlaceholder = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseKey || supabaseKey.includes('your-supabase');

if (!isPlaceholder && supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized with custom project credentials');
  } catch (err) {
    console.warn('⚠️ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️ Running backend in Local/In-Memory mode. To connect Supabase, update backend/.env with your real URL & Key.');
}

// In-Memory Backup Cache for offline/local mode
let localNotes = [];

// Helper to check if Supabase is connected and table exists
async function isSupabaseReady() {
  if (!supabase || isPlaceholder) return false;
  try {
    const { error } = await supabase.from('notes').select('id').limit(1);
    if (error) return false;
    return true;
  } catch (e) {
    return false;
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Root health check endpoint (Prevents 404 on http://localhost:5000/)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'NotPad Express Backend',
    message: 'Backend is running. Notes API available at /api/notes',
  });
});

// 1. GET ALL NOTES (Ordered by latest updated_at)
app.get('/api/notes', async (req, res) => {
  try {
    const ready = await isSupabaseReady();
    if (ready) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, source: 'supabase', data: data || [] });
    } else {
      // Return local sorted notes
      const sorted = [...localNotes].sort(
        (a, b) => new Date(b.updated_at || b.updatedAt) - new Date(a.updated_at || a.updatedAt)
      );
      return res.json({ success: true, source: 'local', data: sorted });
    }
  } catch (err) {
    console.error('Error fetching notes:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. CREATE NEW NOTE
app.post('/api/notes', async (req, res) => {
  try {
    const { id, title, content } = req.body;
    const now = new Date().toISOString();

    const notePayload = {
      id: id || `page-${Date.now()}`,
      title: title || '',
      content: content || '',
      created_at: now,
      updated_at: now,
    };

    const ready = await isSupabaseReady();
    if (ready) {
      const { data, error } = await supabase
        .from('notes')
        .insert([notePayload])
        .select();

      if (error) throw error;
      return res.status(201).json({ success: true, source: 'supabase', data: data[0] });
    } else {
      localNotes.unshift(notePayload);
      return res.status(201).json({ success: true, source: 'local', data: notePayload });
    }
  } catch (err) {
    console.error('Error creating note:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. UPDATE NOTE (Updates title, content, and latest updated_at timestamp)
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const now = new Date().toISOString();

    const updatePayload = {
      updated_at: now,
    };
    if (title !== undefined) updatePayload.title = title;
    if (content !== undefined) updatePayload.content = content;

    const ready = await isSupabaseReady();
    if (ready) {
      const { data, error } = await supabase
        .from('notes')
        .update(updatePayload)
        .eq('id', id)
        .select();

      if (error) throw error;
      return res.json({
        success: true,
        source: 'supabase',
        data: data ? data[0] : { id, ...updatePayload },
      });
    } else {
      const index = localNotes.findIndex((n) => n.id === id);
      if (index >= 0) {
        localNotes[index] = { ...localNotes[index], ...updatePayload };
        return res.json({ success: true, source: 'local', data: localNotes[index] });
      } else {
        const newNote = { id, title: title || '', content: content || '', created_at: now, updated_at: now };
        localNotes.unshift(newNote);
        return res.json({ success: true, source: 'local', data: newNote });
      }
    }
  } catch (err) {
    console.error('Error updating note:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. DELETE NOTE
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ready = await isSupabaseReady();

    if (ready) {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    }

    localNotes = localNotes.filter((n) => n.id !== id);
    res.json({ success: true, message: `Note ${id} deleted` });
  } catch (err) {
    console.error('Error deleting note:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. STATUS & HEALTH CHECK
app.get('/api/status', async (req, res) => {
  const ready = await isSupabaseReady();
  res.json({
    status: 'online',
    supabaseConnected: ready,
    supabaseConfigured: !isPlaceholder,
    message: ready
      ? 'Connected to Supabase Database'
      : 'Using local cache mode. Update backend/.env to connect Supabase.',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 NotPad Express Backend running on http://localhost:${PORT}`);
});
