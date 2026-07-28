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
import { getBookmarks, deleteBookmark } from '../lib/supabase';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function BookmarksScreen() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const data = await getBookmarks();
      setBookmarks(data || []);
    } catch (err) {
      Alert.alert('Error', 'Could not load bookmarks.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Remove Bookmark', 'Remove this from bookmarks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBookmark(id);
            setBookmarks((prev) => prev.filter((b) => b.id !== id));
          } catch {
            Alert.alert('Error', 'Could not remove bookmark.');
          }
        },
      },
    ]);
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
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.topicText} numberOfLines={1}>
          🔖 {item.topic}
        </Text>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metaRow}>
        <View style={[
          styles.badge,
          { backgroundColor: getDifficultyColor(item.difficulty) + '25' }
        ]}>
          <Text style={[
            styles.badgeText,
            { color: getDifficultyColor(item.difficulty) }
          ]}>
            {item.difficulty?.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>

      <Text style={styles.contentPreview} numberOfLines={4}>
        {item.content}
      </Text>

      <TouchableOpacity
        style={styles.reopenBtn}
        onPress={() => router.push({
          pathname: '/explain',
          params: { topic: item.topic, difficulty: item.difficulty },
        })}
      >
        <Text style={styles.reopenBtnText}>↗ Learn Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Loading bookmarks...</Text>
      </View>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>🔖</Text>
        <Text style={styles.emptyTitle}>No bookmarks yet!</Text>
        <Text style={styles.emptySubtitle}>
          Bookmark explanations from the explain screen to save them here.
        </Text>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => router.push('/')}
        >
          <Text style={styles.startBtnText}>✨ Start Learning</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.headerText}>
            🔖 {bookmarks.length} Bookmark{bookmarks.length > 1 ? 's' : ''} Saved
          </Text>
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
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  topicText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    flex: 1,
  },
  deleteBtn: { padding: SPACING.xs },
  deleteBtnText: { fontSize: 16 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: FONTS.sizes.xs, fontWeight: 'bold' },
  dateText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  contentPreview: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  reopenBtn: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 10,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  reopenBtnText: {
    color: COLORS.primary,
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
  emptyEmoji: { fontSize: 60, marginBottom: SPACING.md },
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
    borderRadius: 16,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  startBtnText: { color: COLORS.text, fontWeight: 'bold', fontSize: FONTS.sizes.md },
});