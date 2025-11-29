import { Crown, Palette } from "lucide-react";
import { Player } from "@/pages/GameRoom";

interface PlayerListProps {
  players: Player[];
}

export const PlayerList = ({ players }: PlayerListProps) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="card-gradient rounded-2xl p-4 shadow-card border border-border h-full">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Crown className="w-5 h-5 text-accent" />
        Players ({players.length})
      </h2>

      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`p-3 rounded-xl flex items-center justify-between transition-colors ${
              player.isDrawer
                ? "bg-primary/20 border border-primary"
                : "bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
                  {player.username.charAt(0).toUpperCase()}
                </div>
                {player.isDrawer && (
                  <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1">
                    <Palette className="w-3 h-3 text-accent-foreground" />
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
