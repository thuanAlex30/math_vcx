import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MathContentProps {
  text: string;
  className?: string;
  /** Đặt true cho nội dung inline (option labels, câu hỏi ngắn) — bỏ prose wrapper */
  inline?: boolean;
}

/**
 * Component thống nhất để render text có LaTeX.
 * Ưu tiên dùng component này thay cho MathText (mathRender.tsx).
 *
 * Trình tự xử lý:
 * 1. Chuẩn hóa delimiter: \(...\) → $, \[...\] → $$, [\Delta] → \Delta
 * 2. remark-math + rehype-katex render reliably mọi LaTeX
 */
export function normalizeMathText(text: string): string {
  if (!text?.trim()) return text ?? '';

  let s = text;

  // [\Delta] [=] [\cdot] → \Delta \= \cdot (AI viết nhầm)
  s = s.replace(/\[\\(Delta|cdot|pm|mp|neq|leq|geq|times|div)\]/gi, '\\$1');
  s = s.replace(/\[(Delta|cdot|pm|neq|leq|geq)\]/gi, '\\$1');

  // Chuẩn hóa \[ ... \] → $$...$$
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `\n\n$$${inner.trim()}$$\n\n`);

  // Chuẩn hóa \( ... \) → $...$
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner.trim()}$`);

  return s;
}

/**
 * Inline math wrapper — render plain text với KaTeX inline, không có prose wrapper.
 * Dùng cho option labels, câu hỏi ngắn trong practice/exam mode.
 */
export const MathInline: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const prepared = useMemo(() => normalizeMathText(text), [text]);

  return (
    <span className={`math-inline ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          p: ({ children }: any) => <span>{children}</span>,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          div: ({ children }: any) => <span>{children}</span>,
          // KaTeX renders as <span class="katex">...</span>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        }}
      >
        {prepared}
      </ReactMarkdown>
    </span>
  );
};

/**
 * Full math content — render text có markdown + LaTeX, có prose styling.
 * Dùng cho lời giải, chat, giải thích.
 */
export const MathContent: React.FC<MathContentProps> = ({ text, className = '', inline = false }) => {
  if (inline) {
    return <MathInline text={text} className={className} />;
  }

  const prepared = useMemo(() => normalizeMathText(text), [text]);

  return (
    <div className={`prose prose-blue dark:prose-invert max-w-none prose-math katex-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {prepared}
      </ReactMarkdown>
    </div>
  );
};

export default MathContent;
