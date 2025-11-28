import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

const AVATARS = [
  { emoji: "🎨", bg: "bg-red-500" },
  { emoji: "🎭", bg: "bg-blue-500" },
  { emoji: "🎪", bg: "bg-green-500" },
  { emoji: "🎯", bg: "bg-yellow-500" },
  { emoji: "🎸", bg: "bg-purple-500" },
  { emoji: "🎮", bg: "bg-pink-500" },
  { emoji: "🎲", bg: "bg-orange-500" },
  { emoji: "🎺", bg: "bg-cyan-500" },
  { emoji: "🎹", bg: "bg-indigo-500" },
  { emoji: "🎪", bg: "bg-teal-500" },
];

interface AvatarSelectorProps {
  selected: number;
  onSelect: (index: number) => void;
}

export const AvatarSelector = ({ selected, onSelect }: AvatarSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label>Choose Avatar</Label>
      <div className="grid grid-cols-5 gap-3">
        {AVATARS.map((avatar, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`transition-all ${
              selected === index ? "scale-110 ring-2 ring-primary rounded-full" : ""
            }`}
          >
            <Avatar className={`w-12 h-12 ${avatar.bg}`}>
              <AvatarFallback className={`${avatar.bg} text-2xl border-2 border-background`}>
                {avatar.emoji}
              </AvatarFallback>
            </Avatar>
          </button>
        ))}
      </div>
    </div>
  );
};
