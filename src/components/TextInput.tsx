import { useState, useCallback, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Play, Mic, Square, Upload, Loader2, Camera, Save, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TextInputProps {
  text: string;
  title: string;
  onTextChange: (text: string) => void;
  onTitleChange: (title: string) => void;
  onStart: () => void;
  onSave: () => void;
  onShowLibrary: () => void;
  isEditing: boolean;
}

export function TextInput({ text, title, onTextChange, onTitleChange, onStart, onSave, onShowLibrary, isEditing }: TextInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState("");
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef(text);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      if (recognitionRef.current === recognition) {
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

  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    e.target.value = "";

    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Please upload an audio file under 20MB." });
      return;
    }

    setIsProcessing(true);
    setProcessingLabel("Transcribing audio...");
    try {
      const formData = new FormData();
      formData.append("audio", file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Transcription failed" }));
        throw new Error(err.error || `Transcription failed (${response.status})`);
      }

      const { text: transcribedText } = await response.json();

      if (transcribedText) {
        const separator = text && !text.endsWith("\n") ? "\n\n" : "";
        onTextChange(text + separator + transcribedText);
        accumulatedRef.current = text + separator + transcribedText;
        toast({ title: "Transcription complete", description: "Your recording has been added to the text." });
      } else {
        toast({ variant: "destructive", title: "No speech detected", description: "The recording didn't contain recognizable speech." });
      }
    } catch (err: any) {
      console.error("Transcription error:", err);
      toast({ variant: "destructive", title: "Transcription failed", description: err.message || "Could not transcribe the audio file." });
    } finally {
      setIsProcessing(false);
    }
  }, [text, onTextChange]);

  const handleImageImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Please upload an image under 20MB." });
      return;
    }

    setIsProcessing(true);
    setProcessingLabel("Extracting text from image...");
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-text-from-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Text extraction failed" }));
        throw new Error(err.error || `Text extraction failed (${response.status})`);
      }

      const { text: extractedText } = await response.json();

      if (extractedText) {
        const separator = text && !text.endsWith("\n") ? "\n\n" : "";
        onTextChange(text + separator + extractedText);
        accumulatedRef.current = text + separator + extractedText;
        toast({ title: "Text extracted", description: "Text from the image has been added." });
      } else {
        toast({ variant: "destructive", title: "No text found", description: "Couldn't find readable text in the image." });
      }
    } catch (err: any) {
      console.error("OCR error:", err);
      toast({ variant: "destructive", title: "Text extraction failed", description: err.message || "Could not extract text from the image." });
    } finally {
      setIsProcessing(false);
    }
  }, [text, onTextChange]);

  const isSupported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto px-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Voice<span className="text-primary">Prompter</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Paste, dictate, import audio, or snap a photo of your speech.
        </p>
      </div>

      <div className="w-full relative">
        <Textarea
          value={text}
          onChange={(e) => {
            onTextChange(e.target.value);
            accumulatedRef.current = e.target.value;
          }}
          placeholder={isRecording ? "Listening... speak now" : isProcessing ? processingLabel : "Paste, type, dictate, or import..."}
          className={`min-h-[300px] bg-card border-border text-foreground text-base leading-relaxed resize-y focus:ring-primary transition-all ${isRecording ? "border-primary ring-1 ring-primary" : ""}`}
          disabled={isProcessing}
        />
        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 text-primary text-xs font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Recording
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-md">
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">{processingLabel}</span>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.webm"
        onChange={handleFileImport}
        className="hidden"
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageImport}
        className="hidden"
      />

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => imageInputRef.current?.click()}
          variant="outline"
          size="lg"
          className="gap-2 text-lg px-6 py-6"
          disabled={isRecording || isProcessing}
        >
          <Camera className="w-5 h-5" />
          Photo
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="lg"
          className="gap-2 text-lg px-6 py-6"
          disabled={isRecording || isProcessing}
        >
          <Upload className="w-5 h-5" />
          Import
        </Button>

        {isSupported && (
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="lg"
            className="gap-2 text-lg px-6 py-6"
            disabled={isProcessing}
          >
            {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {isRecording ? "Stop" : "Dictate"}
          </Button>
        )}

        <Button
          onClick={onStart}
          disabled={!text.trim() || isRecording || isProcessing}
          size="lg"
          className="gap-2 text-lg px-8 py-6"
        >
          <Play className="w-5 h-5" />
          Start
        </Button>
      </div>
    </div>
  );
}
