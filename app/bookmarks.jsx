import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  PanResponder,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getBookmarks, deleteBookmark } from '../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { useResponsive } from '../utils/responsive';

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

function SwipeableCard({ children, onDelete }) {
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(Math.max(g.dx, -80));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) {
          Animated.spring(translateX, { toValue: -80, friction: 8, tension: 60, useNativeDriver: true }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeDeleteAction}>
        <TouchableOpacity onPress={onDelete} style={styles.swipeDeleteBtn}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.swipeDeleteText}>Remove</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

function ShimmerOverlay() {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.07)',
        transform: [{
          translateX: shimmerAnim.interpolate({
            inputRange: [-1, 1],
            outputRange: [-200, 200],
          }),
        }],
      }}
    />
  );
}

export default function BookmarksScreen() {
  const router = useRouter();
  const { containerStyle } = useResponsive();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');

  const cardAnims = useRef({});

  // Empty state animations
  const bobAnim = useRef(new Animated.Value(0)).current;
  const emptyTitleAnim = useRef(new Animated.Value(0)).current;
  const emptySubAnim = useRef(new Animated.Value(0)).current;
  const emptyBtnAnim = useRef(new Animated.Value(0)).current;

  // Header animations
  const titleAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;
  const countScale = useRef(new Animated.Value(1)).current;

  // Action menu animation
  const actionSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchBookmarks();
  }, []);

  // Empty state animations
  useEffect(() => {
    if (bookmarks.length === 0 && !loading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bobAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(bobAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
      );
      loop.start();
      Animated.spring(emptyTitleAnim, { toValue: 1, delay: 200, friction: 6, tension: 40, useNativeDriver: true }).start();
      Animated.spring(emptySubAnim, { toValue: 1, delay: 350, friction: 6, tension: 40, useNativeDriver: true }).start();
      Animated.spring(emptyBtnAnim, { toValue: 1, delay: 500, friction: 6, tension: 40, useNativeDriver: true }).start();
      return () => loop.stop();
    }
  }, [bookmarks.length, loading]);

  // Header title animation
  useEffect(() => {
    Animated.spring(titleAnim, { toValue: 1, friction: 7, tension: 45, useNativeDriver: true }).start();
  }, []);

  const filteredBookmarks = bookmarks.filter(b =>
    b.topic.toLowerCase().includes(searchText.toLowerCase()) ||
    b.difficulty.toLowerCase().includes(searchText.toLowerCase()) ||
    b.content.toLowerCase().includes(searchText.toLowerCase())
  );

  // Count badge spring
  useEffect(() => {
    countScale.setValue(1.2);
    Animated.spring(countScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
  }, [filteredBookmarks.length]);

  const toggleSearch = () => {
    const toValue = showSearch ? 0 : 1;
    filterAnim.setValue(toValue === 0 ? 1 : 0);
    setShowSearch(!showSearch);
    if (!showSearch) {
      Animated.spring(filterAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
    }
  };

  const fetchBookmarks = async () => {
    setLoading(true);
    cardAnims.current = {};
    try {
      const data = await getBookmarks();
      setBookmarks(data || []);
    } catch (err) {
      Alert.alert('Error', 'Could not load bookmarks.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    cardAnims.current = {};
    try {
      const data = await getBookmarks();
      setBookmarks(data || []);
    } catch (err) {
      Alert.alert('Error', 'Could not refresh.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenActionMenu = (item) => {
    setSelectedItem(item);
    setShowActionMenu(true);
    actionSlide.setValue(0);
    Animated.spring(actionSlide, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
  };

  const closeActionMenu = () => {
    Animated.timing(actionSlide, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setShowActionMenu(false);
      setSelectedItem(null);
    });
  };

  const confirmDelete = (id) => {
    const doDelete = () => handleDelete(id);

    if (Platform.OS === 'web') {
      if (window.confirm('Remove this from bookmarks?')) {
        doDelete();
      }
    } else {
      Alert.alert('Remove Bookmark', 'Remove this from bookmarks?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleDelete = (id) => {
    const deleteFromDb = async () => {
      try {
        await deleteBookmark(id);
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      } catch {
        Alert.alert('Error', 'Could not remove bookmark.');
      }
    };

    if (cardAnims.current[id]) {
      Animated.timing(cardAnims.current[id], {
        toValue: 0, duration: 200, useNativeDriver: true,
      }).start(() => deleteFromDb());
    } else {
      deleteFromDb();
    }
  };

  const handleReopen = (item) => {
    closeActionMenu();
    router.push({
      pathname: '/explain',
      params: { topic: item.topic, difficulty: item.difficulty },
    });
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      eli5: '#FF6584',
      beginner: '#30D158',
      intermediate: '#FF9F0A',
      advanced: '#6C63FF',
      phd: '#BF5AF2',
    };
    return colors[difficulty] || COLORS.primary;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item, index }) => {
    if (!cardAnims.current[item.id]) {
      cardAnims.current[item.id] = new Animated.Value(0);
      requestAnimationFrame(() => {
        Animated.spring(cardAnims.current[item.id], {
          toValue: 1, delay: index * 50, friction: 8, tension: 60, useNativeDriver: true,
        }).start();
      });
    }
    const anim = cardAnims.current[item.id];
    const cardStyle = anim
      ? { opacity: anim, transform: [{ scale: anim }, { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }
      : {};
    const diffColor = getDifficultyColor(item.difficulty);

    return (
      <SwipeableCard onDelete={() => confirmDelete(item.id)}>
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={[styles.cardAccent, { backgroundColor: diffColor }]} />
          <TouchableOpacity
            style={styles.cardBody}
            onPress={() => handleReopen(item)}
            onLongPress={() => handleOpenActionMenu(item)}
            delayLongPress={400}
            activeOpacity={1}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="bookmark" size={16} color={diffColor} />
              <Text style={styles.topicText} numberOfLines={1}>{item.topic}</Text>
              <TouchableOpacity
                onPress={() => confirmDelete(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.cardDeleteBtn}
              >
                <Ionicons name="trash-outline" size={14} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.badge, { backgroundColor: diffColor + '25' }]}>
                <Text style={[styles.badgeText, { color: diffColor }]}>
                  {item.difficulty?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>

            <Text style={styles.contentPreview} numberOfLines={2}>
              {item.content}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SwipeableCard>
    );
  };

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
        <Animated.View
          style={{
            transform: [{ translateY: bobAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
          }}
        >
          <View style={styles.emptyIcon}>
            <Ionicons name="bookmark-outline" size={40} color={COLORS.primary} />
          </View>
        </Animated.View>
        <Animated.Text
          style={[
            styles.emptyTitle,
            { opacity: emptyTitleAnim, transform: [{ translateY: emptyTitleAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
          ]}
        >
          No bookmarks yet
        </Animated.Text>
        <Animated.Text
          style={[
            styles.emptySubtitle,
            { opacity: emptySubAnim, transform: [{ translateY: emptySubAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
          ]}
        >
          Bookmark explanations from the explain screen to save them here.
        </Animated.Text>
        <Animated.View
          style={{
            opacity: emptyBtnAnim,
            transform: [{ scale: emptyBtnAnim }],
          }}
        >
          <PressScale onPress={() => router.push('/')}>
            <View style={styles.startBtn}>
              <ShimmerOverlay />
              <Ionicons name="sparkles-outline" size={16} color={COLORS.text} />
              <Text style={styles.startBtnText}>Start Learning</Text>
            </View>
          </PressScale>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <FlatList
        data={filteredBookmarks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        refreshControl={
          <RefreshControl
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <Animated.View
              style={{
                opacity: titleAnim,
                transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              }}
            >
              <View style={styles.headerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flex: 1 }}>
                  <Ionicons name="bookmark" size={15} color={COLORS.textTertiary} />
                  <Text style={styles.headerText}>Bookmarks</Text>
                  <Animated.View style={{ transform: [{ scale: countScale }] }}>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{filteredBookmarks.length}</Text>
                    </View>
                  </Animated.View>
                </View>
                <TouchableOpacity onPress={toggleSearch} style={styles.filterToggle}>
                  <Ionicons
                    name={showSearch ? 'close-outline' : 'search-outline'}
                    size={18}
                    color={showSearch ? COLORS.primary : COLORS.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Search bar */}
            {showSearch && (
              <Animated.View
                style={[
                  styles.searchBar,
                  {
                    opacity: filterAnim,
                    transform: [{ translateY: filterAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
                  },
                ]}
              >
                <Ionicons name="search-outline" size={16} color={COLORS.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search bookmarks..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={COLORS.primary}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading && searchText.length > 0 ? (
            <View style={styles.emptySearch}>
              <Ionicons name="search-outline" size={32} color={COLORS.textTertiary} />
              <Text style={styles.emptySearchText}>No results for "{searchText}"</Text>
            </View>
          ) : null
        }
      />

      {/* Action Menu */}
      {showActionMenu && selectedItem && (
        <View style={styles.actionOverlay}>
          <TouchableOpacity style={styles.actionBackdrop} onPress={closeActionMenu} activeOpacity={1} />
          <Animated.View
            style={[
              styles.actionSheet,
              {
                transform: [{ translateY: actionSlide.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }],
              },
            ]}
          >
            <View style={styles.actionHandle} />
            <Text style={styles.actionTitle} numberOfLines={1}>{selectedItem.topic}</Text>
            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => handleReopen(selectedItem)}
            >
              <Ionicons name="school-outline" size={20} color={COLORS.text} />
              <Text style={styles.actionOptionText}>Learn Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => { closeActionMenu(); Alert.alert('Share', 'Share feature coming soon!'); }}
            >
              <Ionicons name="share-social-outline" size={20} color={COLORS.text} />
              <Text style={styles.actionOptionText}>Share</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => { closeActionMenu(); confirmDelete(selectedItem.id); }}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              <Text style={[styles.actionOptionText, { color: COLORS.error }]}>Remove</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl + SPACING.xl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.title3,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    marginLeft: SPACING.xs,
  },
  countBadgeText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.caption1,
    fontWeight: '700',
  },
  filterToggle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.lg,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.sizes.subhead,
    paddingVertical: SPACING.sm,
  },
  swipeContainer: { marginBottom: SPACING.md, position: 'relative' },
  swipeDeleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: COLORS.error,
    borderTopRightRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeDeleteBtn: { alignItems: 'center', justifyContent: 'center', gap: SPACING.xs },
  swipeDeleteText: { color: '#fff', fontSize: FONTS.sizes.caption1, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: RADIUS.xxl,
    borderBottomLeftRadius: RADIUS.xxl,
  },
  cardBody: { padding: SPACING.md, paddingLeft: SPACING.md + SPACING.sm },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  cardDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  topicText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.callout,
    fontWeight: '700',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  badge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
  },
  badgeText: { fontSize: FONTS.sizes.caption1, fontWeight: '700' },
  dateText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.caption1 },
  contentPreview: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.subhead,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.callout,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: FONTS.sizes.title3,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    color: COLORS.textTertiary,
    fontSize: FONTS.sizes.subhead,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    maxWidth: 360,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    overflow: 'hidden',
    position: 'relative',
  },
  startBtnText: { color: COLORS.text, fontWeight: '600', fontSize: FONTS.sizes.headline },
  emptySearch: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.md,
  },
  emptySearchText: {
    color: COLORS.textTertiary,
    fontSize: FONTS.sizes.subhead,
  },
  // Action Menu
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  actionBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  actionSheet: {
    backgroundColor: COLORS.surfaceElevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl + SPACING.lg,
  },
  actionHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: FONTS.sizes.title3,
    fontWeight: '700',
    marginBottom: SPACING.lg,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  actionOptionText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.callout,
    fontWeight: '500',
  },
  actionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
});
