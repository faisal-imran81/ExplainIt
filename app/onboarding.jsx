import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { useResponsive } from '../utils/responsive';

const GLOW_COLORS = [COLORS.primary, COLORS.secondary, COLORS.tertiary];

const SLIDES = [
  {
    id: 1,
    icon: 'bulb-outline',
    title: 'Welcome to Elucid',
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

function useLoop(from, to, duration, useNativeDriver = true) {
  const anim = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: to, duration, useNativeDriver }),
        Animated.timing(anim, { toValue: from, duration, useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

export default function Onboarding() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { containerStyle } = useResponsive();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const dotWidths = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 24 : 8))).current;
  const dotOpacities = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.35))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const skipUnderline = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const pulseAnim = useLoop(1, 1.07, 1800);
  const glowAnim = useLoop(1, 1.12, 2400);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: -1, duration: 0, useNativeDriver: true }),
        Animated.delay(1800),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const triggerTitleAnim = useCallback(() => {
    titleAnim.setValue(0);
    Animated.spring(titleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
  }, [titleAnim]);

  const updateDots = (index) => {
    SLIDES.forEach((_, i) => {
      Animated.spring(dotWidths[i], {
        toValue: i === index ? 24 : 8,
        friction: 6,
        useNativeDriver: false,
      }).start();
      Animated.spring(dotOpacities[i], {
        toValue: i === index ? 1 : 0.35,
        friction: 6,
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
    triggerTitleAnim();
  }, [currentIndex, triggerTitleAnim]);

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

  const handleSkipPressIn = () => {
    Animated.spring(skipUnderline, { toValue: 1, friction: 6, tension: 100, useNativeDriver: false }).start();
  };
  const handleSkipPressOut = () => {
    Animated.spring(skipUnderline, { toValue: 0, friction: 6, tension: 100, useNativeDriver: false }).start();
  };

  return (
    <SafeAreaView style={[styles.container, containerStyle]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideUp }] }}>

        {/* Skip Button */}
        <View style={styles.header}>
          <Pressable
            onPress={handleFinish}
            onPressIn={handleSkipPressIn}
            onPressOut={handleSkipPressOut}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Skip</Text>
            <Animated.View
              style={[
                styles.skipUnderline,
                {
                  width: skipUnderline.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </Pressable>
        </View>

        {/* Slides */}
        <View style={styles.slidesWrapper} {...panResponder.panHandlers}>
          <Animated.View style={[styles.slidesRow, { width: width * SLIDES.length, transform: [{ translateX }] }]}>
            {SLIDES.map((slide, i) => {
              const inputRange = [-(i + 1) * width, -i * width, -(i - 1) * width];
              const slideOpacity = translateX.interpolate({
                inputRange,
                outputRange: [0.4, 1, 0.4],
                extrapolate: 'clamp',
              });
              const slideTranslateY = translateX.interpolate({
                inputRange,
                outputRange: [24, 0, 24],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={slide.id}
                  style={[
                    styles.slide,
                    { width, opacity: slideOpacity, transform: [{ translateY: slideTranslateY }] },
                  ]}
                >
                  {/* Background glow */}
                  <Animated.View
                    style={[
                      styles.glow,
                      {
                        backgroundColor: GLOW_COLORS[i],
                        transform: [{ scale: glowAnim }],
                      },
                    ]}
                  />

                  {/* Icon + pulsing ring */}
                  <View style={styles.iconOuter}>
                    <Animated.View
                      style={[
                        styles.pulseRing,
                        {
                          borderColor: GLOW_COLORS[i],
                          transform: [{ scale: pulseAnim }],
                        },
                      ]}
                    />
                    <View style={styles.iconContainer}>
                      <Ionicons name={slide.icon} size={52} color={COLORS.primary} />
                    </View>
                  </View>

                  {/* Title — staggered word reveal */}
                  <View style={styles.titleWrap}>
                    {slide.title.split(' ').map((word, wi) => {
                      const wordDelay = wi * 0.12;
                      const wordOpacity = titleAnim.interpolate({
                        inputRange: [0, wordDelay, wordDelay + 0.1, 1],
                        outputRange: [0, 0, 1, 1],
                      });
                      const wordTranslateY = titleAnim.interpolate({
                        inputRange: [0, wordDelay, wordDelay + 0.1, 1],
                        outputRange: [16, 16, 0, 0],
                      });
                      return (
                        <Animated.Text
                          key={wi}
                          style={[
                            styles.titleWord,
                            {
                              opacity: wordOpacity,
                              transform: [{ translateY: wordTranslateY }],
                            },
                          ]}
                        >
                          {word}
                        </Animated.Text>
                      );
                    })}
                  </View>

                  <Text style={styles.subtitle}>{slide.subtitle}</Text>
                </Animated.View>
              );
            })}
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
                  width: dotWidths[i],
                  opacity: dotOpacities[i],
                },
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started Button */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && styles.nextBtnPressed]}
            onPress={handleNext}
          >
            <View style={styles.nextBtnInner}>
              {/* Shimmer */}
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    transform: [
                      {
                        translateX: shimmerAnim.interpolate({
                          inputRange: [-1, 1],
                          outputRange: [-200, 400],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Text style={styles.nextText}>
                {currentIndex === SLIDES.length - 1 ? "Let's Go" : 'Next'}
              </Text>
              <Ionicons
                name={currentIndex === SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward'}
                size={18}
                color={COLORS.text}
              />
            </View>
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
      android: { paddingTop: StatusBar.currentHeight || 0 },
    }),
  },
  header: { alignItems: 'flex-end', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  skipBtn: { padding: SPACING.sm, alignItems: 'center' },
  skipText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.subhead },
  skipUnderline: {
    height: 1.5,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 1,
    marginTop: 2,
  },
  slidesWrapper: { flex: 1, overflow: 'hidden' },
  slidesRow: { flexDirection: 'row' },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.12,
    top: '22%',
  },
  iconOuter: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    opacity: 0.3,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  titleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  titleWord: {
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
    paddingHorizontal: SPACING.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  dot: {
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  footer: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },
  nextBtn: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  nextBtnPressed: {
    opacity: 0.9,
  },
  nextBtnInner: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ skewX: '-20deg' }],
  },
  nextText: { color: COLORS.text, fontSize: FONTS.sizes.callout, fontWeight: '700' },
});
