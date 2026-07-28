import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Save conversation to Supabase
export const saveConversation = async (topic, difficulty, messages) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ topic, difficulty, messages, created_at: new Date() }]);
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