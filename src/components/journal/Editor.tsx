"use client";

import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Quote,
} from "lucide-react";

interface EditorProps {
  initialContentJSON: JSONContent | null;
  onSave: (contentJSON: JSONContent, contentText: string) => void;
}

/** Validate Tiptap JSON so malformed/empty stored content doesn't crash the editor. */
function sanitizeContent(raw: JSONContent | null): JSONContent {
  if (!raw || typeof raw !== "object" || raw.type !== "doc") {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  return raw;
}

export default function Editor({ initialContentJSON, onSave }: EditorProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    // REQUIRED for Next.js App Router — prevents SSR/client hydration mismatch
    immediatelyRender: false,
    content: sanitizeContent(initialContentJSON),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[180px] text-xs text-ink-text leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();

      // Debounced autosave (1 s)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onSave(json, text);
      }, 1000);
    },
  });

  // Cleanup: flush pending save and destroy editor to prevent double-mount leaks
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      editor?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!editor) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-ink-soft animate-pulse">
        Initializing Rich Text Editor…
      </div>
    );
  }

  return (
    <div className="border border-border/80 rounded-2xl bg-surface-glass/30 overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-sakura-deep/20 transition-all">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-surface-glass/60 border-b border-border/70">

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("bold")
              ? "bg-sakura-deep/15 text-sakura-deep"
              : "hover:bg-border/20 text-ink-soft"
          }`}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("italic")
              ? "bg-sakura-deep/15 text-sakura-deep"
              : "hover:bg-border/20 text-ink-soft"
          }`}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-border/40 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("heading", { level: 2 })
              ? "bg-sakura-deep/15 text-sakura-deep"
              : "hover:bg-border/20 text-ink-soft"
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("heading", { level: 3 })
              ? "bg-sakura-deep/15 text-sakura-deep"
              : "hover:bg-border/20 text-ink-soft"
          }`}
          title="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-border/40 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("bulletList")
              ? "bg-sakura-deep/15 text-sakura-deep"
              : "hover:bg-border/20 text-ink-soft"
          }`}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("blockquote")
              ? "bg-sakura-deep/15 text-sakura-deep"
              : "hover:bg-border/20 text-ink-soft"
          }`}
          title="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>

      </div>

      {/* Content area — only mounted when editor is ready */}
      <div className="p-4 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

    </div>
  );
}
