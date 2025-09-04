import React from 'react';
import MDEditor from '@uiw/react-md-editor';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = ({ content, className = "" }: MarkdownRendererProps) => {
  return (
    <div className={`markdown-content ${className}`} data-color-mode="auto">
      <MDEditor.Markdown 
        source={content} 
        style={{ 
          backgroundColor: 'transparent',
          color: 'inherit'
        }}
      />
    </div>
  );
};

export default MarkdownRenderer;