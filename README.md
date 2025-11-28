# DrawBattle - Real-time Drawing & Guessing Game

A multiplayer drawing and guessing game built with React, TypeScript, and Socket.IO. Players take turns drawing while others guess the word in real-time.

## Features

- 🎨 **Real-time Drawing**: Smooth canvas drawing with multiple colors and brush sizes
- 💬 **Live Chat**: Real-time messaging with automatic word guessing detection
- 🏠 **Room System**: Create or join private rooms with unique codes
- 👥 **Multiplayer**: Support for up to 8 players per room
- ⏱️ **Timed Rounds**: 60-second rounds with automatic progression
- 🏆 **Score Tracking**: Points awarded for correct guesses and drawing
- 🎭 **Avatar Selection**: Choose from multiple avatar options
- 🌙 **Dark/Light Theme**: Toggle between themes

## Tech Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.IO** - Real-time communication
- **In-memory storage** - No database required

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd DrawBattle
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

### Running the Application

1. **Start the backend server** (in a separate terminal)
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:3001`

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

## How to Play

1. **Create a Room**: Enter a room name, your username, and select an avatar
2. **Invite Friends**: Share the room code with other players
3. **Start Game**: Room host clicks "Start Game" when ready
4. **Take Turns**: Players alternate between drawing and guessing
5. **Score Points**: Earn points for correct guesses and successful drawings

## Project Structure

```
DrawBattle/
├── src/
│   ├── components/          # React components
│   │   ├── game/           # Game-specific components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   └── lib/                # Utility functions
├── backend/
│   ├── socket/             # Socket.IO handlers
│   └── server.js           # Express server setup
├── public/                 # Static assets
└── package.json
```

## Environment Variables

### Frontend (.env)
```env
VITE_WS_URL=ws://localhost:3001
```

### Backend (.env)
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Scripts

- `npm run dev` - Start backend with nodemon
- `npm start` - Start backend in production mode

## Deployment

### Frontend
The frontend can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages

### Backend
The backend can be deployed to:
- Heroku
- Railway
- DigitalOcean App Platform
- AWS EC2

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
