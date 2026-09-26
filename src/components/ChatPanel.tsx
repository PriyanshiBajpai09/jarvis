import { useEffect, useRef, useState, type FormEvent } from "react";
import { askJarvis } from "../services/aiService";
import type { ChatTurn } from "../services/aiTypes";

interface ChatMessage {
  id: string;
  sender: "jarvis" | "user";
  text: string;
  time: string;
}

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeInput(raw: string): string {
  return raw.trim().slice(0, 500);
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

function getUserName(): string {
  return localStorage.getItem("jarvis_name") || "Commander";
}

function buildInitialMessages(): ChatMessage[] {
  const name = getUserName();

  return [
    {
      id: "m1",
      sender: "jarvis",
      text: `${getGreeting()}, ${name}.`,
      time: timestamp(),
    },
    {
      id: "m2",
      sender: "jarvis",
      text: "All systems are operational.",
      time: timestamp(),
    },
    {
      id: "m3",
      sender: "jarvis",
      text: "How can I assist you today?",
      time: timestamp(),
    },
  ];
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(buildInitialMessages);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const clean = sanitizeInput(draft);

    if (!clean || isTyping) return;

    const userMessage: ChatMessage = {
      id: createId(),
      sender: "user",
      text: clean,
      time: timestamp(),
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setDraft("");
    setIsTyping(true);

    try {
      const history: ChatTurn[] = updatedMessages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        text: m.text,
      }));

      const reply = await askJarvis(history);

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          sender: "jarvis",
          text: reply,
          time: timestamp(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          sender: "jarvis",
          text: "Connection interrupted. Reactor uplink is being restored.",
          time: timestamp(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
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
            className={`convo-line ${
              m.sender === "user" ? "convo-line--user" : "convo-line--jarvis"
            }`}
          >
            <div className="convo-line__meta">
              <span className="convo-line__tag">
                {m.sender === "user" ? "YOU" : "JARVIS"}
              </span>

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

            <span className="chat-typing">
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
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message Jarvis..."
          maxLength={500}
        />

        <button
          className="chat-send-btn"
          type="submit"
          disabled={!draft.trim() || isTyping}
        >
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
