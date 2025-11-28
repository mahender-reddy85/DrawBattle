import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AvatarSelector } from "./AvatarSelector";
import { GameSettings, GameSettingsData } from "./GameSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreateRoomProps {
  onBack: () => void;
}

export const CreateRoom = ({ onBack }: CreateRoomProps) => {
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const [gameSettings, setGameSettings] = useState<GameSettingsData>({
    players: 5,
    language: "English",
    drawTime: 80,
    rounds: 5,
    wordCount: 3,
    hints: 2,
    customWordsOnly: false,
    customWords: "",
  });

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (gameSettings.customWordsOnly && gameSettings.customWords.split(",").length < 10) {
      toast.error("Please provide at least 10 custom words");
      return;
    }

    setIsLoading(true);
    try {
      // Generate 4-digit room code
      const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Store username and settings in session
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("avatar", selectedAvatar.toString());
      sessionStorage.setItem("roomCode", roomCode);
      sessionStorage.setItem("isHost", "true");
      sessionStorage.setItem("gameSettings", JSON.stringify(gameSettings));

      // Navigate to game room
      navigate(`/room/${roomCode}`);
      toast.success("Room created! Share the code with friends.");
    } catch (error) {
      toast.error("Failed to create room");
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

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 mt-4">
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

          <AvatarSelector selected={selectedAvatar} onSelect={setSelectedAvatar} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <GameSettings settings={gameSettings} onChange={setGameSettings} />
        </TabsContent>
      </Tabs>

      <Button
        size="lg"
        className="w-full h-12 game-gradient hover:opacity-90 transition-opacity"
        onClick={handleCreateRoom}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          "Start!"
        )}
      </Button>
    </div>
  );
};
