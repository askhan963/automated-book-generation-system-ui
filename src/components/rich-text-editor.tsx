import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo2,
  Redo2,
} from "lucide-react";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  readOnly = false,
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const execCommand = (command: string, value?: string) => {
    if (readOnly) return;
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateValue();
  };

  const updateValue = () => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      onChange(newValue);
      
      // Update history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newValue);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange(history[newIndex]);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange(history[newIndex]);
      }
    }
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/30 p-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => execCommand("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => execCommand("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-px bg-border" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => execCommand("insertUnorderedList")}
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => execCommand("insertOrderedList")}
            title="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="w-px bg-border" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => execCommand("formatBlock", "<h2>")}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => execCommand("formatBlock", "<h1>")}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <div className="w-px bg-border" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={updateValue}
        suppressContentEditableWarning
        className={`min-h-96 rounded-xl border border-border bg-card p-6 font-serif text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/50 ${
          readOnly ? "cursor-default" : "cursor-text"
        }`}
        style={{
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
      >
        {!value && !readOnly && (
          <span className="pointer-events-none text-muted-foreground">
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}
