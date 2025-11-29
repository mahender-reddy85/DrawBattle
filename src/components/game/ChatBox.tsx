import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Message } from "@/pages/GameRoom";

interface ChatBoxProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isDrawer: boolean;
}

export const ChatBox = ({ messages, onSendMessage, isDrawer }: ChatBoxProps) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="sketchy-card rounded-2xl p-4 shadow-cartoon h-full flex flex-col hand-drawn-border">
      <h2 className="text-xl font-bold mb-4">
        {isDrawer ? "Chat" : "Guess the word!"}
      </h2>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded-xl hand-drawn-border ${
              msg.isCorrect
                ? "bg-success/20"
                : "bg-muted/50"
            }`}
          >
            <p className="text-sm">
              <span className="font-semibold text-primary">
                {msg.username}:
              </span>{" "}
              <span className={msg.isCorrect ? "text-success font-medium" : ""}>
                {msg.message}
              </span>
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {isDrawer
              ? "Players will guess here..."
              : "Start guessing!"}
          </div>
        )}
      </div>

      {/* Input */}
      {!isDrawer && (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your guess here..."
            className="flex-1 pill-shape hand-drawn-border"
            maxLength={50}
          />
          <Button
            onClick={handleSend}
            className="game-gradient pill-shape hand-drawn-border"
            disabled={!input.trim()}
          >
            <svg className="w-4 h-4 drawn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>
      )}

      {isDrawer && (
        <div className="text-sm text-muted-foreground text-center py-2">
          You're drawing! Others are guessing...
        </div>
      )}
    </div>
  );
};
