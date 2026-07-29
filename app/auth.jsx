import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { signIn, signUp, signInAnonymously } from '../lib/supabase';
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

function LoadingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ]),
      );
    const l1 = anim(dot1, 0);
    const l2 = anim(dot2, 200);
    const l3 = anim(dot3, 400);
    l1.start();
    l2.start();
    l3.start();
    return () => { l1.stop(); l2.stop(); l3.stop(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: COLORS.text,
            opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
            transform: [{ scale: d.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
          }}
        />
      ))}
    </View>
  );
}

const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  x: 20 + Math.random() * 460,
  size: 2.5 + Math.random() * 3.5,
  duration: 7000 + Math.random() * 5000,
  delay: i * 1200,
  startY: 100 + Math.random() * 200,
}));

function Particle({ particle }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(particle.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: particle.duration,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          left: particle.x,
          opacity: anim.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 0.08, 0.08, 0],
          }),
          transform: [{
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [particle.startY, -60],
            }),
          }],
        },
      ]}
    />
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const { containerStyle } = useResponsive();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState('idle');
  const [focusedField, setFocusedField] = useState(null);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const [segmentLayout, setSegmentLayout] = useState({ width: 0 });
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const emailLabelAnim = useRef(new Animated.Value(0)).current;
  const passLabelAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // Entrance animations
  const entranceLogo = useRef(new Animated.Value(0)).current;
  const entranceToggle = useRef(new Animated.Value(0)).current;
  const entranceForm = useRef(new Animated.Value(0)).current;
  const entranceBtn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(entranceLogo, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.spring(entranceToggle, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.spring(entranceForm, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.spring(entranceBtn, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  // Hero pulse
  const heroPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulse, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(heroPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    Animated.spring(tabAnim, {
      toValue: newMode === 'login' ? 0 : 1,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
    setMode(newMode);
  };

  const onSegmentLayout = useCallback((e) => {
    setSegmentLayout({ width: e.nativeEvent.layout.width });
  }, []);

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      triggerShake();
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    if (password.length < 6) {
      triggerShake();
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setAuthStatus('loading');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
        Alert.alert('Success!', 'Account created! You can now log in.');
        setMode('login');
        setAuthStatus('idle');
        setLoading(false);
        return;
      }
      successAnim.setValue(0);
      Animated.spring(successAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();
      setTimeout(() => router.replace('/'), 600);
    } catch (err) {
      setAuthStatus('error');
      triggerShake();
      setTimeout(() => setAuthStatus('idle'), 1200);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously();
      router.replace('/');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not continue as guest');
    } finally {
      setLoading(false);
    }
  };

  const emailFocused = focusedField === 'email';
  const passFocused = focusedField === 'password';

  return (
    <KeyboardAvoidingView
      style={[styles.container, containerStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 24}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Floating particles */}
        <View style={styles.particleLayer} pointerEvents="none">
          {PARTICLES.map((p) => (
            <Particle key={p.id} particle={p} />
          ))}
        </View>

        {/* Hero Section */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: entranceLogo,
              transform: [{ translateY: entranceLogo.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
            },
          ]}
        >
          <Animated.View style={[styles.heroIconWrap, { transform: [{ scale: heroPulse }] }]}>
            <View style={styles.heroGlow} />
            <Ionicons name="bulb-outline" size={40} color={COLORS.primary} />
          </Animated.View>
          <View style={styles.titleWrap}>
            <Text style={styles.titleGlow}>Elucid</Text>
            <Text style={styles.title}>Elucid</Text>
          </View>
          <Text style={styles.subtitle}>Understand anything, at any level</Text>
        </Animated.View>

        {/* Segmented Control */}
        <Animated.View
          style={{
            opacity: entranceToggle,
            transform: [{ translateY: entranceToggle.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }}
        >
          <View style={styles.segmentRow} onLayout={onSegmentLayout}>
            <TouchableOpacity
              style={styles.segment}
              onPress={() => switchMode('login')}
              activeOpacity={1}
            >
              <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.segment}
              onPress={() => switchMode('signup')}
              activeOpacity={1}
            >
              <Text style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
            <Animated.View
              style={[
                styles.segmentIndicator,
                {
                  transform: [{
                    translateX: tabAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, segmentLayout.width / 2],
                    }),
                  }],
                },
              ]}
            />
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[
            styles.form,
            {
              opacity: entranceForm,
              transform: [{ translateY: entranceForm.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <View style={styles.fieldGroup}>
            <Animated.Text
              style={[
                styles.label,
                emailFocused && {
                  color: COLORS.primary,
                  transform: [{ scale: emailLabelAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
                },
              ]}
            >
              Email
            </Animated.Text>
            <Animated.View
              style={[
                styles.inputWrapper,
                emailFocused && {
                  borderColor: COLORS.primary,
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                },
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <Ionicons name="mail-outline" size={18} color={emailFocused ? COLORS.primary : COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={COLORS.primary}
                onFocus={() => {
                  setFocusedField('email');
                  Animated.spring(emailLabelAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();
                }}
                onBlur={() => {
                  setFocusedField(null);
                  Animated.spring(emailLabelAnim, { toValue: 0, friction: 6, tension: 100, useNativeDriver: true }).start();
                }}
              />
            </Animated.View>
          </View>

          <View style={styles.fieldGroup}>
            <Animated.Text
              style={[
                styles.label,
                passFocused && { color: COLORS.primary },
              ]}
            >
              Password
            </Animated.Text>
            <Animated.View
              style={[
                styles.inputWrapper,
                passFocused && {
                  borderColor: COLORS.primary,
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                },
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color={passFocused ? COLORS.primary : COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                placeholderTextColor={COLORS.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                selectionColor={COLORS.primary}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
            </Animated.View>
          </View>

          <Animated.View
            style={{
              transform: [{ translateX: shakeAnim }],
              opacity: entranceBtn,
              transform: [{ translateY: entranceBtn.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
            <PressScale onPress={handleAuth}>
              <Animated.View
                style={[
                  styles.primaryBtn,
                  loading && styles.disabledBtn,
                  authStatus === 'error' && { backgroundColor: COLORS.error },
                ]}
              >
                {authStatus === 'loading' ? (
                  <LoadingDots />
                ) : authStatus === 'success' ? (
                  <Animated.View style={{ transform: [{ scale: successAnim }] }}>
                    <Ionicons name="checkmark-circle" size={26} color={COLORS.text} />
                  </Animated.View>
                ) : (
                  <View style={styles.btnIconRow}>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.text} />
                    <Text style={styles.primaryBtnText}>
                      {mode === 'login' ? 'Login' : 'Create Account'}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </PressScale>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest Button */}
          <PressScale onPress={handleGuest}>
            <View style={[styles.guestBtn, loading && styles.disabledBtn]}>
              <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </View>
          </PressScale>
        </Animated.View>

        <Text style={styles.footer}>
          Guest sessions are temporary. Sign up to save your learning history!
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 2,
    justifyContent: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingTop: Platform.select({
      ios: SPACING.lg,
      android: StatusBar.currentHeight ? StatusBar.currentHeight + SPACING.md : SPACING.xl,
      default: SPACING.lg,
    }),
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  titleGlow: {
    position: 'absolute',
    fontSize: FONTS.sizes.largeTitle,
    fontWeight: '700',
    color: COLORS.primary,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    opacity: 0.5,
  },
  title: {
    fontSize: FONTS.sizes.largeTitle,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.subhead,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.lg,
    padding: 4,
    position: 'relative',
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    zIndex: 2,
  },
  segmentText: { color: COLORS.textTertiary, fontWeight: '600', fontSize: FONTS.sizes.subhead },
  segmentTextActive: { color: COLORS.text },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    width: '50%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  form: { gap: SPACING.md },
  fieldGroup: { gap: SPACING.sm },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.sizes.body,
    paddingVertical: SPACING.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    minHeight: 54,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginTop: SPACING.sm,
  },
  disabledBtn: { opacity: 0.7 },
  primaryBtnText: { color: COLORS.text, fontSize: FONTS.sizes.headline, fontWeight: '600' },
  btnIconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textTertiary, fontSize: FONTS.sizes.subhead },
  guestBtn: {
    flexDirection: 'row',
    minHeight: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.card,
    gap: SPACING.sm,
  },
  guestBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.callout, fontWeight: '500' },
  footer: {
    color: COLORS.textTertiary,
    fontSize: FONTS.sizes.footnote,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 20,
  },
});
