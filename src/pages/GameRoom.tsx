import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameCanvas } from "@/components/game/GameCanvas";
import { PlayerList } from "@/components/game/PlayerList";
import { ChatBox } from "@/components/game/ChatBox";
import { GameHeader } from "@/components/game/GameHeader";

import { useGameSocket } from "@/hooks/useGameSocket";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export interface Player {
  id: string;
  username: string;
  score: number;
  isDrawer: boolean;
  avatar?: number;
}

export interface Message {
  id: string;
  username: string;
  message: string;
  isCorrect?: boolean;
  timestamp: number;
}

  const GameRoom = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState(0);
    const isMobile = useIsMobile();
    
    const {
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
      clearCanvas: socketClearCanvas,
      startGame,
    } = useGameSocket(roomCode || "", username, avatar);

    useEffect(() => {
      const storedUsername = sessionStorage.getItem("username");
      const storedRoomCode = sessionStorage.getItem("roomCode");
      const storedAvatar = sessionStorage.getItem("avatar");

      if (!storedUsername || storedRoomCode !== roomCode) {
        toast.error("Invalid session");
        navigate("/");
        return;
      }

      setUsername(storedUsername);
      setAvatar(parseInt(storedAvatar || "0"));
    }, [roomCode, navigate]);

    const handleLeaveRoom = () => {
      sessionStorage.clear();
      navigate("/");
    };

    if (!username) {
      return null;
    }

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <GameHeader
          roomCode={roomCode || ""}
          timeLeft={timeLeft}
          currentWord={currentWord}
          isDrawer={isDrawer}
          onLeave={handleLeaveRoom}
        />

        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-[1600px] mx-auto w-full">
          {isMobile ? (
            <>
              {/* Mobile: Vertical stack */}
              {/* Canvas with overlay */}
              <div className="flex-1 relative min-h-[400px] mb-4">
                <GameCanvas
                  isDrawer={isDrawer}
                  onDraw={sendDrawing}
                  onClear={socketClearCanvas}
                />
                {currentDrawer && gameState === 'playing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 z-10 rounded-xl">
                    <div className="w-24 h-24 rounded-full bg-yellow-400 flex items-center justify-center mb-4 shadow-lg">
                      <span className="text-3xl font-bold text-black">{currentDrawer.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white text-center mb-2">{currentDrawer.username} choosing a word!</h2>
                    <p className="text-white text-center text-lg">Please wait...</p>
                  </div>
                )}
              </div>

              {/* Player list full width */}
              <div className="w-full mb-4">
                <PlayerList players={players} />
              </div>

              {/* Chat full width at bottom */}
              <div className="w-full">
                <ChatBox
                  messages={messages}
                  onSendMessage={sendMessage}
                  isDrawer={isDrawer}
                />
              </div>
            </>
          ) : (
            <>
              {/* Desktop: Three column */}
              <div className="lg:w-64 flex-shrink-0">
                <PlayerList players={players} />
              </div>
              <div className="flex-1 min-h-[500px]">
                <GameCanvas
                  isDrawer={isDrawer}
                  onDraw={sendDrawing}
                  onClear={socketClearCanvas}
                />
              </div>
              <div className="lg:w-80 flex-shrink-0">
                <ChatBox
                  messages={messages}
                  onSendMessage={sendMessage}
                  isDrawer={isDrawer}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

export default GameRoom;
