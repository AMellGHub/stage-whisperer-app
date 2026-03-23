import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface TextInputProps {
  text: string;
  onTextChange: (text: string) => void;
  onStart: () => void;
}

export function TextInput({ text, onTextChange, onStart }: TextInputProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto px-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Voice<span className="text-primary">Prompter</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Paste your speech, hit start, and read naturally — the text follows your voice.
        </p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste or type your speech here..."
        className="min-h-[300px] bg-card border-border text-foreground text-base leading-relaxed resize-y focus:ring-primary"
      />

      <Button
        onClick={onStart}
        disabled={!text.trim()}
        size="lg"
        className="gap-2 text-lg px-8 py-6"
      >
        <Play className="w-5 h-5" />
        Start Prompter
      </Button>
    </div>
  );
}
