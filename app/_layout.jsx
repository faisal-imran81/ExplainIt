import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Animated, Platform, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { supabase, onAuthStateChange } from '../lib/supabase';

function LoadingScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </Animated.View>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [session, setSession] = useState(undefined);
  const initialNavDone = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!navigationState?.key) return;
    if (initialNavDone.current) return;
    initialNavDone.current = true;

    if (!session) {
      router.replace('/onboarding');
    } else {
      router.replace('/');
    }
  }, [session, navigationState?.key]);

  useEffect(() => {
    if (session === undefined) return;
    if (!navigationState?.key) return;
    if (!initialNavDone.current) return;

    const inAuthScreen = segments[0] === 'auth';

    if (!session && !inAuthScreen) {
      router.replace('/onboarding');
    } else if (session && inAuthScreen) {
      router.replace('/');
    }
  }, [session, segments, navigationState?.key]);

  if (session === undefined) {
    return <LoadingScreen />;
  }

  const stackContent = (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen
        name="explain"
        options={{ title: 'Elucid', headerBackTitle: 'Home', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="history"
        options={{ title: 'History', headerBackTitle: 'Home', animation: 'slide_from_right' }}
      />
      <Stack.Screen name="bookmarks" options={{ title: 'Bookmarks', headerBackTitle: 'Home', animation: 'slide_from_right' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile', animation: 'slide_from_right' }} />
    </Stack>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <StatusBar style="light" />
        {stackContent}
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {stackContent}
    </>
  );
}
