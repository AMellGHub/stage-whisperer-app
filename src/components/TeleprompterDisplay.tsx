import { useEffect, useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, RotateCcw, ChevronDown, ChevronUp, Play, Pause } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { findMatchPosition } from "@/lib/textMatcher";

interface TeleprompterDisplayProps {
  text: string;
  onExit: () => void;
  audioUrl?: string;
}

export function TeleprompterDisplay({ text, onExit }: TeleprompterDisplayProps) {
  const words = text.split(/\s+/).filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontSize, setFontSize] = useState(2.5); // rem
  const containerRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);
  const lastMatchRef = useRef(0);

  const handleSpeechResult = useCallback(
    (transcript: string) => {
      const spokenWords = transcript.split(/\s+/).filter(Boolean);
      const newIndex = findMatchPosition(words, spokenWords, lastMatchRef.current);
      if (newIndex > lastMatchRef.current) {
        lastMatchRef.current = newIndex;
        setCurrentIndex(newIndex);
      }
    },
    [words]
  );

  const { isListening, isSupported, start, stop } = useSpeechRecognition({
    onResult: handleSpeechResult,
  });

  // Auto-start listening
  useEffect(() => {
    if (isSupported) {
      start();
    }
  }, [isSupported, start]);

  // Scroll current word into view
  useEffect(() => {
    if (currentWordRef.current) {
      currentWordRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentIndex]);

  const handleReset = () => {
    lastMatchRef.current = 0;
    setCurrentIndex(0);
  };

  const handleManualAdvance = () => {
    const next = Math.min(currentIndex + 3, words.length);
    lastMatchRef.current = next;
    setCurrentIndex(next);
  };

  const handleManualRewind = () => {
    const prev = Math.max(currentIndex - 3, 0);
    lastMatchRef.current = prev;
    setCurrentIndex(prev);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        handleManualAdvance();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleManualRewind();
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 bg-teleprompter-bg flex flex-col">
      {/* Top controls */}
      <div className="flex items-center justify-between px-6 py-3 bg-card/80 backdrop-blur border-b border-border z-10">
        <Button variant="ghost" onClick={onExit} className="text-muted-foreground">
          ← Exit
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">
            {currentIndex}/{words.length} words
          </span>

          <Button variant="outline" size="icon" onClick={() => setFontSize(f => Math.max(1.5, f - 0.25))}>
            <span className="text-xs font-bold">A-</span>
          </Button>
          <Button variant="outline" size="icon" onClick={() => setFontSize(f => Math.min(5, f + 0.25))}>
            <span className="text-xs font-bold">A+</span>
          </Button>

          <Button variant="outline" size="icon" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            variant={isListening ? "default" : "outline"}
            size="icon"
            onClick={isListening ? stop : start}
            disabled={!isSupported}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Text display */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-8 md:px-16 lg:px-32 py-20"
      >
        <div className="max-w-4xl mx-auto leading-relaxed" style={{ fontSize: `${fontSize}rem`, lineHeight: 1.6 }}>
          {words.map((word, i) => {
            let colorClass = "text-teleprompter-upcoming";
            if (i < currentIndex) colorClass = "text-teleprompter-spoken";
            else if (i === currentIndex) colorClass = "text-teleprompter-current font-semibold";

            return (
              <span
                key={i}
                ref={i === currentIndex ? currentWordRef : undefined}
                className={`${colorClass} transition-colors duration-200 cursor-pointer hover:opacity-80`}
                onClick={() => {
                  lastMatchRef.current = i;
                  setCurrentIndex(i);
                }}
              >
                {word}{" "}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom manual controls */}
      <div className="flex justify-center gap-4 px-6 py-3 bg-card/80 backdrop-blur border-t border-border">
        <Button variant="outline" size="sm" onClick={handleManualRewind} className="gap-1">
          <ChevronUp className="w-4 h-4" /> Rewind
        </Button>
        <Button variant="outline" size="sm" onClick={handleManualAdvance} className="gap-1">
          Advance <ChevronDown className="w-4 h-4" />
        </Button>
        {!isSupported && (
          <span className="text-xs text-destructive self-center">
            Speech recognition not supported in this browser
          </span>
        )}
      </div>
    </div>
  );
}
