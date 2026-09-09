<div align="center">

# J.A.R.V.I.S.

### *Just A Rather Very Intelligent System*

> **Iron Man Inspired AI Mobile Assistant**

Built with **React Native (Expo)** · **Groq AI** · **TypeScript**

<img src="https://img.shields.io/badge/Status-Active-00D9FF?style=for-the-badge&logo=react"/>
<img src="https://img.shields.io/badge/React_Native-Expo-20232A?style=for-the-badge&logo=expo"/>
<img src="https://img.shields.io/badge/Groq-AI-FF6B35?style=for-the-badge"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript"/>
<img src="https://img.shields.io/badge/License-MIT-00C853?style=for-the-badge"/>

*"Good morning, Priyanshi."*

</div>

---

## JARVIS isn't just another chatbot.

The goal is to recreate the feeling of **Tony Stark's JARVIS** on a smartphone.

Instead of behaving like a typical AI assistant, JARVIS is designed to feel:

- Calm
- Confident
- Context-aware
- Fast
- Minimal
- Futuristic

Every interaction should feel like talking to a system quietly running in the background—not a webpage asking for prompts.

---

# Preview

> Screenshots will be added as development progresses.

| Boot Sequence | Conversation | Live Weather |
|--------------|-------------|-------------|
| Coming Soon | Coming Soon | Coming Soon |

---

# Current Features

## AI Intelligence

- Streaming word-by-word responses
- Context-aware conversations
- Groq-powered reasoning
- Iron Man inspired personality
- Rich code rendering
- Regenerate responses
- Copy responses
- Delete messages

## Smart Local Intelligence

- Instant current time
- Instant current date
- Local timezone awareness
- New Year countdown

These work **without waiting for the AI**.

## Live Weather

Powered by **Open-Meteo**

- No API key
- No signup
- No credit card
- Real-time weather
- Tomorrow forecast support

Example:

> **"Barabanki is sitting at 31°C with scattered clouds. It feels like 33°C."**

## Conversation Memory

- Persistent chat history
- Reload-safe conversations
- Smart context trimming
- Better long conversations

## Premium UI

- Arc Reactor inspired interface
- Glassmorphism panels
- Holographic theme
- Smooth animations
- Smart keyboard behavior

---

# Architecture

```text
        USER
         │
         ▼
 ConversationPanel
         │
         ▼
   JARVIS Router
         │
 ┌───────┼────────┐
 ▼       ▼        ▼
Local   Weather   Groq
Time    Open-Meteo AI
         │
         ▼
 Streaming Reply
```

The router decides where each request should go before generating a response.

Examples:

| Request | Handler |
|---------|---------|
| What time is it? | Local Context |
| Barabanki weather | Open-Meteo |
| Explain binary search | Groq |
| Open WhatsApp | Device Intent |

---

# Example Commands

### Time

```text
What time is it?
```

### Weather

```text
Barabanki weather
```

```text
Delhi weather tomorrow
```

### Coding

```text
Write binary search in C.
```

### Device

```text
Open WhatsApp
```

(Currently responds in JARVIS style while native execution is under development.)

---

# Tech Stack

| Layer | Technology |
|--------|------------|
| Mobile | React Native (Expo) |
| Language | TypeScript |
| AI | Groq |
| Weather | Open-Meteo |
| Storage | AsyncStorage |
| Styling | Custom Glass UI |
| Animations | React Native Animated |

---

# Project Structure

```text
mobile/
│
├── components/
├── hooks/
├── screens/
├── services/
│   ├── aiService.ts
│   ├── jarvisRouter.ts
│   ├── liveInfoService.ts
│   ├── intentEngine.ts
│   └── providers/
│
├── storage/
├── theme/
├── utils/
├── voice/
│
├── App.tsx
└── README.md
```

---

# Installation

## Clone

```bash
git clone https://github.com/PriyanshiBajpai09/jarvis.git
cd jarvis/mobile
```

## Install

```bash
npm install
```

## Environment

Create a `.env` file.

```env
EXPO_PUBLIC_AI_PROVIDER=groq
EXPO_PUBLIC_GROQ_API_KEY=YOUR_GROQ_KEY
```

> Weather requires no API key.

## Run

```bash
npx expo start
```

---

# Development Progress

## Phase 24 (Completed)

- [x] Streaming replies
- [x] Conversation memory
- [x] Long press actions
- [x] Rich code blocks
- [x] Keyboard improvements
- [x] Intent routing
- [x] Instant local time
- [x] Live weather
- [x] Iron Man personality

---

# Coming Next

## Phase 25 — Voice OS

- [ ] Hold-to-talk microphone
- [ ] JARVIS voice replies
- [ ] Arc Reactor speaking animation
- [ ] Wake word ("Hey JARVIS")

## Phase 26 — Device Control

- [ ] Flashlight
- [ ] Open apps
- [ ] Calls
- [ ] SMS
- [ ] Reminders

## Phase 27 — Intelligent Memory

- [ ] Personal facts
- [ ] Follow-up understanding
- [ ] Better long-term context

---

# Design Philosophy

Most assistants wait.

JARVIS anticipates.

The long-term vision is an assistant that quietly understands context, speaks naturally, and controls the device when appropriate—bringing the closest possible mobile experience to Tony Stark's iconic AI.

---

# Author

### Priyanshi Bajpai

B.Tech Computer Science & Engineering

- React Native
- MERN Stack
- AI Development
- Full Stack Engineering

GitHub:
**@PriyanshiBajpai09**

---

<div align="center">

## “Sometimes you gotta run before you can walk.”

— Tony Stark

⭐ If you like this project, consider starring the repository.

</div>
