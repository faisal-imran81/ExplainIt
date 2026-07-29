import { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getUserProfile, signOut } from '../lib/supabase';
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

function AnimatedNumber({ value, duration = 800, delay = 0, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
    anim.setValue(0);
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, { toValue: value, duration, delay, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [value]);

  return <Text style={style}>{display}</Text>;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { containerStyle } = useResponsive();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Entrance animations ──
  const avatarDrop = useRef(new Animated.Value(0)).current;
  const nameAnim = useRef(new Animated.Value(0)).current;
  const stat1Anim = useRef(new Animated.Value(0)).current;
  const stat2Anim = useRef(new Animated.Value(0)).current;
  const stat3Anim = useRef(new Animated.Value(0)).current;
  const streakWrapAnim = useRef(new Animated.Value(0)).current;
  const menu1Anim = useRef(new Animated.Value(0)).current;
  const menu2Anim = useRef(new Animated.Value(0)).current;
  const logoutAnim = useRef(new Animated.Value(0)).current;
  const pageFade = useRef(new Animated.Value(0)).current;

  // ── Loop animations ──
  const avatarGlow = useRef(new Animated.Value(0.3)).current;
  const avatarRing = useRef(new Animated.Value(0)).current;
  const flameFlicker = useRef(new Animated.Value(1)).current;
  const dotPulse = useRef(new Animated.Value(1)).current;

  // ── Shake ──
  const logoutShake = useRef(new Animated.Value(0)).current;

  // ── Streak dot anims ──
  const dotAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  // ── Menu chevron anims ──
  const chevronAnims = useRef([new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    fetchProfile();
    runEntrance();
    runLoops();
  }, []);

  const runEntrance = () => {
    Animated.spring(avatarDrop, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }).start();
    Animated.spring(nameAnim, { toValue: 1, delay: 200, friction: 7, tension: 45, useNativeDriver: true }).start();
    Animated.stagger(120, [
      Animated.spring(stat1Anim, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
      Animated.spring(stat2Anim, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
      Animated.spring(stat3Anim, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
    ]).start();
    Animated.spring(streakWrapAnim, { toValue: 1, delay: 500, friction: 8, tension: 50, useNativeDriver: true }).start();
    Animated.stagger(100, [
      Animated.spring(menu1Anim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
      Animated.spring(menu2Anim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
    Animated.spring(logoutAnim, { toValue: 1, delay: 350, friction: 8, tension: 50, useNativeDriver: true }).start();
    Animated.timing(pageFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  const runLoops = () => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarGlow, { toValue: 0.6, duration: 1800, useNativeDriver: true }),
        Animated.timing(avatarGlow, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
      ]),
    );
    glowLoop.start();

    const ringLoop = Animated.loop(
      Animated.timing(avatarRing, { toValue: 1, duration: 5000, useNativeDriver: true }),
    );
    ringLoop.start();

    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFlicker, { toValue: 0.85, duration: 100, useNativeDriver: true }),
        Animated.timing(flameFlicker, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(flameFlicker, { toValue: 0.8, duration: 80, useNativeDriver: true }),
        Animated.timing(flameFlicker, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(flameFlicker, { toValue: 0.9, duration: 60, useNativeDriver: true }),
        Animated.timing(flameFlicker, { toValue: 1, duration: 140, useNativeDriver: true }),
      ]),
    );
    flameLoop.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.spring(dotPulse, { toValue: 1.15, friction: 3, tension: 100, useNativeDriver: true }),
        Animated.spring(dotPulse, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();

    // Streak dot sequential entrance
    dotAnims.forEach((d, i) => {
      Animated.spring(d, { toValue: 1, delay: 600 + i * 60, friction: 7, tension: 50, useNativeDriver: true }).start();
    });

    return () => { glowLoop.stop(); ringLoop.stop(); flameLoop.stop(); pulseLoop.stop(); };
  };

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

  const triggerShake = () => {
    logoutShake.setValue(0);
    Animated.sequence([
      Animated.timing(logoutShake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(logoutShake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(logoutShake, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(logoutShake, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(logoutShake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogout = () => {
    triggerShake();
    const doLogout = async () => {
      if (Platform.OS !== 'web') {
        Animated.timing(pageFade, { toValue: 0, duration: 250, useNativeDriver: true }).start();
        await new Promise((r) => setTimeout(r, 300));
      }
      try {
        await signOut();
      } catch {}
      router.replace('/auth');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        doLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const isGuest = profile?.user?.is_anonymous;
  const streak = profile?.streak?.current_streak || 0;
  const activeDots = Math.min(streak, 7);

  const getMotivationalMessage = (s) => {
    if (s === 0) return 'Start your learning streak today!';
    if (s < 3) return 'Great start! Keep it going!';
    if (s < 7) return `${7 - s} more day${7 - s === 1 ? '' : 's'} to a full week!`;
    if (s < 14) return 'A full week! You\u2019re unstoppable!';
    if (s < 21) return 'Two weeks strong! Incredible dedication!';
    if (s < 30) return 'Almost a month of learning! Legendary!';
    if (s < 100) return `${30 - (s % 30)} days to your next milestone!`;
    return '100+ day streak! You\u2019re a learning machine!';
  };

  const ringRotate = avatarRing.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, containerStyle, { opacity: pageFade }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Avatar + User Info ── */}
        <Animated.View
          style={[
            styles.avatarSection,
            {
              opacity: avatarDrop,
              transform: [{ translateY: avatarDrop.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
            },
          ]}
        >
          <View style={styles.avatarWrapper}>
            {/* Glow */}
            <Animated.View style={[styles.avatarGlow, { opacity: avatarGlow }]} />
            {/* Rotating ring */}
            <Animated.View style={[styles.avatarRing, { transform: [{ rotate: ringRotate }] }]} />
            {/* Avatar */}
            <View style={styles.avatar}>
              {isGuest ? (
                <Ionicons name="person-outline" size={36} color={COLORS.text} />
              ) : (
                <Text style={styles.avatarText}>
                  {profile?.user?.email?.[0]?.toUpperCase() || '?'}
                </Text>
              )}
            </View>
          </View>

          <Animated.View
            style={{
              opacity: nameAnim,
              transform: [{ translateY: nameAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
            <Text style={styles.displayName}>
              {isGuest ? 'Guest User' : profile?.user?.email}
            </Text>
            {isGuest && (
              <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/auth')}>
                <Ionicons name="flash-outline" size={16} color={COLORS.warning} />
                <Text style={styles.upgradeBtnText}>Create Account to Save Progress</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          {[
            { anim: stat1Anim, value: profile?.streak?.total_explanations || 0, label: 'Explanations' },
            { anim: stat2Anim, value: profile?.totalConversations || 0, label: 'Saved Chats' },
            { anim: stat3Anim, value: profile?.totalBookmarks || 0, label: 'Bookmarks' },
          ].map((stat, i) => (
            <Animated.View
              key={i}
              style={[
                styles.statCard,
                {
                  opacity: stat.anim,
                  transform: [{
                    translateY: stat.anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
                  }],
                },
              ]}
            >
              <AnimatedNumber value={stat.value} delay={300 + i * 150} style={styles.statNumber} />
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* ── Streak Section ── */}
        <Animated.View
          style={[
            styles.streakCard,
            {
              opacity: streakWrapAnim,
              transform: [{
                translateY: streakWrapAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
              }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: flameFlicker }] }}>
            <Ionicons name="flame" size={36} color="#FF6B2B" />
          </Animated.View>
          <AnimatedNumber value={streak} delay={500} style={styles.streakNumber} />
          <Text style={styles.streakLabel}>Day Streak</Text>

          {/* Weekly grid */}
          <View style={styles.streakGrid}>
            {Array.from({ length: 7 }, (_, i) => {
              const isActive = i < activeDots;
              const dayIdx = (new Date().getDay() - i + 7) % 7;
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.streakDotWrap,
                    { opacity: dotAnims[i], transform: [{ scale: dotAnims[i] }] },
                  ]}
                >
                  <View style={[styles.streakDot, isActive && styles.streakDotActive]}>
                    {isActive && (
                      <Animated.View
                        style={[
                          styles.streakDotPulse,
                          { transform: [{ scale: dotPulse }] },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={styles.streakDayLabel}>{dayNames[dayIdx]}</Text>
                </Animated.View>
              );
            })}
          </View>

          <Text style={styles.streakLongest}>
            Longest: {profile?.streak?.longest_streak || 0} days
          </Text>
          <Text style={styles.streakMessage}>{getMotivationalMessage(streak)}</Text>
        </Animated.View>

        {/* ── Quick Links ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>

          {[
            { anim: menu1Anim, icon: 'bookmark-outline', label: 'My Bookmarks', route: '/bookmarks' },
            { anim: menu2Anim, icon: 'time-outline', label: 'Learning History', route: '/history' },
          ].map((item, i) => (
            <Animated.View
              key={i}
              style={{
                opacity: item.anim,
                transform: [{
                  translateY: item.anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                }],
              }}
            >
              <TouchableHighlight
                underlayColor={COLORS.primary + '10'}
                style={styles.linkCard}
                onPress={() => router.push(item.route)}
                onPressIn={() => {
                  Animated.spring(chevronAnims[i], { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();
                }}
                onPressOut={() => {
                  Animated.spring(chevronAnims[i], { toValue: 0, friction: 6, tension: 100, useNativeDriver: true }).start();
                }}
              >
                <View style={styles.linkRow}>
                  <View style={styles.linkIconWrap}>
                    <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.linkText}>{item.label}</Text>
                  <Animated.View
                    style={{
                      transform: [{
                        translateX: chevronAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                      }],
                    }}
                  >
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
                  </Animated.View>
                </View>
              </TouchableHighlight>
            </Animated.View>
          ))}
        </View>

        {/* ── Logout ── */}
        <Animated.View
          style={{
            opacity: logoutAnim,
            transform: [{
              translateY: logoutAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
            }],
          }}
        >
          <PressScale onPress={handleLogout}>
            <Animated.View style={[styles.logoutBtn, { transform: [{ translateX: logoutShake }] }]}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
              <Text style={styles.logoutBtnText}>Logout</Text>
            </Animated.View>
          </PressScale>
        </Animated.View>

      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl + SPACING.xl },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Avatar
  avatarSection: { alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xl },
  avatarWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
  },
  avatarRing: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 3,
    borderColor: COLORS.borderLight,
    borderTopColor: COLORS.primary,
    borderRightColor: COLORS.primary,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarText: { fontSize: 36, color: COLORS.text, fontWeight: '700' },
  displayName: {
    color: COLORS.text,
    fontSize: FONTS.sizes.callout,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '20',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warning,
    marginTop: SPACING.sm,
  },
  upgradeBtnText: { color: COLORS.warning, fontSize: FONTS.sizes.subhead, fontWeight: '600' },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.title2,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.footnote,
    marginTop: SPACING.xxs,
    textAlign: 'center',
  },
  // Streak
  streakCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B2B40',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  streakNumber: {
    color: COLORS.text,
    fontSize: FONTS.sizes.largeTitle,
    fontWeight: '700',
    lineHeight: 42,
  },
  streakLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.callout,
    fontWeight: '600',
  },
  streakGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  streakDotWrap: { alignItems: 'center', gap: SPACING.xs },
  streakDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDotActive: {
    backgroundColor: COLORS.primary + '25',
    borderColor: COLORS.primary,
  },
  streakDotPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  streakDayLabel: {
    color: COLORS.textTertiary,
    fontSize: FONTS.sizes.caption2,
    fontWeight: '600',
  },
  streakLongest: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.subhead,
    marginTop: SPACING.xs,
  },
  streakMessage: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.subhead,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  // Section
  section: { marginBottom: SPACING.lg },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  linkCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  linkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: { flex: 1, color: COLORS.text, fontSize: FONTS.sizes.callout, fontWeight: '600' },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.card,
  },
  logoutBtnText: { color: COLORS.error, fontSize: FONTS.sizes.callout, fontWeight: '600' },
});
