// ConversationPanel.tsx — Part G: streaming now pauses slightly longer
// after sentence-ending punctuation and commas, for a more natural
// reading rhythm. This is the ONLY logic change in this file — routing
// via jarvisRouter, persistent memory, long-press actions, code block
// rendering, the keyboard-overlap fix, and nested-scroll fix are all
// unchanged.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { colors, fonts } from "../theme/theme";
import GlassPanel from "./GlassPanel";
import CodeBlock from "./CodeBlock";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useThinkingPhrase } from "../hooks/useThinkingPhrase";
import { ChatTurn, AIServiceError } from "../services/aiService";
import { routeUserMessage } from "../services/jarvisRouter";
import { subscribeToExternalMessages } from "../services/chatBus";
import {
  clearConversation,
  loadConversation,
  saveConversation,
  StoredMessage,
} from "../storage/conversationStore";
import { trimHistoryForRequest } from "../utils/contextBuilder";
import {
  buildWordRevealSteps,
  parseMessageSegments,
} from "../utils/textFormat";
import { publishReplyReady } from "../services/replyBus";



interface Message {
  id: string;
  sender: "jarvis" | "user";
  text: string;
  time: string;
  isError?: boolean;
}

interface ConversationPanelProps {
  onInputFocus?: () => void;
}

const AT_BOTTOM_THRESHOLD = 48;
const SAVE_DEBOUNCE_MS = 400;
const WORD_DELAY_MIN_MS = 25;
const WORD_DELAY_RANGE_MS = 15; // base delay = 25-40ms
const PUNCTUATION_PAUSE_MS = 130; // extra pause after . ! ? ,

function timestamp(): string {
  const d = new Date();
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultGreeting(): Message[] {
  return [
    {
      id: createId(),
      sender: "jarvis",
      text: "Good morning, Priyanshi.",
      time: timestamp(),
    },
    {
      id: createId(),
      sender: "jarvis",
      text: "All systems are operational.",
      time: timestamp(),
    },
  ];
}

function toChatHistory(messages: Message[]): ChatTurn[] {
  return messages
    .filter((m) => !m.isError)
    .map(
      (m): ChatTurn => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      }),
    );
}

function toStoredMessages(messages: Message[]): StoredMessage[] {
  return messages
    .filter((m) => !m.isError)
    .map((m) => ({ id: m.id, sender: m.sender, text: m.text, time: m.time }));
}

function BlinkCursor({ reducedMotion }: { reducedMotion: boolean }) {
  const blink = useMemo(() => new Animated.Value(1), []);
  useEffect(() => {
    if (reducedMotion) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, blink]);
  return <Animated.View style={[styles.cursor, { opacity: blink }]} />;
}

interface MessageRowProps {
  message: Message;
  isStreamingThis: boolean;
  visibleWordIndex: number;
  reducedMotion: boolean;
  onLongPress: (message: Message) => void;
}

const MessageRow = React.memo(function MessageRow({
  message,
  isStreamingThis,
  visibleWordIndex,
  reducedMotion,
  onLongPress,
}: MessageRowProps) {
  const entrance = useMemo(() => new Animated.Value(0), []);
  const glow = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (reducedMotion) {
      entrance.setValue(1);
      return;
    }
    Animated.timing(entrance, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    if (message.sender === "jarvis" && !message.isError) {
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  const opacity = entrance;
  const translateY = useMemo(
    () => entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
    [entrance],
  );
  const glowOpacity = useMemo(
    () => glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }),
    [glow],
  );

  const wordSteps = useMemo(
    () => (isStreamingThis ? buildWordRevealSteps(message.text) : null),
    [isStreamingThis, message.text],
  );
  const segments = useMemo(
    () => (isStreamingThis ? null : parseMessageSegments(message.text)),
    [isStreamingThis, message.text],
  );

  const displayText = wordSteps
    ? (wordSteps[Math.min(visibleWordIndex, wordSteps.length - 1)] ?? "")
    : message.text;

  function handleLongPress() {
    onLongPress(message);
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable onLongPress={handleLongPress} delayLongPress={420}>
        <View style={styles.messageRow}>
          <View
            style={[
              styles.rail,
              message.sender === "user" ? styles.railUser : null,
              message.isError ? styles.railError : null,
            ]}
          />
          <View style={styles.messageBody}>
            {message.sender === "jarvis" && !message.isError && (
              <Animated.View
                style={[styles.glowOverlay, { opacity: glowOpacity }]}
                pointerEvents="none"
              />
            )}
            <View style={styles.meta}>
              <Text style={styles.tag}>
                {message.sender === "user" ? "YOU" : "JARVIS"}
              </Text>
              <Text style={styles.time}>{message.time}</Text>
            </View>

            {isStreamingThis || !segments ? (
              <View style={styles.textRow}>
                <Text
                  style={[
                    styles.text,
                    message.isError ? styles.textError : null,
                  ]}
                >
                  {displayText}
                </Text>
                {isStreamingThis && (
                  <BlinkCursor reducedMotion={reducedMotion} />
                )}
              </View>
            ) : (
              segments.map((seg, idx) =>
                seg.type === "code" ? (
                  <CodeBlock
                    key={`${message.id}-seg-${idx}`}
                    code={seg.content}
                    language={seg.language}
                  />
                ) : (
                  <Text
                    key={`${message.id}-seg-${idx}`}
                    style={[
                      styles.text,
                      message.isError ? styles.textError : null,
                    ]}
                  >
                    {seg.content}
                  </Text>
                ),
              )
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

function ConversationPanel({ onInputFocus }: ConversationPanelProps) {
  const reducedMotion = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>(defaultGreeting);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [visibleWordIndex, setVisibleWordIndex] = useState(0);

  const thinkingPhrase = useThinkingPhrase(isTyping);

  const scrollRef = useRef<ScrollView | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  const sendInFlightRef = useRef(false);
  const atBottomRef = useRef(true);
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const restored = await loadConversation();

      if (!cancelled && restored && restored.length > 0) {
        messagesRef.current = restored;
        setMessages(restored);
        atBottomRef.current = true;

        requestAnimationFrame(() => {
          scrollRef.current?.scrollToEnd({ animated: false });
        });
      }

      hasLoadedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return undefined;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void saveConversation(toStoredMessages(messages));
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages]);

  const scrollToEndIfAppropriate = useCallback((force: boolean) => {
    if (force || atBottomRef.current) {
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true }),
      );
    }
  }, []);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;
    atBottomRef.current = distanceFromBottom < AT_BOTTOM_THRESHOLD;
  }

  const cancelStreaming = useCallback(() => {
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
    setStreamingId(null);
  }, []);

  // Part G — adds a longer pause after a word ending in sentence
  // punctuation or a comma, so streaming reads with natural rhythm
  // rather than a flat metronome pace.
  const beginStreaming = useCallback(
    (messageId: string, fullText: string) => {
      cancelStreaming();

      if (reducedMotion) {
        setStreamingId(null);
        return;
      }

      const steps = buildWordRevealSteps(fullText);
      const totalWords = steps.length - 1;
      if (totalWords <= 0) {
        setStreamingId(null);
        return;
      }

      setStreamingId(messageId);
      setVisibleWordIndex(0);

      let index = 0;
      function delayForStep(stepText: string): number {
        const base = WORD_DELAY_MIN_MS + Math.random() * WORD_DELAY_RANGE_MS;
        const trimmed = stepText.trimEnd();
        const lastChar = trimmed.charAt(trimmed.length - 1);
        if (lastChar === "." || lastChar === "!" || lastChar === "?") {
          return base + PUNCTUATION_PAUSE_MS;
        }
        if (lastChar === "," || lastChar === ";") {
          return base + PUNCTUATION_PAUSE_MS * 0.5;
        }
        return base;
      }

      function tick() {
        index += 1;
        setVisibleWordIndex(index);
        scrollToEndIfAppropriate(false);
        if (index >= totalWords) {
          streamTimeoutRef.current = null;
          setStreamingId(null);
          return;
        }
        const delay = delayForStep(steps[index]);
        streamTimeoutRef.current = setTimeout(tick, delay);
      }
      streamTimeoutRef.current = setTimeout(
        tick,
        WORD_DELAY_MIN_MS + Math.random() * WORD_DELAY_RANGE_MS,
      );
    },
    [cancelStreaming, reducedMotion, scrollToEndIfAppropriate],
  );

  const sendText = useCallback(
  async (rawText: string) => {
    const clean = rawText.trim();
    if (!clean || sendInFlightRef.current) return;
    sendInFlightRef.current = true;

    cancelStreaming();

    const userMessage: Message = {
      id: createId(),
      sender: "user",
      text: clean,
      time: timestamp(),
    };

    const withUser = [...messagesRef.current, userMessage];
    messagesRef.current = withUser;
    setMessages(withUser);
    setDraft("");
    setIsTyping(true);
    atBottomRef.current = true;
    scrollToEndIfAppropriate(true);

    const historyForRequest = trimHistoryForRequest(
      toChatHistory(withUser)
    );

    try {
      const routed = await routeUserMessage(clean, historyForRequest);

      const jarvisMessage: Message = {
        id: createId(),
        sender: "jarvis",
        text: routed.replyText,
        time: timestamp(),
      };

      const withReply = [...messagesRef.current, jarvisMessage];
      messagesRef.current = withReply;
      setIsTyping(false);
      setMessages(withReply);

      beginStreaming(jarvisMessage.id, routed.replyText);

      // Web-only side channel for browser speech.
      if (Platform.OS === "web") {
        publishReplyReady(routed.replyText);
      }
    } catch (err) {
      const message =
        err instanceof AIServiceError
          ? err.message
          : "Signal disrupted.";

      const errorMessage: Message = {
        id: createId(),
        sender: "jarvis",
        text: message,
        time: timestamp(),
        isError: true,
      };

      const withError = [...messagesRef.current, errorMessage];
      messagesRef.current = withError;
      setIsTyping(false);
      setMessages(withError);
    } finally {
      sendInFlightRef.current = false;
      scrollToEndIfAppropriate(false);
    }
  },
  [beginStreaming, cancelStreaming, scrollToEndIfAppropriate]
);

  function handleSend() {
    void sendText(draft);
  }

  const handleClearMemory = useCallback(async () => {
    await clearConversation();
    cancelStreaming();
    const fresh = defaultGreeting();
    messagesRef.current = fresh;
    setMessages(fresh);
    setDraft("");
    setIsTyping(false);
    atBottomRef.current = true;
  }, [cancelStreaming]);

  const handleCopyMessage = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
  }, []);

  const handleDeleteMessage = useCallback((messageId: string) => {
    const updated = messagesRef.current.filter((m) => m.id !== messageId);
    messagesRef.current = updated;
    setMessages(updated);
  }, []);

  const handleRegenerate = useCallback(
  async (messageId: string) => {
    const index = messagesRef.current.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    const target = messagesRef.current[index];

    if (
      target.sender !== "jarvis" ||
      target.isError ||
      sendInFlightRef.current
    ) {
      return;
    }

    sendInFlightRef.current = true;
    cancelStreaming();
    setIsTyping(true);

    const priorMessages = messagesRef.current.slice(0, index);
    const historyForRequest = trimHistoryForRequest(
      toChatHistory(priorMessages),
    );

    const triggeringUserMessage = [...priorMessages]
      .reverse()
      .find((m) => m.sender === "user");

    try {
      const routed = await routeUserMessage(
        triggeringUserMessage?.text ?? "",
        historyForRequest,
      );

      const updated = [...messagesRef.current];

      updated[index] = {
        ...target,
        text: routed.replyText,
        time: timestamp(),
      };

      messagesRef.current = updated;
      setIsTyping(false);
      setMessages(updated);

      beginStreaming(target.id, routed.replyText);

      // Web-only side channel for browser speech.
      if (Platform.OS === "web") {
        publishReplyReady(routed.replyText);
      }
    } catch (err) {
      setIsTyping(false);

      const message =
        err instanceof AIServiceError
          ? err.message
          : "Signal disrupted.";

      Alert.alert("Regeneration failed", message);
    } finally {
      sendInFlightRef.current = false;
    }
  },
  [beginStreaming, cancelStreaming],
);

  const handleLongPressMessage = useCallback(
    (message: Message) => {
      const buttons: Array<{
        text: string;
        style?: "default" | "cancel" | "destructive";
        onPress?: () => void;
      }> = [
        { text: "Copy", onPress: () => void handleCopyMessage(message.text) },
      ];
      if (message.sender === "jarvis" && !message.isError) {
        buttons.push({
          text: "Regenerate",
          onPress: () => void handleRegenerate(message.id),
        });
      }
      buttons.push({
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteMessage(message.id),
      });
      buttons.push({ text: "Cancel", style: "cancel" });
      Alert.alert("Message", undefined, buttons);
    },
    [handleCopyMessage, handleRegenerate, handleDeleteMessage],
  );

  useEffect(() => {
    const unsubscribe = subscribeToExternalMessages((text) => {
      void sendText(text);
    });
    return unsubscribe;
  }, [sendText]);

  useEffect(() => {
    const showEventName =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(showEventName, () => {
      scrollToEndIfAppropriate(false);
      onInputFocus?.();
    });
    return () => subscription.remove();
  }, [scrollToEndIfAppropriate, onInputFocus]);

  return (
    <GlassPanel style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Conversation</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => {
              void handleClearMemory();
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.clearLabel}>Clear</Text>
          </TouchableOpacity>
          <View style={styles.pulseDot} />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {messages.map((m, i) => (
          <React.Fragment key={m.id}>
            {i > 0 && <View style={styles.divider} />}
            <MessageRow
              message={m}
              isStreamingThis={m.id === streamingId}
              visibleWordIndex={visibleWordIndex}
              reducedMotion={reducedMotion}
              onLongPress={handleLongPressMessage}
            />
          </React.Fragment>
        ))}

        {isTyping && (
          <>
            <View style={styles.divider} />
            <View style={styles.messageRow}>
              <View style={styles.rail} />
              <View style={styles.messageBody}>
                <View style={styles.meta}>
                  <Text style={styles.tag}>JARVIS</Text>
                </View>
                <View style={styles.textRow}>
                  <Text style={styles.text}>{thinkingPhrase}</Text>
                  <BlinkCursor reducedMotion={reducedMotion} />
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Message Jarvis..."
          placeholderTextColor={colors.textDim}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleSend}
          onFocus={onInputFocus}
          returnKeyType="send"
          maxLength={500}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          disabled={!draft.trim()}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.sendGlyph,
              !draft.trim() ? styles.sendGlyphDisabled : null,
            ]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>Link Stable</Text>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,234,255,0.22)",
    paddingBottom: 8,
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.cyanSoft,
    textTransform: "uppercase",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  clearLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: "uppercase",
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.cyan,
  },
  scroll: { maxHeight: 220 },
  scrollContent: { gap: 12 },
  messageRow: { flexDirection: "row", gap: 10 },
  rail: {
    width: 2,
    borderRadius: 1,
    backgroundColor: "rgba(0,234,255,0.4)",
    shadowColor: colors.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  railUser: { backgroundColor: "rgba(125,249,255,0.5)" },
  railError: { backgroundColor: colors.warnAmber },
  messageBody: { flex: 1, gap: 3, position: "relative" },
  glowOverlay: {
    position: "absolute",
    top: -4,
    left: -6,
    right: -6,
    bottom: -4,
    backgroundColor: colors.cyan,
    borderRadius: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tag: {
    fontFamily: fonts.display,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.cyanSoft,
  },
  time: { fontFamily: fonts.body, fontSize: 9, color: colors.textDim },
  textRow: { flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap" },
  text: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  textError: { color: colors.warnAmber },
  cursor: {
    width: 6,
    height: 13,
    backgroundColor: colors.cyan,
    marginLeft: 2,
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,234,255,0.15)",
    shadowColor: colors.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 4,
    marginVertical: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: "rgba(0,234,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,234,255,0.28)",
    borderRadius: 4,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(0,234,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sendGlyph: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: colors.cyanSoft,
  },
  sendGlyphDisabled: { borderLeftColor: colors.textDim },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cyan,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.textDim,
    textTransform: "uppercase",
  },
});

export default ConversationPanel;
