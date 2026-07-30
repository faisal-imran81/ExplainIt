import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import ShareCard from '../components/ShareCard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { explainConcept, generateQuiz } from '../lib/groq';
import {
  saveConversation,
  updateConversation,
  getConversationById,
  signOut,
  addBookmark,
  updateStreak,
} from '../lib/supabase';
import { COLORS, SPACING, FONTS, RADIUS } from '../constants/theme';
import { useResponsive } from '../utils/responsive';

function PressScale({ children, onPress, disabled, style, ...props }) {
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
        disabled={disabled}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animDot = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ]),
      );
    const l1 = animDot(dot1, 0);
    const l2 = animDot(dot2, 160);
    const l3 = animDot(dot3, 320);
    l1.start();
    l2.start();
    l3.start();

    const spin = Animated.loop(
      Animated.timing(sparkleRotate, { toValue: 1, duration: 3000, useNativeDriver: true }),
    );
    spin.start();

    return () => { l1.stop(); l2.stop(); l3.stop(); spin.stop(); };
  }, []);

  const rotate = sparkleRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.aiLabelRow}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="sparkles-outline" size={12} color={COLORS.primary} />
          </Animated.View>
          <Text style={styles.aiLabel}>Elucid</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: SPACING.xs }}>
          {[dot1, dot2, dot3].map((d, i) => (
            <Animated.View
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: COLORS.textTertiary,
                opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.9] }),
                transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function renderInlineMarkdown(text, baseStyle) {
  if (!text) return null;

  const parts = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    const matches = [
      boldMatch && { match: boldMatch, type: 'bold' },
      italicMatch && { match: italicMatch, type: 'italic' },
      codeMatch && { match: codeMatch, type: 'code' },
    ].filter(Boolean);

    if (matches.length === 0) {
      parts.push(<Text key={keyIdx++} style={baseStyle}>{remaining}</Text>);
      break;
    }

    const earliest = matches.reduce((a, b) =>
      a.match.index <= b.match.index ? a : b
    );

    const { match, type } = earliest;

    if (match.index > 0) {
      parts.push(
        <Text key={keyIdx++} style={baseStyle}>
          {remaining.substring(0, match.index)}
        </Text>
      );
    }

    if (type === 'bold') {
      parts.push(
        <Text key={keyIdx++} style={[baseStyle, { fontWeight: '700', color: COLORS.text }]}>
          {match[1]}
        </Text>
      );
    } else if (type === 'italic') {
      parts.push(
        <Text key={keyIdx++} style={[baseStyle, { fontStyle: 'italic' }]}>
          {match[1]}
        </Text>
      );
    } else if (type === 'code') {
      parts.push(
        <Text key={keyIdx++} style={[baseStyle, {
          fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
          fontSize: 13,
          backgroundColor: COLORS.surface,
          color: COLORS.primary,
          paddingHorizontal: 4,
          borderRadius: 3,
        }]}>
          {match[1]}
        </Text>
      );
    }

    remaining = remaining.substring(match.index + match[0].length);
  }

  return parts;
}

function renderMarkdown(text, baseStyle) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let keyCounter = 0;

  lines.forEach((line) => {
    const key = keyCounter++;

    if (line.trim() === '') {
      elements.push(<View key={key} style={{ height: 6 }} />);
      return;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <Text key={key} style={[baseStyle, {
          fontSize: 20, fontWeight: '700',
          color: COLORS.text, marginBottom: 6, marginTop: 8,
        }]}>
          {line.replace(/^# /, '')}
        </Text>
      );
      return;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <Text key={key} style={[baseStyle, {
          fontSize: 17, fontWeight: '700',
          color: COLORS.text, marginBottom: 4, marginTop: 6,
        }]}>
          {line.replace(/^## /, '')}
        </Text>
      );
      return;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <Text key={key} style={[baseStyle, {
          fontSize: 15, fontWeight: '700',
          color: COLORS.text, marginBottom: 3, marginTop: 4,
        }]}>
          {line.replace(/^### /, '')}
        </Text>
      );
      return;
    }

    if (line.match(/^[\-\*] /)) {
      const content = line.replace(/^[\-\*] /, '');
      elements.push(
        <View key={key} style={{ flexDirection: 'row', marginBottom: 3, paddingLeft: 4 }}>
          <Text style={[baseStyle, { color: COLORS.primary, marginRight: 8, marginTop: 1 }]}>•</Text>
          <Text style={[baseStyle, { flex: 1 }]}>
            {renderInlineMarkdown(content, baseStyle)}
          </Text>
        </View>
      );
      return;
    }

    if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\./)[1];
      const content = line.replace(/^\d+\. /, '');
      elements.push(
        <View key={key} style={{ flexDirection: 'row', marginBottom: 3, paddingLeft: 4 }}>
          <Text style={[baseStyle, { color: COLORS.primary, marginRight: 8, minWidth: 20 }]}>{num}.</Text>
          <Text style={[baseStyle, { flex: 1 }]}>
            {renderInlineMarkdown(content, baseStyle)}
          </Text>
        </View>
      );
      return;
    }

    if (line.startsWith('```') || line.startsWith('    ')) {
      const codeText = line.startsWith('```')
        ? line.replace(/```\w*/, '').trim()
        : line.replace(/^    /, '');
      if (codeText) {
        elements.push(
          <View key={key} style={{
            backgroundColor: COLORS.surface,
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            marginVertical: 2,
            borderLeftWidth: 3,
            borderLeftColor: COLORS.primary,
          }}>
            <Text style={[baseStyle, {
              fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
              fontSize: 13,
              color: COLORS.primary,
            }]}>
              {codeText}
            </Text>
          </View>
        );
      }
      return;
    }

    elements.push(
      <Text key={key} style={[baseStyle, { marginBottom: 2, lineHeight: 24 }]}>
        {renderInlineMarkdown(line, baseStyle)}
      </Text>
    );
  });

  return elements;
}

export default function ExplainScreen() {
  const { id, topic, difficulty } = useLocalSearchParams();
  const router = useRouter();
  const { containerStyle, bubbleMaxWidth } = useResponsive();
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [followUp, setFollowUp] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [sharing, setSharing] = useState(false);
  const savedIdRef = useRef(null);
  const shareCardRef = useRef(null);

  // ── Entrance animations ──
  const headerSlide = useRef(new Animated.Value(0)).current;
  const chatFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(headerSlide, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(chatFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Header elements stagger ──
  const titleAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const actionAnim1 = useRef(new Animated.Value(0)).current;
  const actionAnim2 = useRef(new Animated.Value(0)).current;
  const actionAnim3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(titleAnim, { toValue: 1, friction: 7, tension: 45, useNativeDriver: true }).start();
    Animated.stagger(80, [
      Animated.spring(badgeAnim, { toValue: 1, friction: 7, tension: 45, useNativeDriver: true }),
      Animated.spring(actionAnim1, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.spring(actionAnim2, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.spring(actionAnim3, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Badge glow pulse ──
  const badgeGlow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeGlow, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(badgeGlow, { toValue: 0, duration: 1800, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Active state spring pop ──
  const savePop = useRef(new Animated.Value(0)).current;
  const bookmarkPop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (saved) {
      savePop.setValue(0.8);
      Animated.spring(savePop, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
    }
  }, [saved]);
  useEffect(() => {
    if (bookmarked) {
      bookmarkPop.setValue(0.8);
      Animated.spring(bookmarkPop, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
    }
  }, [bookmarked]);

  // ── AI label rotating sparkle ──
  const labelSparkle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(labelSparkle, { toValue: 1, duration: 4000, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const labelSparkleRotate = labelSparkle.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ── Message entrance animations ──
  const msgAnims = useRef({});
  // Ensure all existing messages have animation values (for restored conversations)
  useEffect(() => {
    messages.forEach((_, idx) => {
      if (!msgAnims.current[idx]) {
        const opacity = new Animated.Value(0);
        const slide = new Animated.Value(20);
        msgAnims.current[idx] = { opacity, slide };
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(slide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        ]).start();
      }
    });
  }, [messages.length]);

  // ── Follow-up input glow ──
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const [inputFocused, setInputFocused] = useState(false);

  // ── Send button pulse ──
  const sendPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (followUp.trim().length > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(sendPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(sendPulse, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => { loop.stop(); sendPulse.setValue(0); };
    } else {
      sendPulse.setValue(0);
    }
  }, [followUp.trim().length > 0]);

  // ── Quiz card staggered entrance ──
  const quizCardAnims = useRef({});
  useEffect(() => {
    if (quiz && quizMode) {
      quiz.forEach((_, qi) => {
        if (!quizCardAnims.current[qi]) {
          quizCardAnims.current[qi] = new Animated.Value(0);
        }
        Animated.spring(quizCardAnims.current[qi], {
          toValue: 1,
          delay: qi * 80,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [quiz, quizMode]);

  // ── Quiz option correct/wrong animations ──
  const quizCorrectAnims = useRef({});
  const quizWrongAnims = useRef({});
  useEffect(() => {
    if (quizSubmitted && quiz) {
      quiz.forEach((q, qi) => {
        if (!quizCorrectAnims.current[qi]) {
          quizCorrectAnims.current[qi] = new Animated.Value(0);
        }
        Animated.spring(quizCorrectAnims.current[qi], {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }).start();

        if (selectedAnswers[qi] !== q.correct) {
          if (!quizWrongAnims.current[qi]) {
            quizWrongAnims.current[qi] = new Animated.Value(0);
          }
          quizWrongAnims.current[qi].setValue(0);
          Animated.sequence([
            Animated.timing(quizWrongAnims.current[qi], { toValue: 1, duration: 50, useNativeDriver: true }),
            Animated.timing(quizWrongAnims.current[qi], { toValue: -1, duration: 50, useNativeDriver: true }),
            Animated.timing(quizWrongAnims.current[qi], { toValue: 0.5, duration: 50, useNativeDriver: true }),
            Animated.timing(quizWrongAnims.current[qi], { toValue: -0.5, duration: 50, useNativeDriver: true }),
            Animated.timing(quizWrongAnims.current[qi], { toValue: 0, duration: 50, useNativeDriver: true }),
          ]).start();
        }
      });
    }
  }, [quizSubmitted]);

  // ── Score card entrance ──
  const scoreAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (quizSubmitted) {
      Animated.spring(scoreAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
    }
  }, [quizSubmitted]);

  // ── Original logic ──

  useEffect(() => {
    if (id) {
      loadExistingConversation();
    } else {
      handleExplain();
    }
  }, []);

  const loadExistingConversation = async () => {
    try {
      setLoading(true);
      const conversation = await getConversationById(id);
      if (conversation) {
        setMessages(conversation.messages || []);
        savedIdRef.current = conversation.id;
        setSaved(true);
      }
    } catch (err) {
      console.log('Failed to load conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (customFollowUp = null) => {
    setLoading(true);
    try {
      const userMsg = customFollowUp || `Explain: ${topic}`;
      const newMessages = [...messages, { role: 'user', content: userMsg }];
      setMessages(newMessages);

      const response = await explainConcept(topic, difficulty, customFollowUp);
      const updatedMessages = [...newMessages, { role: 'assistant', content: response }];
      setMessages(updatedMessages);

      try {
        if (savedIdRef.current) {
          await updateConversation(savedIdRef.current, updatedMessages);
        } else {
          const data = await saveConversation(topic, difficulty, updatedMessages);
          if (data && data.length > 0) {
            savedIdRef.current = data[0].id;
          }
          setSaved(true);
        }
        await updateStreak();
      } catch (saveErr) {
        console.log('Auto-save failed:', saveErr.message);
      }

      scrollRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      Alert.alert('Error', 'Failed to get explanation. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = () => {
    if (!followUp.trim()) return;
    const question = followUp;
    setFollowUp('');
    handleExplain(question);
  };

  const handleQuiz = async () => {
    setLoading(true);
    setQuizMode(true);
    setQuizSubmitted(false);
    setSelectedAnswers({});
    try {
      const questions = await generateQuiz(topic, difficulty);
      setQuiz(questions);
    } catch (err) {
      Alert.alert('Error', 'Could not generate quiz. Try again!');
      setQuizMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (savedIdRef.current) {
        await updateConversation(savedIdRef.current, messages);
      } else {
        const data = await saveConversation(topic, difficulty, messages);
        if (data && data.length > 0) {
          savedIdRef.current = data[0].id;
        }
        setSaved(true);
      }
      Alert.alert('Saved!', 'Conversation saved! View it in History.');
    } catch (err) {
      Alert.alert('Error', 'Could not save. Check Supabase connection.');
    }
  };

  const handleBookmark = async () => {
    if (bookmarked) {
      Alert.alert('Already Bookmarked', 'This explanation is already in your bookmarks!');
      return;
    }
    const lastAiMsg = messages.filter(m => m.role === 'assistant').pop();
    if (!lastAiMsg) {
      Alert.alert('Error', 'No explanation to bookmark yet!');
      return;
    }
    try {
      await addBookmark(topic, difficulty, lastAiMsg.content);
      setBookmarked(true);
      Alert.alert('Bookmarked!', 'Saved to your bookmarks!');
    } catch (err) {
      Alert.alert('Error', 'Could not bookmark. Try again!');
    }
  };

  const handleShare = async () => {
    const lastAiMsg = messages.filter(m => m.role === 'assistant').pop();
    if (!lastAiMsg) {
      Alert.alert('Nothing to share', 'Wait for an explanation first!');
      return;
    }
    try {
      setSharing(true);
      const uri = await shareCardRef.current.capture();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Check out this explanation of ${topic}!`,
      });
    } catch (err) {
      Alert.alert('Error', 'Could not share. Try again!');
    } finally {
      setSharing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {}
    router.replace('/auth');
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(selectedAnswers).length < quiz.length) {
      Alert.alert('Incomplete', 'Please answer all questions first!');
      return;
    }
    setQuizSubmitted(true);
  };

  const getScore = () => {
    if (!quiz) return 0;
    return quiz.filter((q, i) => selectedAnswers[i] === q.correct).length;
  };

  const inputGlowBorder = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.borderLight, COLORS.primary],
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, containerStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Topic Header */}
      <Animated.View
        style={[
          styles.topicHeader,
          {
            transform: [{ translateY: headerSlide.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
          },
        ]}
      >
        <Animated.View
          style={{
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <View style={styles.topicTitleRow}>
            <View style={styles.topicIconWrap}>
              <Ionicons name="book-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.topicTitle} numberOfLines={1}>{topic}</Text>
          </View>
        </Animated.View>
        <View style={styles.badgeRow}>
          <Animated.View
            style={{
              opacity: badgeAnim,
              transform: [{
                translateY: badgeAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
              }],
            }}
          >
            <Animated.View
              style={[
                styles.badge,
                {
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: badgeGlow.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.5] }),
                  shadowRadius: badgeGlow.interpolate({ inputRange: [0, 1], outputRange: [4, 12] }),
                },
              ]}
            >
              <Text style={styles.badgeText}>{difficulty?.toUpperCase()}</Text>
            </Animated.View>
          </Animated.View>
          <View style={styles.spacer} />
          <Animated.View
            style={{
              opacity: actionAnim1,
              transform: [{ translateY: actionAnim1.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
          >
            <PressScale onPress={handleSave}>
              <Animated.View
                style={[
                  styles.actionBtn,
                  saved && styles.actionBtnDone,
                  saved && { transform: [{ scale: savePop }] },
                ]}
              >
                <Ionicons
                  name={saved ? 'checkmark-circle' : 'save-outline'}
                  size={13}
                  color={saved ? COLORS.success : COLORS.textTertiary}
                />
                <Text style={[styles.actionBtnText, saved && styles.actionBtnTextDone]}>
                  {saved ? 'Saved' : 'Save'}
                </Text>
              </Animated.View>
            </PressScale>
          </Animated.View>
          <Animated.View
            style={{
              opacity: actionAnim2,
              transform: [{ translateY: actionAnim2.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
          >
            <PressScale onPress={handleBookmark}>
              <Animated.View
                style={[
                  styles.actionBtn,
                  bookmarked && styles.bookmarkBtnDone,
                  bookmarked && { transform: [{ scale: bookmarkPop }] },
                ]}
              >
                <Ionicons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={13}
                  color={bookmarked ? COLORS.warning : COLORS.textTertiary}
                />
                <Text style={[styles.actionBtnText, bookmarked && styles.bookmarkBtnText]}>
                  {bookmarked ? 'Saved' : 'Bookmark'}
                </Text>
              </Animated.View>
            </PressScale>
          </Animated.View>
          <Animated.View
            style={{
              opacity: actionAnim3,
              transform: [{ translateY: actionAnim3.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
          >
            <PressScale onPress={handleShare} disabled={sharing}>
              <View style={[styles.logoutBtn, sharing && { opacity: 0.6 }]}>
                <Ionicons
                  name={sharing ? 'hourglass-outline' : 'share-social-outline'}
                  size={17}
                  color={COLORS.primary}
                />
              </View>
            </PressScale>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Messages / Quiz Area */}
      <View style={{ flex: 1, position: 'relative' }}>
        <Animated.View style={{ flex: 1, opacity: chatFade }}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!quizMode ? (
            <>
              {messages.map((msg, idx) => {
                const anim = msgAnims.current[idx];
                const bubbleAnimStyle = anim
                  ? {
                      opacity: anim.opacity,
                      transform: [{ translateY: anim.slide }],
                    }
                  : {};
                const isUser = msg.role === 'user';
                return (
                  <Animated.View
                    key={idx}
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.aiBubble,
                      bubbleAnimStyle,
                      bubbleMaxWidth ? { maxWidth: bubbleMaxWidth } : {},
                      {
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        transform: [
                          ...(bubbleAnimStyle.transform || []),
                          {
                            translateX: anim
                              ? anim.slide.interpolate({
                                  inputRange: [0, 20],
                                  outputRange: [0, isUser ? 15 : -15],
                                })
                              : 0,
                          },
                        ],
                      },
                    ]}
                  >
                    {msg.role === 'assistant' && (
                      <View style={styles.aiLabelRow}>
                        <Animated.View
                          style={[styles.aiIconWrap, { transform: [{ rotate: labelSparkleRotate }] }]}
                        >
                          <Ionicons name="sparkles-outline" size={12} color={COLORS.primary} />
                        </Animated.View>
                        <Text style={styles.aiLabel}>Elucid</Text>
                      </View>
                    )}
                    {isUser ? (
                      <Text style={styles.messageText}>{msg.content}</Text>
                    ) : (
                      <View>{renderMarkdown(msg.content, styles.messageText)}</View>
                    )}
                  </Animated.View>
                );
              })}
              {loading && <TypingDots />}
            </>
          ) : (
            <>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={COLORS.primary} size="large" />
                  <Text style={styles.loadingText}>Generating quiz...</Text>
                </View>
              ) : quiz ? (
                <>
                  <View style={styles.quizTitleRow}>
                    <View style={styles.quizIconWrap}>
                      <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.quizTitle}>Quick Quiz</Text>
                  </View>
                  {quiz.map((q, qi) => {
                    const cardAnim = quizCardAnims.current[qi];
                    const correctAnim = quizCorrectAnims.current[qi];
                    const wrongAnim = quizWrongAnims.current[qi];
                    return (
                      <Animated.View
                        key={qi}
                        style={[
                          styles.questionCard,
                          cardAnim
                            ? {
                                opacity: cardAnim,
                                transform: [
                                  { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                                ],
                              }
                            : {},
                        ]}
                      >
                        <Text style={styles.questionText}>
                          {qi + 1}. {q.question}
                        </Text>
                        {q.options.map((opt, oi) => {
                          const isSelected = selectedAnswers[qi] === oi;
                          const isCorrect = oi === q.correct;
                          let optStyle = styles.optionBtn;
                          let animStyle = {};
                          if (quizSubmitted) {
                            if (isCorrect) {
                              optStyle = styles.optionCorrect;
                              if (correctAnim) {
                                animStyle = {
                                  transform: [
                                    { scale: correctAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
                                  ],
                                };
                              }
                            } else if (isSelected) {
                              optStyle = styles.optionWrong;
                              if (wrongAnim) {
                                animStyle = {
                                  transform: [{ translateX: wrongAnim.interpolate({
                                    inputRange: [-1, 0, 1],
                                    outputRange: [-8, 0, 8],
                                  }) }],
                                };
                              }
                            }
                          } else if (isSelected) {
                            optStyle = styles.optionSelected;
                          }
                          return (
                            <Animated.View key={oi} style={animStyle}>
                              <TouchableOpacity
                                style={optStyle}
                                onPress={() =>
                                  !quizSubmitted &&
                                  setSelectedAnswers({ ...selectedAnswers, [qi]: oi })
                                }
                                activeOpacity={0.8}
                              >
                                <Text style={styles.optionText}>{opt}</Text>
                              </TouchableOpacity>
                            </Animated.View>
                          );
                        })}
                        {quizSubmitted && (
                          <View style={styles.explanationRow}>
                            <Ionicons name="bulb-outline" size={14} color={COLORS.warning} />
                            <Text style={styles.explanationText}>{q.explanation}</Text>
                          </View>
                        )}
                      </Animated.View>
                    );
                  })}
                  {quizSubmitted && (
                    <Animated.View
                      style={[
                        styles.scoreCard,
                        { transform: [{ scale: scoreAnim }], opacity: scoreAnim },
                      ]}
                    >
                      <Ionicons name="trophy-outline" size={22} color={COLORS.primary} />
                      <Text style={styles.scoreText}>
                        {getScore()}/{quiz.length}
                      </Text>
                    </Animated.View>
                  )}
                  {!quizSubmitted ? (
                    <PressScale onPress={handleSubmitQuiz}>
                      <View style={styles.submitBtn}>
                        <Text style={styles.submitBtnText}>Submit Quiz</Text>
                      </View>
                    </PressScale>
                  ) : (
                    <PressScale onPress={() => setQuizMode(false)}>
                      <View style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.backBtnText}>Back to Explanation</Text>
                      </View>
                    </PressScale>
                  )}
                </>
              ) : null}
            </>
          )}
        </ScrollView>
        </Animated.View>
        {/* Scroll fade gradient */}
        <View style={styles.scrollFade} pointerEvents="none" />
      </View>

      {/* Bottom Action Bar */}
      {!quizMode && (
        <View style={styles.bottomBar}>
          <View style={styles.inputRow}>
            <Animated.View
              style={[
                styles.followUpInputWrap,
                inputFocused && {
                  borderColor: COLORS.primary,
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
            >
              <TextInput
                style={styles.followUpInput}
                placeholder="Ask a follow-up..."
                placeholderTextColor={COLORS.textTertiary}
                value={followUp}
                onChangeText={setFollowUp}
                onSubmitEditing={handleFollowUp}
                returnKeyType="send"
                selectionColor={COLORS.primary}
                onFocus={() => {
                  setInputFocused(true);
                  Animated.spring(inputFocusAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: false }).start();
                }}
                onBlur={() => {
                  setInputFocused(false);
                  Animated.spring(inputFocusAnim, { toValue: 0, friction: 6, tension: 100, useNativeDriver: false }).start();
                }}
              />
            </Animated.View>
            <PressScale onPress={handleFollowUp}>
              <Animated.View
                style={[
                  styles.sendBtn,
                  followUp.trim().length > 0 && {
                    transform: [{ scale: sendPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
                  },
                ]}
              >
                <Ionicons name="send" size={17} color={COLORS.text} />
              </Animated.View>
            </PressScale>
            <PressScale onPress={handleQuiz}>
              <View style={styles.quizBtn}>
                <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
              </View>
            </PressScale>
          </View>
        </View>
      )}

      {/* Hidden Share Card for screenshot */}
      <ViewShot
        ref={shareCardRef}
        options={{ format: 'png', quality: 1 }}
        style={styles.hiddenCard}
      >
        <ShareCard
          topic={topic}
          difficulty={difficulty}
          content={messages.filter(m => m.role === 'assistant').pop()?.content || ''}
        />
      </ViewShot>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topicHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.select({
      ios: SPACING.md,
      android: StatusBar.currentHeight ? (StatusBar.currentHeight < 24 ? StatusBar.currentHeight + SPACING.xs : SPACING.sm) : SPACING.sm,
      default: SPACING.sm,
    }),
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  topicIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTitle: {
    color: COLORS.text,
    fontSize: FONTS.sizes.title3,
    fontWeight: '700',
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  spacer: { flex: 1 },
  badge: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  badgeText: { color: COLORS.primary, fontSize: FONTS.sizes.caption1, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 1,
    backgroundColor: COLORS.surface,
  },
  actionBtnDone: { backgroundColor: COLORS.successDark + '20' },
  actionBtnText: { color: COLORS.textTertiary, fontSize: FONTS.sizes.caption1, fontWeight: '600' },
  actionBtnTextDone: { color: COLORS.success },
  bookmarkBtnDone: { backgroundColor: COLORS.warning + '20' },
  bookmarkBtnText: { color: COLORS.warning },
  logoutBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: { flex: 1 },
  scrollContent: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl + SPACING.xl },
  scrollFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: COLORS.background,
    opacity: 0.55,
    pointerEvents: 'none',
  },
  messageBubble: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    maxWidth: '92%',
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: SPACING.xs,
  },
  aiBubble: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  aiIconWrap: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabel: { color: COLORS.primary, fontSize: FONTS.sizes.caption1, fontWeight: '700' },
  messageText: { color: COLORS.text, fontSize: FONTS.sizes.callout, lineHeight: 24 },
  typingContainer: { alignSelf: 'flex-start', marginBottom: SPACING.sm },
  typingBubble: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderBottomLeftRadius: SPACING.xs,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  loadingText: { color: COLORS.textTertiary, fontSize: FONTS.sizes.subhead },
  quizTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quizIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizTitle: { color: COLORS.text, fontSize: FONTS.sizes.title2, fontWeight: '700' },
  questionCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.callout,
    fontWeight: '600',
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  hiddenCard: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    opacity: 0,
  },
  optionBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  optionSelected: {
    backgroundColor: COLORS.primary + '25',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  optionCorrect: {
    backgroundColor: COLORS.success + '20',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  optionWrong: {
    backgroundColor: COLORS.error + '20',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  optionText: { color: COLORS.text, fontSize: FONTS.sizes.subhead },
  explanationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  explanationText: {
    color: COLORS.textTertiary,
    fontSize: FONTS.sizes.footnote,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 20,
  },
  scoreCard: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    marginBottom: SPACING.md,
  },
  scoreText: { color: COLORS.text, fontSize: FONTS.sizes.title2, fontWeight: '700' },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md + 2,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  submitBtnText: { color: COLORS.text, fontWeight: '600', fontSize: FONTS.sizes.headline },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  backBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.callout },
  bottomBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.sm,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  followUpInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  followUpInput: {
    flex: 1,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.text,
    fontSize: FONTS.sizes.callout,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
});
