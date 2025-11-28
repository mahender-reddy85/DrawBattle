import { useState, useEffect, useRef } from "react";
import { Player, Message } from "@/pages/GameRoom";
import { toast } from "sonner";

export const useGameSocket = (roomCode: string, username: string, avatar: number) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isDrawer, setIsDrawer] = useState(false);
  const [gameState, setGameState] = useState<"waiting" | "playing">("waiting");
  const [isHost, setIsHost] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomCode || !username) return;

    // Connect to WebSocket
    const ws = new WebSocket(
      `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/game-socket`
    );

    ws.onopen = () => {
      console.log("Connected to game socket");
      ws.send(
        JSON.stringify({
          type: "join",
          roomCode,
          username,
          avatar,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);

      switch (data.type) {
        case "init":
          setIsHost(data.isHost);
          setPlayers(data.players);
          setGameState(data.gameState);
          break;
        case "players":
          setPlayers(data.players);
          break;
        case "gameStateChange":
          setGameState(data.gameState);
          break;
        case "countdown":
          setCountdown(data.count);
          break;
        case "message":
          setMessages((prev) => [...prev, data.message]);
          break;
        case "correctGuess":
          toast.success(`${data.username} guessed correctly!`);
          setPlayers(data.players);
          break;
        case "drawing":
          // Handle drawing data
          break;
        case "clear":
          // Handle clear canvas
          break;
        case "roundStart":
          setCurrentWord(data.word);
          setIsDrawer(data.drawerId === data.playerId);
          setTimeLeft(60);
          setMessages([]);
          break;
        case "timeUpdate":
          setTimeLeft(data.timeLeft);
          break;
        case "roundEnd":
          toast.info(`Round ended! Word was: ${data.word}`);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("Connection error");
    };

    ws.onclose = () => {
      console.log("Disconnected from game socket");
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [roomCode, username, avatar]);

  const sendDrawing = (data: DrawingData) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "draw",
          roomCode,
          ...data,
        })
      );
    }
  };

  const sendMessage = (message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "guess",
          roomCode,
          username,
          message,
        })
      );
    }
  };

  const clearCanvas = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "clear",
          roomCode,
        })
      );
    }
  };

  const startGame = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "startGame",
          roomCode,
        })
      );
    }
  };

  return {
    players,
    messages,
    currentWord,
    timeLeft,
    isDrawer,
    gameState,
    isHost,
    countdown,
    sendDrawing,
    sendMessage,
    clearCanvas,
    startGame,
  };
};
