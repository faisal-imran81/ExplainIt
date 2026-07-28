import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      {!isUser && (
        <View style={styles.aiLabelRow}>
          <Ionicons name="bulb-outline" size={14} color={COLORS.primary} />
          <Text style={styles.aiLabel}> ExplainIt</Text>
        </View>
      )}
      <Text style={styles.messageText}>{message.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 16,
    padding: SPACING.md,
    maxWidth: '95%',
    marginBottom: SPACING.sm,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: COLORS.card,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  aiLabel: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
  },
  messageText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    lineHeight: 22,
  },
});