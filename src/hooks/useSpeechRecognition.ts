import { useState, useRef, useCallback, useEffect } from "react";

interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  continuous?: boolean;
}

export function useSpeechRecognition({ onResult, continuous = true }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const w = window as any;
    setIsSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const stop = useCallback(() => {
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const w = window as any;
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    stop();

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      onResult((final + " " + interim).trim());
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        // Auto-restart for continuous listening
        restartTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current === recognition) {
            try { recognition.start(); } catch {}
          }
        }, 100);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        stop();
      }
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    try { recognition.start(); } catch {}
  }, [continuous, onResult, stop]);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { isListening, isSupported, start, stop };
}
