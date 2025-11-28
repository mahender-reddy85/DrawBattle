import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface GameSettingsData {
  players: number;
  language: string;
  drawTime: number;
  rounds: number;
  wordCount: number;
  hints: number;
  customWordsOnly: boolean;
  customWords: string;
}

interface GameSettingsProps {
  settings: GameSettingsData;
  onChange: (settings: GameSettingsData) => void;
}

export const GameSettings = ({ settings, onChange }: GameSettingsProps) => {
  const updateSetting = (key: keyof GameSettingsData, value: GameSettingsData[keyof GameSettingsData]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="players">Players</Label>
          <Input
            id="players"
            type="number"
            min={2}
            max={10}
            placeholder="2-10 players"
            value={settings.players}
            onChange={(e) => updateSetting("players", parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select value={settings.language} onValueChange={(v) => updateSetting("language", v)}>
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="drawTime">Draw Time (seconds)</Label>
          <Input
            id="drawTime"
            type="number"
            min={30}
            max={120}
            placeholder="30-120 seconds"
            value={settings.drawTime}
            onChange={(e) => updateSetting("drawTime", parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rounds">Rounds</Label>
          <Input
            id="rounds"
            type="number"
            min={1}
            max={10}
            placeholder="1-10 rounds"
            value={settings.rounds}
            onChange={(e) => updateSetting("rounds", parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wordCount">Word Count</Label>
          <Input
            id="wordCount"
            type="number"
            min={1}
            max={5}
            placeholder="1-5 words"
            value={settings.wordCount}
            onChange={(e) => updateSetting("wordCount", parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hints">Hints</Label>
          <Input
            id="hints"
            type="number"
            min={0}
            max={5}
            placeholder="0-5 hints"
            value={settings.hints}
            onChange={(e) => updateSetting("hints", parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="customWordsOnly">Use custom words only</Label>
        <Switch
          id="customWordsOnly"
          checked={settings.customWordsOnly}
          onCheckedChange={(checked) => updateSetting("customWordsOnly", checked)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customWords">
          Custom words
          <span className="text-xs text-muted-foreground ml-2">
            (Minimum 10 words, 1-32 chars each, comma-separated, max 20000 chars)
          </span>
        </Label>
        <Textarea
          id="customWords"
          placeholder="apple, house, car, tree, book, flower, sun, moon, ..."
          value={settings.customWords}
          onChange={(e) => updateSetting("customWords", e.target.value)}
          className="min-h-[100px]"
          maxLength={20000}
        />
      </div>
    </div>
  );
};
