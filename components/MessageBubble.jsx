import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      {!isUser && <Text style={styles.aiLabel}>🧠 ExplainIt</Text>}
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
  aiLabel: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  messageText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    lineHeight: 22,
  },
});