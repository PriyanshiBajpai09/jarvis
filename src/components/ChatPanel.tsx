// ChatPanel.tsx
// Right HUD panel: JARVIS conversation surface.
//
// SECURITY-ARCHITECTURE NOTE (no backend implemented yet):
// `getJarvisResponse` is the single seam where a real AI call will be
// wired in later. When that happens, user input should pass through an
// input-sanitization step before leaving this component, and the AI
// response should pass through output filtering / command-confirmation
// logic before being rendered here. Both hooks are left as clearly
// marked no-op pass-throughs so the swap doesn't require restructuring.

import { useEffect, useRef, useState, type FormEvent } from 'react';

interface ChatMessage {
  id: string;
  sender: 'jarvis' | 'user';
  text: string;
  time: string;
}

function timestamp(): string {
  const d = new Date();
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Placeholder seam for future AI integration — intentionally simple for now.
function sanitizeInput(raw: string): string {
  return raw.trim().slice(0, 500);
}

// Placeholder seam for future AI integration — replace with a real model call.
function getJarvisResponse(): string {
  const responses = [
    'Request received. Standing by for further instructions.',
    'Processing. I will let you know once analysis completes.',
    'Understood. Adding that to the active task queue.',
    'Noted. Let me know if priorities change.',
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'm1', sender: 'jarvis', text: 'Good morning, Priyanshi.', time: timestamp() },
  { id: 'm2', sender: 'jarvis', text: 'All systems are operational.', time: timestamp() },
  { id: 'm3', sender: 'jarvis', text: 'How can I assist you today?', time: timestamp() },
];

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Clean up any pending timeout on unmount to avoid state updates after unmount.
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current !== null) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = sanitizeInput(draft);
    if (!clean) return;

    const userMessage: ChatMessage = {
      id: createId(),
      sender: 'user',
      text: clean,
      time: timestamp(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setIsTyping(true);

    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: createId(), sender: 'jarvis', text: getJarvisResponse(), time: timestamp() },
      ]);
    }, 1000);
  }

  return (
    <aside className="hud-panel hud-panel--right glass-panel corner-brackets">
      <div className="chat-scanline" aria-hidden="true" />

      <div className="hud-panel__header">
        <span className="hud-panel__title">Conversation</span>
        <span className="hud-panel__pulse" />
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`convo-line ${m.sender === 'user' ? 'convo-line--user' : 'convo-line--jarvis'}`}
          >
            <div className="convo-line__meta">
              <span className="convo-line__tag">{m.sender === 'user' ? 'YOU' : 'JARVIS'}</span>
              <span className="convo-line__time">{m.time}</span>
            </div>
            <span className="convo-line__text">{m.text}</span>
          </div>
        ))}

        {isTyping && (
          <div className="convo-line convo-line--jarvis convo-line--typing">
            <div className="convo-line__meta">
              <span className="convo-line__tag">JARVIS</span>
            </div>
            <span className="chat-typing" aria-label="Jarvis is typing">
              <span className="chat-typing__dot" />
              <span className="chat-typing__dot" />
              <span className="chat-typing__dot" />
            </span>
          </div>
        )}
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message Jarvis..."
          maxLength={500}
          aria-label="Message Jarvis"
        />
        <button className="chat-send-btn" type="submit" aria-label="Send message" disabled={!draft.trim()}>
          <span className="chat-send-btn__glyph" />
        </button>
      </form>

      <div className="hud-panel__footer">
        <span className="hud-panel__footer-dot" />
        <span className="hud-panel__footer-text">Link Stable</span>
      </div>
    </aside>
  );
}

export default ChatPanel;