# WhatsApp Clone - Frontend

A modern, real-time messaging web application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔐 User Authentication (Login/Register)
- 💬 Real-time Messaging with Socket.IO
- 📹 Video & Audio Calls with WebRTC
- 🎤 Voice Messages
- 📁 File Sharing (Images, Videos, Documents)
- 👥 Group Chats
- ⌨️ Typing Indicators
- ✅ Message Status (Sent, Delivered, Read)
- 🟢 Online/Offline Status
- 😀 Emoji Support
- 🌙 Dark Theme

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **State Management**: Zustand
- **Real-time**: Socket.IO Client
- **Video Calls**: WebRTC + simple-peer
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Emoji**: emoji-picker-react

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see backend README)

### Installation

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page (Chat)
│   │   ├── login/page.tsx    # Login page
│   │   ├── register/page.tsx # Register page
│   │   └── not-found.tsx     # 404 page
│   ├── components/
│   │   ├── call/
│   │   │   ├── IncomingCallModal.tsx
│   │   │   └── VideoCallScreen.tsx
│   │   ├── chat/
│   │   │   ├── ChatLayout.tsx
│   │   │   ├── ChatSidebar.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── NewChatModal.tsx
│   │   │   ├── NewGroupModal.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx
│   │   │   └── SocketProvider.tsx
│   │   └── ui/
│   │       ├── avatar.tsx
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── scroll-area.tsx
│   │       ├── toast.tsx
│   │       └── toaster.tsx
│   ├── hooks/
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── api.ts          # API client
│   │   ├── socket.ts       # Socket.IO service
│   │   └── utils.ts        # Utility functions
│   ├── store/
│   │   ├── authStore.ts    # Auth state
│   │   ├── callStore.ts    # Call state
│   │   └── chatStore.ts    # Chat state
│   └── types/
│       └── index.ts        # TypeScript types
├── public/
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Key Components

### AuthProvider
Handles authentication state initialization and token validation on app load.

### SocketProvider
Manages Socket.IO connection and event listeners for real-time features.

### ChatLayout
Main layout component with responsive sidebar and chat window.

### ChatWindow
Displays messages with proper formatting, status indicators, and typing animations.

### MessageInput
Rich input with emoji picker, file attachments, and voice recording.

### VideoCallScreen
Full-screen video/audio call interface with controls.

## State Management

Using Zustand for global state:

- **authStore**: User authentication state
- **chatStore**: Conversations, messages, typing indicators
- **callStore**: Active calls, streams, call UI state

## Styling

- Dark theme by default (WhatsApp-inspired)
- Custom color palette defined in `tailwind.config.ts`
- CSS animations for smooth UX
- Responsive design for mobile and desktop

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000` |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket server URL | `http://localhost:5000` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

WebRTC features require browser support and HTTPS in production.

## License

MIT

