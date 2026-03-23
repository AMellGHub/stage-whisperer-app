import { useState, useCallback, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Play, Mic, Square } from "lucide-react";

interface TextInputProps {
  text: string;
  onTextChange: (text: string) => void;
  onStart: () => void;
}

export function TextInput({ text, onTextChange, onStart }: TextInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef(text);

  const startRecording = useCallback(() => {
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;

    accumulatedRef.current = text;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interimText += event.results[i][0].transcript;
        }
      }
      const base = accumulatedRef.current;
      const separator = base && !base.endsWith(" ") ? " " : "";
      onTextChange(base + separator + (finalText + " " + interimText).trim());
    };

    recognition.onend = () => {
      // Save finalized text and restart for continuous dictation
      if (recognitionRef.current === recognition) {
        // Update accumulated with only final results
        const currentText = accumulatedRef.current;
        // Re-read latest from DOM-like state isn't possible, so we store on each final
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === "aborted") return;
      console.error("Dictation error:", e.error);
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  }, [text, onTextChange]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.onend = null;
      rec.abort();
    }
    setIsRecording(false);
  }, []);

  const isSupported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto px-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Voice<span className="text-primary">Prompter</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Paste your speech, dictate it, then read it back with voice tracking.
        </p>
      </div>

      <div className="w-full relative">
        <Textarea
          value={text}
          onChange={(e) => {
            onTextChange(e.target.value);
            accumulatedRef.current = e.target.value;
          }}
          placeholder={isRecording ? "Listening... speak now" : "Paste, type, or dictate your speech here..."}
          className={`min-h-[300px] bg-card border-border text-foreground text-base leading-relaxed resize-y focus:ring-primary transition-all ${isRecording ? "border-primary ring-1 ring-primary" : ""}`}
        />
        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 text-primary text-xs font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Recording
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {isSupported && (
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="lg"
            className="gap-2 text-lg px-6 py-6"
          >
            {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {isRecording ? "Stop" : "Dictate"}
          </Button>
        )}

        <Button
          onClick={onStart}
          disabled={!text.trim() || isRecording}
          size="lg"
          className="gap-2 text-lg px-8 py-6"
        >
          <Play className="w-5 h-5" />
          Start Prompter
        </Button>
      </div>
    </div>
  );
}
