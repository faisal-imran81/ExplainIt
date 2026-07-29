import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      {!isUser && (
        <View style={styles.aiLabelRow}>
          <Ionicons name="bulb-outline" size={14} color={COLORS.primary} />
          <Text style={styles.aiLabel}> Elucid </Text>
        </View>
      )}
      <Text style={styles.messageText}>{message.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    maxWidth: '92%',
    marginBottom: SPACING.sm,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: SPACING.xs,
  },
  aiBubble: {
    backgroundColor: COLORS.card,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  aiLabel: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.caption1,
    fontWeight: '700',
  },
  messageText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.callout,
    lineHeight: 24,
  },
});