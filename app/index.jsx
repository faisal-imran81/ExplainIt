import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { signOut } from '../lib/supabase';

const DIFFICULTIES = [
  { value: 'eli5', label: 'ELI5' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'phd', label: 'PhD' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');

  const handleExplain = () => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) return;
    router.push({
      pathname: '/explain',
      params: { topic: trimmedTopic, difficulty },
    });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (err) {
            Alert.alert('Error', 'Could not logout. Try again.');
          }
          router.replace('/auth');
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Logout Button - Top Right */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>⏻</Text>
      </TouchableOpacity>
        
      // logoutBtn ke saath profile button add karo
      <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/profile')}>
      <Text style={styles.profileIcon}>👤</Text>
      </TouchableOpacity>
      
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>ExplainIt</Text>
          <Text style={styles.subtitle}>Learn anything at your level.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Topic</Text>
          <TextInput
            style={styles.input}
            placeholder="What do you want explained?"
            placeholderTextColor={COLORS.textSecondary}
            value={topic}
            onChangeText={setTopic}
            returnKeyType="done"
            onSubmitEditing={handleExplain}
          />

          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.difficultyGrid}>
            {DIFFICULTIES.map((item) => {
              const selected = item.value === difficulty;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.difficultyButton,
                    selected && styles.selectedDifficulty,
                  ]}
                  onPress={() => setDifficulty(item.value)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      selected && styles.selectedDifficultyText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, !topic.trim() && styles.disabledButton]}
            onPress={handleExplain}
            disabled={!topic.trim()}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Explain</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/history')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  logoutBtn: {
    position: 'absolute',
    top: 52,
    right: SPACING.lg,
    zIndex: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },

  profileBtn: {
  position: 'absolute',
  top: 52,
  right: SPACING.lg + 52,
  zIndex: 10,
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 10,
  paddingHorizontal: SPACING.sm,
  paddingVertical: SPACING.sm,
  },
  profileIcon: { fontSize: 18 },
  logoutIcon: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  logo: {
    color: COLORS.text,
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  form: {
    gap: SPACING.md,
  },
  label: {
    color: COLORS.text,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    paddingHorizontal: SPACING.md,
  },
  difficultyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  difficultyButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  selectedDifficulty: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  difficultyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  selectedDifficultyText: {
    color: COLORS.text,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginTop: SPACING.sm,
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  secondaryButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
});