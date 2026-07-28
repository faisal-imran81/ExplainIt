import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const DIFFICULTIES = [
  { key: 'eli5', label: 'ELI5', emoji: '👶', desc: 'Super Simple' },
  { key: 'beginner', label: 'Beginner', emoji: '🌱', desc: 'Easy' },
  { key: 'intermediate', label: 'Inter..', emoji: '📚', desc: 'Moderate' },
  { key: 'advanced', label: 'Advanced', emoji: '🔬', desc: 'Deep' },
  { key: 'phd', label: 'PhD', emoji: '🎓', desc: 'Expert' },
];

export default function DifficultySlider({ selected, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Choose your level:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[styles.btn, selected === d.key && styles.btnActive]}
              onPress={() => onSelect(d.key)}
            >
              <Text style={styles.emoji}>{d.emoji}</Text>
              <Text style={[styles.btnLabel, selected === d.key && styles.btnLabelActive]}>
                {d.label}
              </Text>
              <Text style={styles.desc}>{d.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  row: { flexDirection: 'row', gap: SPACING.sm },
  btn: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 75,
  },
  btnActive: {
    backgroundColor: COLORS.primary + '25',
    borderColor: COLORS.primary,
  },
  emoji: { fontSize: 20, marginBottom: 2 },
  btnLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
  },
  btnLabelActive: { color: COLORS.primary },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
});