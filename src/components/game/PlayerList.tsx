import { Crown, Palette } from "lucide-react";
import { Player } from "@/pages/GameRoom";

interface PlayerListProps {
  players: Player[];
}

export const PlayerList = ({ players }: PlayerListProps) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="sketchy-card rounded-2xl p-4 shadow-cartoon h-full hand-drawn-border">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 doodle-crown">
        <svg className="w-5 h-5 text-accent drawn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 9.5C3.3 8.8 5.2 8.2 7 8c1.8 0 3.4.7 4.5 1.8.6.6 1 1.4 1 2.3v3c0 .8-.4 1.6-1 2.1-1.1 1-2.7 1.6-4.5 1.6-1.8 0-3.3-.6-4.5-1.6-.6-.5-1-1.3-1-2.1v-3c0-.9.4-1.7 1-2.3zM12 19c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0-18c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="currentColor"/>
        </svg>
        Players ({players.length})
      </h2>

      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`p-3 rounded-xl flex items-center justify-between transition-colors hand-drawn-border ${
              player.isDrawer
                ? "bg-primary/20"
                : "bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="drawn-avatar w-10 h-10 flex items-center justify-center text-primary-foreground font-bold relative">
                  <span className="relative z-10">{player.username.charAt(0).toUpperCase()}</span>
                </div>
                {player.isDrawer && (
                  <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1 hand-drawn-border">
                    <svg className="w-3 h-3 text-accent-foreground drawn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L13.09 8.26L22 9L12 16L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium flex items-center gap-2">
                  #{index + 1} {player.username}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{player.score}</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
          </div>
        ))}

        {players.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Waiting for players...
          </div>
        )}
      </div>
    </div>
  );
};
