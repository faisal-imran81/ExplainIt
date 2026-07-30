import { useState, useRef } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useResponsive } from '../utils/responsive';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { signOut } from '../lib/supabase';

const DIFFICULTIES = [
  { value: 'eli5', label: 'ELI5' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'phd', label: 'PhD' },
];

const SUGGESTIONS = [
  { label: 'Quantum Physics', topic: 'Quantum Physics', difficulty: 'beginner' },
  { label: 'How AI Works', topic: 'How Artificial Intelligence Works', difficulty: 'intermediate' },
  { label: 'Python Basics', topic: 'Python Programming', difficulty: 'beginner' },
  { label: 'Black Holes', topic: 'Black Holes', difficulty: 'eli5' },
  { label: 'Blockchain', topic: 'Blockchain Technology', difficulty: 'intermediate' },
  { label: 'DNA & Genetics', topic: 'DNA and Genetics', difficulty: 'beginner' },
  { label: 'Space Travel', topic: 'Space Travel and Rockets', difficulty: 'eli5' },
  { label: 'Stock Market', topic: 'How the Stock Market Works', difficulty: 'beginner' },
  { label: 'Electricity', topic: 'How Electricity Works', difficulty: 'eli5' },
  { label: 'Neural Networks', topic: 'Neural Networks', difficulty: 'advanced' },
];

function PressScale({ children, onPress, style, ...props }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, friction: 8, tension: 150, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { containerStyle } = useResponsive();
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

  const handleSuggestion = (suggestion) => {
    setTopic(suggestion.topic);
    setDifficulty(suggestion.difficulty);
  };

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await signOut();
      } catch {}
      router.replace('/auth');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        doLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, containerStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.headerBar}>
        <PressScale onPress={handleLogout}>
          <View style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.textSecondary} />
          </View>
        </PressScale>
        <PressScale onPress={() => router.push('/profile')}>
          <View style={styles.iconBtn}>
            <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
          </View>
        </PressScale>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.hero}>
          <Text style={styles.greeting}>What would you like</Text>
          <Text style={styles.greetingAccent}>to learn today?</Text>
        </View>

        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsLabel}>Try asking about...</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsRow}
          >
            {SUGGESTIONS.map((item) => (
              <PressScale key={item.topic} onPress={() => handleSuggestion(item)}>
                <View style={[
                  styles.suggestionChip,
                  topic === item.topic && styles.suggestionChipActive
                ]}>
                  <Ionicons
                    name={item.icon}
                    size={14}
                    color={topic === item.topic ? COLORS.text : COLORS.textSecondary}
                  />
                  <Text style={[
                    styles.suggestionChipText,
                    topic === item.topic && styles.suggestionChipTextActive
                  ]}>
                    {item.label}
                  </Text>
                </View>
              </PressScale>
            ))}
          </ScrollView>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Topic</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="search-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Quantum Physics, Python..."
                placeholderTextColor={COLORS.textTertiary}
                value={topic}
                onChangeText={setTopic}
                returnKeyType="done"
                onSubmitEditing={handleExplain}
                selectionColor={COLORS.primary}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.difficultyGrid}>
              {DIFFICULTIES.map((item) => {
                const selected = item.value === difficulty;
                return (
                  <PressScale key={item.value} onPress={() => setDifficulty(item.value)}>
                    <View
                      style={[
                        styles.difficultyButton,
                        selected && styles.selectedDifficulty,
                      ]}
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          selected && styles.selectedDifficultyText,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </PressScale>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.bottomActions}>
          <PressScale onPress={handleExplain} disabled={!topic.trim()}>
            <View style={[styles.primaryButton, !topic.trim() && styles.disabledButton]}>
              <Text style={styles.primaryButtonText}>Explain</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.text} />
            </View>
          </PressScale>

          <PressScale onPress={() => router.push('/history')}>
            <View style={styles.secondaryButton}>
              <Ionicons name="time-outline" size={18} color={COLORS.text} />
              <Text style={styles.secondaryButtonText}>History</Text>
            </View>
          </PressScale>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    paddingTop: Platform.select({
      ios: 56,
      android: StatusBar.currentHeight ? StatusBar.currentHeight + SPACING.sm : SPACING.xl,
      default: SPACING.lg,
    }),
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    color: COLORS.text,
    fontSize: FONTS.sizes.title3,
    fontWeight: '400',
    textAlign: 'center',
  },
  greetingAccent: {
    color: COLORS.text,
    fontSize: FONTS.sizes.largeTitle,
    fontWeight: '700',
    marginTop: SPACING.xxs,
    textAlign: 'center',
  },
  form: {
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  suggestionsSection: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  suggestionsLabel: {
    color: COLORS.text,
    fontSize: FONTS.sizes.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: SPACING.xs,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  suggestionChip: {
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  suggestionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  suggestionChipText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.subhead,
    fontWeight: '500',
  },
  suggestionChipTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  bottomActions: {
    gap: SPACING.md,
  },
  fieldGroup: {
    gap: SPACING.sm,
  },
  label: {
    color: COLORS.text,
    fontSize: FONTS.sizes.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.sizes.body,
    paddingVertical: SPACING.sm,
  },
  difficultyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  difficultyButton: {
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  selectedDifficulty: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  difficultyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.subhead,
    fontWeight: '500',
  },
  selectedDifficultyText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    minHeight: 54,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    gap: SPACING.sm,
  },
  disabledButton: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.headline,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    minHeight: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.headline,
    fontWeight: '500',
  },
});