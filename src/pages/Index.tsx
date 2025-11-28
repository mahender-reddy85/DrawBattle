
import { useState } from "react";
import { CreateRoom } from "@/components/game/CreateRoom";
import { JoinRoom } from "@/components/game/JoinRoom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const [mode, setMode] = useState<"home" | "create" | "join">("home");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <ThemeToggle />
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] -z-10 animate-pulse" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
              DrawBattle
            </h1>
            <p className="text-muted-foreground text-lg">
              Draw, Guess & Battle with Friends
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="card-gradient rounded-3xl p-8 shadow-card border border-border">
          {mode === "home" && (
            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full h-14 text-lg font-semibold game-gradient hover:opacity-90 transition-opacity"
                onClick={() => setMode("create")}
              >
                Create Room
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 text-lg font-semibold border-2"
                onClick={() => setMode("join")}
              >
                Join Room
              </Button>
            </div>
          )}

          {mode === "create" && <CreateRoom onBack={() => setMode("home")} />}
          {mode === "join" && <JoinRoom onBack={() => setMode("home")} />}
        </div>
      </div>
    </div>
  );
};

export default Index;
