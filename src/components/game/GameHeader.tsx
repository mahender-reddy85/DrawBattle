import { Clock, LogOut, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface GameHeaderProps {
  roomCode: string;
  timeLeft: number;
  currentWord: string;
  isDrawer: boolean;
  onLeave: () => void;
}

export const GameHeader = ({
  roomCode,
  timeLeft,
  currentWord,
  isDrawer,
  onLeave,
}: GameHeaderProps) => {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="border-b border-border bg-card shadow-card">
      <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
        {/* Left - Room Code */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">Room Code:</div>
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <span className="text-2xl font-bold tracking-wider">{roomCode}</span>
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Center - Word/Timer */}
        <div className="flex items-center gap-4">
          {currentWord && (
            <div className="px-6 py-2 rounded-lg bg-primary/20 border border-primary">
              <p className="text-sm text-muted-foreground">
                {isDrawer ? "Your word:" : "Guess the word"}
              </p>
              <p className="text-2xl font-bold text-primary">
                {isDrawer ? currentWord : "_ ".repeat(currentWord.length)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 border border-accent">
            <Clock className="w-5 h-5 text-accent" />
            <span className="text-2xl font-bold text-accent">{timeLeft}s</span>
          </div>
        </div>

        {/* Right - Leave Button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={onLeave}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Leave
        </Button>
      </div>
    </header>
  );
};
