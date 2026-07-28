import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { COLORS, SPACING, FONTS } from '../constants/theme';

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
  const savedIdRef = useRef(null);

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
      const newMessages = [
        ...messages,
        { role: 'user', content: userMsg },
      ];
      setMessages(newMessages);

      const response = await explainConcept(topic, difficulty, customFollowUp);

      const updatedMessages = [
        ...newMessages,
        { role: 'assistant', content: response },
      ];
      setMessages(updatedMessages);

      // Auto-save + streak update
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
        // Update streak on every explanation
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

    // Get last AI response
    const lastAiMsg = messages.filter(m => m.role === 'assistant').pop();
    if (!lastAiMsg) {
      Alert.alert('Error', 'No explanation to bookmark yet!');
      return;
    }

    try {
      await addBookmark(topic, difficulty, lastAiMsg.content);
      setBookmarked(true);
      Alert.alert('Bookmarked! 🔖', 'Saved to your bookmarks!');
    } catch (err) {
      Alert.alert('Error', 'Could not bookmark. Try again!');
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
          <Ionicons name="book-outline" size={20} color={COLORS.primary} />
          <Text style={styles.topicTitle}>{topic}</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{difficulty?.toUpperCase()}</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.actionBtn, saved && styles.actionBtnDone]}
            onPress={handleSave}
          >
            <Ionicons
              name={saved ? 'checkmark-circle-outline' : 'save-outline'}
              size={14}
              color={saved ? COLORS.success : COLORS.textSecondary}
            />
            <Text style={[styles.actionBtnText, saved && styles.actionBtnTextDone]}>
              {saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          {/* Bookmark Button */}
          <TouchableOpacity
            style={[styles.actionBtn, bookmarked && styles.bookmarkBtnDone]}
            onPress={handleBookmark}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color={bookmarked ? '#FF9800' : COLORS.textSecondary}
            />
            <Text style={[styles.actionBtnText, bookmarked && styles.bookmarkBtnText]}>
              {bookmarked ? 'Saved' : 'Bookmark'}
            </Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages / Quiz Area */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
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
                    <Ionicons name="sparkles-outline" size={14} color={COLORS.primary} />
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
                  <Ionicons name="help-circle-outline" size={22} color={COLORS.primary} />
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
                        >
                          <Text style={styles.optionText}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                    {quizSubmitted && (
                      <View style={styles.explanationRow}>
                        <Ionicons name="bulb-outline" size={15} color={COLORS.warning} />
                        <Text style={styles.explanationText}>{q.explanation}</Text>
                      </View>
                    )}
                  </View>
                ))}
                {quizSubmitted && (
                  <View style={styles.scoreCard}>
                    <Ionicons name="trophy-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.scoreText}>
                      Score: {getScore()}/{quiz.length}
                    </Text>
                  </View>
                )}
                {!quizSubmitted ? (
                  <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitQuiz}>
                    <Text style={styles.submitBtnText}>Submit Quiz</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => setQuizMode(false)}
                  >
                    <Ionicons name="arrow-back" size={17} color={COLORS.textSecondary} />
                    <Text style={styles.backBtnText}>Back to Explanation</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      {!quizMode && (
        <View style={styles.bottomBar}>
          <TextInput
            style={styles.followUpInput}
            placeholder="Ask a follow-up..."
            placeholderTextColor={COLORS.textSecondary}
            value={followUp}
            onChangeText={setFollowUp}
            onSubmitEditing={handleFollowUp}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleFollowUp}>
            <Ionicons name="send" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quizBtn} onPress={handleQuiz}>
            <Ionicons name="help-circle-outline" size={21} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topicHeader: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  topicTitle: {
    color: COLORS.text,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  badgeText: { color: COLORS.text, fontSize: FONTS.sizes.xs, fontWeight: 'bold' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  actionBtnDone: { borderColor: COLORS.success },
  actionBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  actionBtnTextDone: { color: COLORS.success },
  bookmarkBtnDone: { borderColor: '#FF9800' },
  bookmarkBtnText: { color: '#FF9800' },
  logoutBtn: { marginLeft: 'auto', padding: SPACING.xs },
  scrollArea: { flex: 1 },
  scrollContent: { padding: SPACING.md, gap: SPACING.md },
  messageBubble: {
    borderRadius: 16,
    padding: SPACING.md,
    maxWidth: '95%',
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: COLORS.card,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  aiLabel: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: 'bold' },
  messageText: { color: COLORS.text, fontSize: FONTS.sizes.md, lineHeight: 22 },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  quizTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  quizTitle: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: 'bold' },
  questionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  optionBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionSelected: {
    backgroundColor: COLORS.primary + '40',
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  optionCorrect: {
    backgroundColor: COLORS.success + '30',
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  optionWrong: {
    backgroundColor: COLORS.secondary + '30',
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  optionText: { color: COLORS.text, fontSize: FONTS.sizes.sm },
  explanationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  explanationText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontStyle: 'italic',
    flex: 1,
  },
  scoreCard: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  scoreText: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: 'bold' },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  submitBtnText: { color: COLORS.text, fontWeight: 'bold', fontSize: FONTS.sizes.md },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  backBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  bottomBar: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  followUpInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});