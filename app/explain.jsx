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

export default function ExplainScreen() {
  const { id, topic, difficulty } = useLocalSearchParams();
  const router = useRouter();
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Topic Header */}
      <View style={styles.topicHeader}>
        <View style={styles.topicTitleRow}>
          <View style={styles.topicIconWrap}>
            <Ionicons name="book-outline" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.topicTitle} numberOfLines={1}>{topic}</Text>
        </View>
        <View style={styles.badgeRow}>
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{difficulty?.toUpperCase()}</Text>
  </View>
  <View style={styles.spacer} />
  <PressScale onPress={handleSave}>
    <View style={[styles.actionBtn, saved && styles.actionBtnDone]}>
      <Ionicons
        name={saved ? 'checkmark-circle' : 'save-outline'}
        size={13}
        color={saved ? COLORS.success : COLORS.textTertiary}
      />
      <Text style={[styles.actionBtnText, saved && styles.actionBtnTextDone]}>
        {saved ? 'Saved' : 'Save'}
      </Text>
    </View>
  </PressScale>
  <PressScale onPress={handleBookmark}>
    <View style={[styles.actionBtn, bookmarked && styles.bookmarkBtnDone]}>
      <Ionicons
        name={bookmarked ? 'bookmark' : 'bookmark-outline'}
        size={13}
        color={bookmarked ? COLORS.warning : COLORS.textTertiary}
      />
      <Text style={[styles.actionBtnText, bookmarked && styles.bookmarkBtnText]}>
        {bookmarked ? 'Saved' : 'Bookmark'}
      </Text>
    </View>
  </PressScale>

  {/* Share - sirf icon */}
  <PressScale onPress={handleShare} disabled={sharing}>
    <View style={[styles.logoutBtn, sharing && { opacity: 0.6 }]}>
      <Ionicons
        name={sharing ? 'hourglass-outline' : 'share-social-outline'}
        size={17}
        color={COLORS.primary}
      />
    </View>
  </PressScale>

  {/* Logout - sirf icon */}
  <PressScale onPress={handleLogout}>
    <View style={styles.logoutBtn}>
      <Ionicons name="log-out-outline" size={17} color={COLORS.textTertiary} />
    </View>
  </PressScale>
</View>
      </View>

      {/* Messages / Quiz Area */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!quizMode ? (
          <>
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                {msg.role === 'assistant' && (
                  <View style={styles.aiLabelRow}>
                    <View style={styles.aiIconWrap}>
                      <Ionicons name="sparkles-outline" size={12} color={COLORS.primary} />
                    </View>
                    <Text style={styles.aiLabel}>ExplainIt</Text>
                  </View>
                )}
                <Text style={styles.messageText}>{msg.content}</Text>
              </View>
            ))}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.primary} size="small" />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            )}
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
                {quiz.map((q, qi) => (
                  <View key={qi} style={styles.questionCard}>
                    <Text style={styles.questionText}>
                      {qi + 1}. {q.question}
                    </Text>
                    {q.options.map((opt, oi) => {
                      const isSelected = selectedAnswers[qi] === oi;
                      const isCorrect = oi === q.correct;
                      let optStyle = styles.optionBtn;
                      if (quizSubmitted) {
                        if (isCorrect) optStyle = styles.optionCorrect;
                        else if (isSelected) optStyle = styles.optionWrong;
                      } else if (isSelected) {
                        optStyle = styles.optionSelected;
                      }
                      return (
                        <TouchableOpacity
                          key={oi}
                          style={optStyle}
                          onPress={() =>
                            !quizSubmitted &&
                            setSelectedAnswers({ ...selectedAnswers, [qi]: oi })
                          }
                          activeOpacity={0.8}
                        >
                          <Text style={styles.optionText}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                    {quizSubmitted && (
                      <View style={styles.explanationRow}>
                        <Ionicons name="bulb-outline" size={14} color={COLORS.warning} />
                        <Text style={styles.explanationText}>{q.explanation}</Text>
                      </View>
                    )}
                  </View>
                ))}
                {quizSubmitted && (
                  <View style={styles.scoreCard}>
                    <Ionicons name="trophy-outline" size={22} color={COLORS.primary} />
                    <Text style={styles.scoreText}>
                      {getScore()}/{quiz.length}
                    </Text>
                  </View>
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

      {/* Bottom Action Bar */}
      {!quizMode && (
        <View style={styles.bottomBar}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.followUpInput}
              placeholder="Ask a follow-up..."
              placeholderTextColor={COLORS.textTertiary}
              value={followUp}
              onChangeText={setFollowUp}
              onSubmitEditing={handleFollowUp}
              returnKeyType="send"
              selectionColor={COLORS.primary}
            />
            <PressScale onPress={handleFollowUp}>
              <View style={styles.sendBtn}>
                <Ionicons name="send" size={17} color={COLORS.text} />
              </View>
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
  container: { flex: 1, backgroundColor: COLORS.background, ...Platform.select({ web: { maxWidth: 480, alignSelf: 'center', width: '100%' } }) },
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
  scrollContent: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  messageBubble: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    maxWidth: '92%',
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: SPACING.xs,
  },
  aiBubble: {
    backgroundColor: COLORS.card,
    alignSelf: 'flex-start',
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
  followUpInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.text,
    fontSize: FONTS.sizes.callout,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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