import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Player, Message } from "@/pages/GameRoom";
import { toast } from "sonner";

interface DrawingData {
  x: number;
  y: number;
  color: string;
  size: number;
}

export const useGameSocket = (roomCode: string, username: string, avatar: number) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isDrawer, setIsDrawer] = useState(false);
  const [currentDrawer, setCurrentDrawer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<"waiting" | "playing">("waiting");
  const [isHost, setIsHost] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomCode || !username) return;

    // Determine WebSocket URL based on environment
    const isProduction = import.meta.env.PROD;
    const wsUrl = isProduction
      ? 'wss://drawbattle.onrender.com' // Use WSS for WebSocket in production
      : 'http://localhost:3001';

    console.log(`Initializing WebSocket connection to: ${wsUrl}`);

    // Connect to Socket.IO server with enhanced configuration
    const socket = io(wsUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'], // Try WebSocket first, fall back to polling
      reconnection: true,
      reconnectionAttempts: 10, // Increased from 5 to 10
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000, // Increased from 5000 to 10000
      timeout: 15000, // Increased from 10000 to 15000
      autoConnect: true,
      secure: isProduction,
      withCredentials: true,
      forceNew: true,
      rejectUnauthorized: false, // Only for development with self-signed certs
      // Additional options for better connection stability
      upgrade: true,
      rememberUpgrade: true,
      perMessageDeflate: {
        threshold: 1024 // Size threshold (in bytes) for compression
      }
    });

    // Store socket reference
    socketRef.current = socket;

    // Connection established
    const onConnect = () => {
      console.log("Connected to game server. Socket ID:", socket.id);
      toast.success("Connected to game server");
      
      // Join the room
      socket.emit("join", { roomCode, username, avatar }, (response: any) => {
        if (response?.error) {
          console.error("Join error:", response.error);
          toast.error(response.error);
        } else {
          console.log("Successfully joined room:", roomCode);
        }
      });
    };

    // Connection error
    const onConnectError = (error: any) => {
      console.error("Connection error:", error);
      toast.error("Failed to connect to game server");
    };

    // Disconnected
    const onDisconnect = (reason: string) => {
      console.log("Disconnected:", reason);
      if (reason === 'io server disconnect') {
        // Reconnect if server disconnects us
        socket.connect();
      }
    };

    // Reconnection events
    const onReconnectAttempt = (attempt: number) => {
      console.log(`Reconnection attempt ${attempt}`);
      toast.loading(`Reconnecting... (${attempt}/5)`);
    };

    const onReconnectFailed = () => {
      console.error("Failed to reconnect to server");
      toast.error("Connection lost. Please refresh the page.");
    };

    // Set up event listeners
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('reconnect_failed', onReconnectFailed);

    socket.on("init", (data) => {
      setIsHost(data.isHost);
      setPlayers(data.players);
      setGameState(data.gameState);
    });

    socket.on("players", (data) => {
      setPlayers(data.players);
    });

    socket.on("gameStateChange", (data) => {
      setGameState(data.gameState);
    });

    socket.on("countdown", (data) => {
      setCountdown(data.count);
    });

    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    socket.on("correctGuess", (data) => {
      toast.success(`${data.username} guessed correctly!`);
      setPlayers(data.players);
    });

    socket.on("drawing", (data) => {
      // Handle drawing data
    });

    socket.on("clear", () => {
      // Handle clear canvas
    });

    socket.on("roundStart", (data) => {
      setCurrentWord(data.word);
      setIsDrawer(data.drawerId === socket.id);
      const drawerPlayer = data.players.find((p: Player) => p.id === data.drawerId);
      setCurrentDrawer(drawerPlayer || null);
      setTimeLeft(60);
      setMessages([]);
    });

    socket.on("timeUpdate", (data) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on("roundEnd", (data) => {
      toast.info(`Round ended! Word was: ${data.word}`);
    });

    socket.on("connect_error", (err) => {
      console.error("connect_error:", err.message || err);
      toast.error("Connection error");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from game socket");
    });

    // Heartbeat for Render free tier
    const heartbeat = setInterval(() => {
      socket.emit("ping");
    }, 25000);

    socketRef.current = socket;

    return () => {
      clearInterval(heartbeat);
      socket.disconnect();
    };
  }, [roomCode, username, avatar]);

  const sendDrawing = (data: DrawingData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("draw", {
        roomCode,
        drawingData: data,
      });
    }
  };

  const sendMessage = (message: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("send-message", {
        roomCode,
        message,
      });
    }
  };

  const clearCanvas = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("clear-canvas", {
        roomCode,
      });
    }
  };

  const startGame = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("start-game", {
        roomCode,
      });
    }
  };

  return {
    players,
    messages,
    currentWord,
    timeLeft,
    isDrawer,
    currentDrawer,
    gameState,
    isHost,
    countdown,
    sendDrawing,
    sendMessage,
    clearCanvas,
    startGame,
  };
};
