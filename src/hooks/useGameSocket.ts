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

    // Connect to Socket.IO server
    const socket = io(import.meta.env.VITE_WS_URL || "https://drawbattle.onrender.com", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
      secure: true
    });

    socket.on("connect", () => {
      console.log("Connected to game socket id:", socket.id);
      socket.emit("join", {
        roomCode,
        username,
        avatar,
      });
    });

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
