import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Play, Edit3, Plus, BookOpen, Headphones, Mic } from "lucide-react";
import { Speech, deleteSpeech } from "@/lib/speechStorage";
import { toast } from "@/hooks/use-toast";

interface SpeechLibraryProps {
  speeches: Speech[];
  onSelect: (speech: Speech) => void;
  onPlay: (speech: Speech) => void;
  onNew: () => void;
  onRefresh: () => void;
}

export function SpeechLibrary({ speeches, onSelect, onPlay, onNew, onRefresh }: SpeechLibraryProps) {
  const [search, setSearch] = useState("");

  const filtered = speeches.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.text.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Delete "${title}"?`)) {
      deleteSpeech(id);
      onRefresh();
      toast({ title: "Deleted", description: `"${title}" has been removed.` });
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Saved Speeches</h2>
        </div>
        <Button onClick={onNew} className="gap-2">
          <Plus className="w-4 h-4" />
          New Speech
        </Button>
      </div>

      {speeches.length > 3 && (
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search speeches..."
          className="bg-card border-border"
        />
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {speeches.length === 0 ? (
            <p>No saved speeches yet. Create your first one!</p>
          ) : (
            <p>No speeches match your search.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((speech) => (
            <Card
              key={speech.id}
              className="p-4 bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => onSelect(speech)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{speech.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {speech.text.slice(0, 150)}
                    {speech.text.length > 150 && "..."}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{wordCount(speech.text)} words</span>
                    <span>Updated {formatDate(speech.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {speech.audioUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(speech);
                      }}
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      Listen
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(speech);
                    }}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Practice
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(speech.id, speech.title);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
