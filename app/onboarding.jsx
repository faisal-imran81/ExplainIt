import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    icon: 'bulb-outline',
    title: 'Welcome to ExplainIt',
    subtitle: 'Your personal AI tutor that explains any concept — simply, clearly, and at your level.',
  },
  {
    id: 2,
    icon: 'chatbubbles-outline',
    title: 'Ask Anything',
    subtitle: 'Quantum physics? History? Math? Just type your topic and get an instant explanation tailored to you.',
  },
  {
    id: 3,
    icon: 'trending-up-outline',
    title: 'Track Your Progress',
    subtitle: 'Build streaks, bookmark favorites, and watch your curiosity grow every single day.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const dotScales = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1.4 : 1))).current;
  const dotOpacities = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.4))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const updateDots = (index) => {
    SLIDES.forEach((_, i) => {
      Animated.spring(dotScales[i], {
        toValue: i === index ? 1.4 : 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
      Animated.timing(dotOpacities[i], {
        toValue: i === index ? 1 : 0.4,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const goToSlide = (index) => {
    if (index < 0 || index >= SLIDES.length) return;
    Animated.spring(translateX, {
      toValue: -index * width,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
    setCurrentIndex(index);
    updateDots(index);
  };

  const currentIndexRef = useRef(0);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) goToSlide(Math.min(currentIndexRef.current + 1, SLIDES.length - 1));
        else if (g.dx > 50) goToSlide(Math.max(currentIndexRef.current - 1, 0));
      },
    })
  ).current;

  const handleFinish = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    router.replace('/auth');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideUp }] }}>

        {/* Skip Button */}
        <View style={styles.header}>
          <Pressable onPress={handleFinish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Slides */}
        <View style={styles.slidesWrapper} {...panResponder.panHandlers}>
          <Animated.View style={[styles.slidesRow, { transform: [{ translateX }] }]}>
            {SLIDES.map((slide) => (
              <View key={slide.id} style={styles.slide}>
                <View style={styles.iconContainer}>
                  <Ionicons name={slide.icon} size={52} color={COLORS.primary} />
                </View>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  transform: [{ scale: dotScales[i] }],
                  opacity: dotOpacities[i],
                },
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started Button */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
            onPress={handleNext}
          >
            <Text style={styles.nextText}>
              {currentIndex === SLIDES.length - 1 ? "Let's Go" : 'Next'}
            </Text>
            <Ionicons
              name={currentIndex === SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward'}
              size={18}
              color={COLORS.text}
            />
          </Pressable>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    ...Platform.select({
      web: { maxWidth: 480, alignSelf: 'center', width: '100%' },
      android: { paddingTop: StatusBar.currentHeight || 0 },
    }),
  },
  header: { alignItems: 'flex-end', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  skipBtn: { padding: SPACING.sm },
  skipText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.subhead },
  slidesWrapper: { flex: 1, overflow: 'hidden' },
  slidesRow: { flexDirection: 'row', width: width * SLIDES.length },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: FONTS.sizes.title1,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  footer: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },
  nextBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  nextText: { color: COLORS.text, fontSize: FONTS.sizes.callout, fontWeight: '700' },
});
