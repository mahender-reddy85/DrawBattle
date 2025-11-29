import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarSelector } from "./AvatarSelector";
import { toast } from "sonner";

interface JoinRoomProps {
  onBack: () => void;
}

export const JoinRoom = ({ onBack }: JoinRoomProps) => {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (roomCode.length !== 6) {
      toast.error("Room code must be 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      // Store username in session
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("avatar", selectedAvatar.toString());
      sessionStorage.setItem("roomCode", roomCode);
      sessionStorage.setItem("isHost", "false");

      // Navigate to game room
      navigate(`/room/${roomCode}`);
      toast.success("Joining room...");
    } catch (error) {
      toast.error("Failed to join room");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Your Name</Label>
          <Input
            id="username"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            className="h-12 text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="roomCode">Room Code</Label>
          <Input
            id="roomCode"
            placeholder="4-character code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))}
            maxLength={4}
            className="h-12 text-lg text-center tracking-widest font-bold"
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
          />
        </div>

        <AvatarSelector selected={selectedAvatar} onSelect={setSelectedAvatar} />

        <Button
          size="lg"
          className="w-full h-12 game-gradient hover:opacity-90 transition-opacity"
          onClick={handleJoinRoom}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            "Join Room"
          )}
        </Button>
      </div>
    </div>
  );
};
