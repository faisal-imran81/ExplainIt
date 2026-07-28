import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Platform-aware storage for session persistence
const getWebStorage = () => {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      return {
        getItem: (key) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
        removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
      };
    }
  } catch {}
  return null;
};

const memoryStorage = {
  getItem: (key) => Promise.resolve(null),
  setItem: (key, value) => Promise.resolve(undefined),
  removeItem: (key) => Promise.resolve(undefined),
};

const storage = Platform.OS === 'web'
  ? (getWebStorage() || memoryStorage)
  : {
      getItem: async (key) => {
        const SecureStore = await import('expo-secure-store');
        return SecureStore.getItemAsync(key);
      },
      setItem: async (key, value) => {
        const SecureStore = await import('expo-secure-store');
        return SecureStore.setItemAsync(key, value);
      },
      removeItem: async (key) => {
        const SecureStore = await import('expo-secure-store');
        return SecureStore.deleteItemAsync(key);
      },
    };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Auth Functions ───────────────────────────────────────────

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signInAnonymously = async () => {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const onAuthStateChange = (callback) =>
  supabase.auth.onAuthStateChange(callback);

// ─── Conversation Functions ───────────────────────────────────
export const saveConversation = async (topic, difficulty, messages) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('conversations')
    .insert([{
      topic,
      difficulty,
      messages,
      user_id: user?.id,
      created_at: new Date(),
    }])
    .select();
  if (error) throw error;
  return data;
};

// Update existing conversation messages
export const updateConversation = async (id, messages) => {
  const { error } = await supabase
    .from('conversations')
    .update({ messages })
    .eq('id', id);
  if (error) throw error;
};

// Get a single conversation by ID
export const getConversationById = async (id) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

// Get all conversations
export const getConversations = async () => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// Delete conversation
export const deleteConversation = async (id) => {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);
  if (error) throw error;
};