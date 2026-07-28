import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getConversations, deleteConversation } from '../lib/supabase';
import { COLORS, SPACING, FONTS } from '../constants/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getConversations();
      setConversations(data || []);
    } catch (err) {
      Alert.alert('Error', 'Could not load history. Check Supabase connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete conversation',
      'Remove this conversation from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(id);
              setConversations((prev) => prev.filter((c) => c.id !== id));
            } catch {
              Alert.alert('Error', 'Could not delete.');
            }
          },
        },
      ]
    );
  };

  const handleReopen = (item) => {
    router.push({
      pathname: '/explain',
      params: { id: item.id, topic: item.topic, difficulty: item.difficulty },
    });
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      eli5: '#FF6584',
      beginner: '#4CAF50',
      intermediate: '#FF9800',
      advanced: '#6C63FF',
      phd: '#E91E63',
    };
    return colors[difficulty] || COLORS.primary;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => handleReopen(item)}
        activeOpacity={0.82}
      >
        <View style={styles.cardHeader}>
          <View style={styles.topicRow}>
            <Ionicons name="book-outline" size={18} color={COLORS.primary} />
            <Text style={styles.topicText} numberOfLines={1}>
              {item.topic}
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View
            style={[
              styles.diffBadge,
              { backgroundColor: getDifficultyColor(item.difficulty) + '25' },
            ]}
          >
            <Text
              style={[
                styles.diffBadgeText,
                { color: getDifficultyColor(item.difficulty) },
              ]}
            >
              {item.difficulty?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.msgCountRow}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={13}
              color={COLORS.textSecondary}
            />
            <Text style={styles.msgCount}>
              {item.messages?.length || 0} messages
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        <Text style={styles.previewText} numberOfLines={2}>
          {item.messages?.[1]?.content || 'No preview available'}
        </Text>
      </TouchableOpacity>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.openBtn}
          onPress={() => handleReopen(item)}
          activeOpacity={0.85}
        >
          <Text style={styles.openBtnText}>Open</Text>
          <Ionicons name="arrow-forward" size={15} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.deleteBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.topic} conversation`}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Loading your history...</Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIcon}>
          <Ionicons name="file-tray-outline" size={46} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>No history yet!</Text>
        <Text style={styles.emptySubtitle}>
          Start learning and save conversations to see them here.
        </Text>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => router.push('/')}
        >
          <Ionicons name="sparkles-outline" size={17} color={COLORS.text} />
          <Text style={styles.startBtnText}>Start Learning</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Ionicons name="school-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.headerText}>
              {conversations.length} Concept{conversations.length > 1 ? 's' : ''} Learned
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SPACING.md, gap: SPACING.md, paddingBottom: 40 },
  headerText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardBody: {
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  topicRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  topicText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    flex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  diffBadge: {
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  diffBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: 'bold' },
  msgCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  msgCount: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  dateText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  previewText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 36,
    paddingRight: SPACING.sm,
  },
  openBtnText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 36,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
  },
  deleteBtnText: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '18',
    borderWidth: 1,
    borderColor: COLORS.primary + '45',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  startBtnText: { color: COLORS.text, fontWeight: 'bold', fontSize: FONTS.sizes.md },
});
