import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { normalizeMathDelimiters } from '../utils/mathRender';

interface MathMarkdownProps {
  content: string;
  className?: string;
}

const MathMarkdown: React.FC<MathMarkdownProps> = ({ content, className = '' }) => {
  const prepared = useMemo(() => normalizeMathDelimiters(content), [content]);

  return (
    <div
      className={`prose prose-blue dark:prose-invert max-w-none prose-math katex-content ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {prepared}
      </ReactMarkdown>
    </div>
  );
};

export default MathMarkdown;
