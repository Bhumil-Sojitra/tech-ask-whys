import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import * as commands from '@uiw/react-md-editor/commands';
import '@uiw/react-md-editor/markdown-editor.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  preview?: 'edit' | 'live' | 'preview';
}

const MarkdownEditor = ({ 
  value, 
  onChange, 
  placeholder = "Write your content here...",
  height = 200,
  preview = 'live'
}: MarkdownEditorProps) => {
  return (
    <div className="markdown-editor">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        preview={preview}
        height={height}
        textareaProps={{
          placeholder,
          style: {
            fontSize: 14,
            lineHeight: 1.5,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          }
        }}
        commands={[
          // Basic formatting
          commands.bold,
          commands.italic,
          commands.strikethrough,
          commands.hr,
          // Lists and structure
          commands.title,
          commands.divider,
          commands.link,
          commands.quote,
          commands.code,
          commands.codeBlock,
          // Lists
          commands.unorderedListCommand,
          commands.orderedListCommand,
          commands.checkedListCommand,
          // Tables and media
          commands.table,
          commands.divider,
          // Preview controls
          commands.fullscreen,
        ]}
      />
      <style>{`
        .w-md-editor {
          background-color: hsl(var(--background));
        }
        .w-md-editor.w-md-editor-dark {
          background-color: hsl(var(--background));
        }
        .w-md-editor-text-container .w-md-editor-text {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
        }
        .w-md-editor-text-container .w-md-editor-text:focus {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
        }
        .w-md-editor-preview {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
        }
        .wmde-markdown {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .wmde-markdown h1,
        .wmde-markdown h2,
        .wmde-markdown h3,
        .wmde-markdown h4,
        .wmde-markdown h5,
        .wmde-markdown h6 {
          color: hsl(var(--foreground));
        }
        .wmde-markdown pre {
          background-color: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
        }
        .wmde-markdown code {
          background-color: hsl(var(--muted));
          color: hsl(var(--foreground));
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
        }
        .wmde-markdown blockquote {
          border-left: 4px solid hsl(var(--border));
          background-color: hsl(var(--muted));
          color: hsl(var(--muted-foreground));
        }
        .wmde-markdown table {
          border: 1px solid hsl(var(--border));
        }
        .wmde-markdown th,
        .wmde-markdown td {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem;
        }
        .wmde-markdown th {
          background-color: hsl(var(--muted));
          font-weight: 600;
        }
        .w-md-editor-toolbar {
          background-color: hsl(var(--background));
          border-bottom: 1px solid hsl(var(--border));
        }
        .w-md-editor-toolbar button {
          color: hsl(var(--foreground));
        }
        .w-md-editor-toolbar button:hover {
          background-color: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
      `}</style>
    </div>
  );
};

export default MarkdownEditor;