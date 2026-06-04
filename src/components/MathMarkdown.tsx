import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MathMarkdownProps {
  content: string;
  className?: string;
}

const MathMarkdown: React.FC<MathMarkdownProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-blue dark:prose-invert max-w-none prose-math ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MathMarkdown;
