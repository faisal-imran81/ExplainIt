<!-- Banner -->
<!-- Add a screenshot or GIF banner here -->

<p align="center">
  <h1 align="center">Elucid</h1>
  <p align="center"><strong>Understand anything, at any level</strong></p>
  <p align="center">AI-powered learning companion — personal tutor in your pocket</p>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Expo_SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 54" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Groq_API-FF6F00?style=for-the-badge&logo=groq&logoColor=white" alt="Groq API" /></a>
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="MIT License" /></a>
  <a href="https://elucid-ai-tutor.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-vercel?style=for-the-badge&logo=vercel&logoColor=white&color=111" alt="Live Demo" /></a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-screens">Screens</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-web">Web</a> •
  <a href="#-project-structure">Structure</a>
</p>

---

## ✨ Features

- **🧠 AI Explanations** — Type any topic and get a clear, structured explanation powered by Groq's LLaMA 3.1 8B model
- **📊 5 Difficulty Levels** — From ELI5 to PhD — one concept, explained at your level
- **💡 Trending Suggestions** — "Try asking about..." chip row inspired by ChatGPT for instant topic ideas
- **📜 Conversation History** — Search, reopen, swipe-to-delete your past explanations
- **🔖 Bookmarks** — Save your favorite explanations and revisit them anytime
- **🔥 Streak Tracking** — Daily learning streak counter with a weekly calendar view and motivational messages
- **🃏 Share Cards** — Export explanations as beautiful shareable cards
- **👤 Guest Mode** — Jump right in without signing up; create an account to save progress
- **🎬 Animated Onboarding** — 3-slide gesture-driven welcome flow with glow effects and staggered animations
- **🌐 Responsive Web** — Full desktop layout with Gemini-inspired animated gradient blobs and floating particles
- **🌙 Dark Theme** — Premium dark UI throughout, optimized for readability

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [React Native](https://reactnative.dev/) | Cross-platform mobile framework |
| [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) | Development platform and toolchain |
| [Expo Router](https://docs.expo.dev/router/introduction/) | File-based navigation |
| [Groq API](https://groq.com/) | Low-latency LLM inference (LLaMA 3.1 8B) |
| [Supabase](https://supabase.com/) | Auth, database, and real-time backend |
| [react-native-web](https://necolas.github.io/react-native-web/) | Web rendering for all screens |

---

## 📱 Screens

| Screen | Description |
|---|---|
| **Onboarding** | 3-slide animated intro with glow effects, pill dot indicators, and gesture navigation |
| **Auth** | Login / Signup / Guest mode with animated particles, loading dots, and input glow effects |
| **Home** | Topic input, 5-level difficulty selector, trending suggestion chips, and web animated background |
| **Explain** | AI chat interface with markdown responses, message animations, typing dots, and built-in quizzes |
| **History** | Searchable list of past conversations with staggered card entrance, swipe-to-delete, and action menu |
| **Bookmarks** | Saved explanations with search, swipe-to-delete, and action menu |
| **Profile** | Avatar with rotating ring glow, stats counter, streak calendar, quick links, and logout |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- Expo CLI (`npm install -g expo-cli`)
- A Supabase account and project
- A Groq API key

### Setup

```bash
# Clone the repository
git clone https://github.com/faisalimran/elucid.git
cd elucid

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

```bash
# Start the development server
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `w` to open in a web browser.

---

## 🌐 Web

Elucid is fully responsive across all platforms. On desktop browsers:

- Content is centered in a wide, comfortable container (up to 960px)
- An animated background with slow-moving gradient blobs and floating particles activates automatically
- Padding scales with viewport width for optimal readability
- All screens — Home, Auth, Explain, History, Bookmarks, Profile — work identically to native

> **Native iOS and Android behavior is completely unchanged** — the web layout enhancements are applied via `Platform.OS` checks and do not affect mobile builds.

---

## 📁 Project Structure

```
elucid/
├── app/                    # Expo Router screens
│   ├── _layout.jsx         # Root layout with auth guard + loading screen
│   ├── index.jsx           # Home screen
│   ├── auth.jsx            # Auth screen
│   ├── onboarding.jsx      # Onboarding screen
│   ├── explain.jsx         # AI chat/explain screen
│   ├── history.jsx         # Conversation history
│   ├── bookmarks.jsx       # Saved bookmarks
│   └── profile.jsx         # User profile
├── components/             # Reusable components
│   ├── WebBackground.jsx   # Gemini-style animated web background
│   ├── ExplainCard.jsx     # Share card component
│   ├── MessageBubble.jsx   # Chat message bubble
│   └── DifficultySlider.jsx
├── constants/
│   └── theme.js            # Colors, fonts, spacing, radius
├── lib/
│   ├── supabase.js         # Supabase client + API helpers
│   └── groq.js             # Groq LLM API client
├── utils/
│   └── responsive.js       # Responsive web layout hook
├── assets/
│   └── fonts/
└── .env                    # API keys (not committed)
```

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements, new features, or bug fixes:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-idea`)
3. Commit your changes (`git commit -m 'Add amazing idea'`)
4. Push to the branch (`git push origin feature/amazing-idea`)
5. Open a Pull Request

Please ensure your code follows the existing style conventions and passes all checks.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/faisalimran">Faisal Imran</a>
  <br />
  CS Student at FAST NUCES
</p>
