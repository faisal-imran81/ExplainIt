import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

export default function ExplainCard({ topic, difficulty, preview, onPress, onDelete }) {
  const difficultyColors = {
    eli5: '#FF6584',
    beginner: '#4CAF50',
    intermediate: '#FF9800',
    advanced: '#6C63FF',
    phd: '#E91E63',
  };

  const color = difficultyColors[difficulty] || COLORS.primary;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={1}>
      <View style={styles.cardHeader}>
        <View style={styles.topicRow}>
          <Ionicons name="book-outline" size={15} color={COLORS.text} />
          <Text style={styles.topic} numberOfLines={1}> {topic}</Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={15} color={COLORS.error} />
        </TouchableOpacity>
      </View>
      <View style={[styles.badge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.badgeText, { color }]}>{difficulty?.toUpperCase()}</Text>
      </View>
      <Text style={styles.preview} numberOfLines={2}>{preview}</Text>
      <View style={styles.reopenRow}>
        <Text style={styles.reopen}>Tap to reopen </Text>
        <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  topic: {
    color: COLORS.text,
    fontSize: FONTS.sizes.callout,
    fontWeight: '700',
    flex: 1,
  },
  deleteBtn: { padding: SPACING.xs },
  topicRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  reopenRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  badgeText: { fontSize: FONTS.sizes.caption1, fontWeight: '700' },
  preview: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.subhead,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  reopen: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.footnote,
    fontWeight: '600',
    textAlign: 'right',
  },
});