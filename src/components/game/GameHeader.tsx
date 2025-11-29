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
    <header className="hand-drawn-border bg-[hsl(220_20%_15%)] scribbly-card shadow-cartoon">
      <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
        {/* Left - Room Code */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground font-bold">Room Code:</div>
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-4 py-2 pill-shape bg-muted hover:bg-muted/80 transition-colors hand-drawn-border"
          >
            <span className="text-2xl font-bold tracking-wider text-foreground">{roomCode}</span>
            {copied ? (
              <Check className="w-4 h-4 text-success drawn-icon" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground drawn-icon" />
            )}
          </button>
        </div>

        {/* Center - Word/Timer */}
        <div className="flex items-center gap-4">
          {currentWord && (
            <div className="px-6 py-2 pill-shape bg-primary/20 hand-drawn-border">
              <p className="text-sm text-muted-foreground">
                {isDrawer ? "Your word:" : "Guess the word"}
              </p>
              <p className="text-2xl font-bold text-primary">
                {isDrawer ? currentWord : "_ ".repeat(currentWord.length)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pill-shape bg-accent/20 hand-drawn-border">
            <svg className="w-5 h-5 text-accent drawn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-2xl font-bold text-accent">{timeLeft}s</span>
          </div>
        </div>

        {/* Right - Leave Button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={onLeave}
          className="gap-2 pill-shape hand-drawn-border"
        >
          <LogOut className="w-4 h-4 drawn-icon" />
          Leave
        </Button>
      </div>
    </header>
  );
};
