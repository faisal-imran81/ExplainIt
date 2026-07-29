import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const DIFFICULTIES = [
  { key: 'eli5', label: 'ELI5', icon: 'happy-outline', desc: 'Super Simple' },
  { key: 'beginner', label: 'Beginner', icon: 'leaf-outline', desc: 'Easy' },
  { key: 'intermediate', label: 'Inter..', icon: 'book-outline', desc: 'Moderate' },
  { key: 'advanced', label: 'Advanced', icon: 'flask-outline', desc: 'Deep' },
  { key: 'phd', label: 'PhD', icon: 'school-outline', desc: 'Expert' },
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
              <Ionicons name={d.icon} size={20} color={selected === d.key ? COLORS.primary : COLORS.textSecondary} />
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
  container: { marginBottom: SPACING.lg },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  row: { flexDirection: 'row', gap: SPACING.sm },
  btn: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    minWidth: 76,
  },
  btnActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  btnLabel: {
    color: COLORS.textTertiary,
    fontSize: FONTS.sizes.footnote,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  btnLabelActive: { color: COLORS.primary },
  desc: {
    color: COLORS.textTertiary,
    fontSize: FONTS.sizes.caption2,
    marginTop: SPACING.xxs,
  },
});