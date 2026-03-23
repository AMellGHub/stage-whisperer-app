import { useState, useCallback, useEffect } from "react";
import { TextInput } from "@/components/TextInput";
import { TeleprompterDisplay } from "@/components/TeleprompterDisplay";
import { SpeechLibrary } from "@/components/SpeechLibrary";
import { Speech, loadAllSpeeches, saveSpeech, updateSpeech } from "@/lib/speechStorage";
import { toast } from "@/hooks/use-toast";

type View = "editor" | "prompter" | "library";

const Index = () => {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<View>("editor");
  const [speeches, setSpeeches] = useState<Speech[]>([]);

  const refreshSpeeches = useCallback(() => {
    setSpeeches(loadAllSpeeches());
  }, []);

  useEffect(() => {
    refreshSpeeches();
  }, [refreshSpeeches]);

  const handleSave = () => {
    if (!text.trim()) return;
    const speechTitle = title.trim() || `Speech ${new Date().toLocaleDateString()}`;

    if (editingId) {
      updateSpeech(editingId, { title: speechTitle, text });
      toast({ title: "Updated", description: `"${speechTitle}" has been saved.` });
    } else {
      const saved = saveSpeech({ title: speechTitle, text });
      setEditingId(saved.id);
      toast({ title: "Saved", description: `"${speechTitle}" has been saved.` });
    }
    setTitle(speechTitle);
    refreshSpeeches();
  };

  const handleSelectSpeech = (speech: Speech) => {
    setText(speech.text);
    setTitle(speech.title);
    setEditingId(speech.id);
    setView("editor");
  };

  const handleNew = () => {
    setText("");
    setTitle("");
    setEditingId(null);
    setView("editor");
  };

  if (view === "prompter" && text.trim()) {
    return (
      <TeleprompterDisplay
        text={text}
        onExit={() => setView("editor")}
      />
    );
  }

  if (view === "library") {
    return (
      <div className="min-h-screen bg-background flex items-start justify-center py-12">
        <SpeechLibrary
          speeches={speeches}
          onSelect={handleSelectSpeech}
          onNew={handleNew}
          onRefresh={refreshSpeeches}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <TextInput
        text={text}
        title={title}
        onTextChange={setText}
        onTitleChange={setTitle}
        onStart={() => setView("prompter")}
        onSave={handleSave}
        onShowLibrary={() => setView("library")}
        isEditing={!!editingId}
      />
    </div>
  );
};

export default Index;
