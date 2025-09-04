import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = ({ content, className = "" }: MarkdownRendererProps) => {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <MDEditor.Markdown 
        source={content}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
};

export default MarkdownRenderer;