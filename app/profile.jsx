import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getUserProfile, signOut } from '../lib/supabase';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (err) {
      Alert.alert('Error', 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const isGuest = profile?.user?.is_anonymous;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Avatar + User Info */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {isGuest ? '👤' : profile?.user?.email?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.displayName}>
          {isGuest ? 'Guest User' : profile?.user?.email}
        </Text>
        {isGuest && (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.upgradeBtnText}>⚡ Create Account to Save Progress</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Streak Card */}
      <View style={styles.streakCard}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakNumber}>
          {profile?.streak?.current_streak || 0}
        </Text>
        <Text style={styles.streakLabel}>Day Streak</Text>
        <Text style={styles.streakSub}>
          Longest: {profile?.streak?.longest_streak || 0} days
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {profile?.streak?.total_explanations || 0}
          </Text>
          <Text style={styles.statLabel}>Explanations</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {profile?.totalConversations || 0}
          </Text>
          <Text style={styles.statLabel}>Saved Chats</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {profile?.totalBookmarks || 0}
          </Text>
          <Text style={styles.statLabel}>Bookmarks</Text>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>

        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => router.push('/bookmarks')}
        >
          <Text style={styles.linkIcon}>🔖</Text>
          <Text style={styles.linkText}>My Bookmarks</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.linkIcon}>📚</Text>
          <Text style={styles.linkText}>Learning History</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>⏻ Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: { alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xl },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: { fontSize: 36, color: COLORS.text, fontWeight: 'bold' },
  displayName: {
    color: COLORS.text,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  upgradeBtn: {
    backgroundColor: COLORS.warning + '20',
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warning,
    marginTop: SPACING.sm,
  },
  upgradeBtnText: { color: COLORS.warning, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  streakCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B2B40',
    marginBottom: SPACING.md,
  },
  streakEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  streakNumber: {
    color: COLORS.text,
    fontSize: 56,
    fontWeight: 'bold',
    lineHeight: 64,
  },
  streakLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  streakSub: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  section: { marginBottom: SPACING.lg },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  linkIcon: { fontSize: 20, marginRight: SPACING.md },
  linkText: { flex: 1, color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '600' },
  linkArrow: { color: COLORS.textSecondary, fontSize: FONTS.sizes.lg },
  logoutBtn: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 14,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  logoutBtnText: { color: COLORS.secondary, fontSize: FONTS.sizes.md, fontWeight: '700' },
});