import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

const LATEX_CMD = /\\(?:frac|sqrt|pm|mp|cdot|times|div|Delta|alpha|beta|gamma|theta|pi|infty|neq|leq|geq|left|right|text|mathrm|mathbf|overline|underline|sum|int|lim|log|ln|sin|cos|tan)/i;

/** Chuỗi có vẻ là công thức toán (không phải câu tiếng Việt) */
export function looksLikeMath(inner: string): boolean {
  const t = inner.trim();
  if (t.length < 2 || t.length > 600) return false;
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(t)) return false;
  if (LATEX_CMD.test(t)) return true;
  if (/\\/.test(t)) return true;
  if (/[_^]/.test(t) && /[0-9a-zA-Z=+\-*/()]/.test(t)) return true;
  return false;
}

/** AI đôi khi viết [\Delta] thay vì \Delta */
function fixAiLatexTypos(s: string): string {
  return s
    .replace(/\[\\(Delta|cdot|pm|mp|neq|leq|geq|times|div)\]/gi, '\\$1')
    .replace(/\[(Delta|cdot|pm)\]/gi, '\\$1');
}

/**
 * Chuẩn hóa mọi kiểu delimiter AI hay dùng → $...$ / $$...$$ cho remark-math + KaTeX
 */
export function normalizeMathDelimiters(text: string): string {
  if (!text?.trim()) return text ?? '';

  let s = fixAiLatexTypos(text);

  // Block TeX chuẩn \[ \]
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `\n\n$$${inner.trim()}$$\n\n`);

  // Inline TeX chuẩn \( \)
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner.trim()}$`);

  // ( công thức ) — trước [ ] để gom biểu thức dài như ([\Delta] = b^2 - 4ac...)
  s = s.replace(/\(([^()]*)\)/g, (match, inner) => {
    if (looksLikeMath(inner)) return `$${inner.trim()}$`;
    return match;
  });

  // [ công thức ] block — tránh markdown link [text](url)
  s = s.replace(/\[([\s\S]*?)\](?!\s*\()/g, (match, inner) => {
    if (looksLikeMath(inner)) return `\n\n$$${inner.trim()}$$\n\n`;
    return match;
  });

  s = s.replace(/\$\$\s*\$\$/g, '$$');

  return s;
}

const MATH_SEGMENT =
  /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$/g;

/** Render text hỗn hợp (không markdown) bằng react-katex */
export function renderMathInText(text: string): React.ReactNode {
  const normalized = normalizeMathDelimiters(text);
  if (!normalized) return null;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  MATH_SEGMENT.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = MATH_SEGMENT.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(normalized.slice(lastIndex, match.index));
    }

    const raw = match[0];
    const latex = (match[1] ?? match[2] ?? match[3] ?? match[4] ?? '').trim();
    const isBlock = match[2] !== undefined || match[3] !== undefined;

    if (!latex) {
      nodes.push(raw);
    } else {
      try {
        if (isBlock) {
          nodes.push(
            <span key={key++} className="block my-2 overflow-x-auto katex-display-wrap">
              <BlockMath math={latex} />
            </span>
          );
        } else {
          nodes.push(<InlineMath key={key++} math={latex} />);
        }
      } catch {
        nodes.push(raw);
      }
    }

    lastIndex = MATH_SEGMENT.lastIndex;
  }

  if (lastIndex < normalized.length) {
    nodes.push(normalized.slice(lastIndex));
  }

  if (nodes.length === 0) return normalized;
  if (nodes.length === 1) return nodes[0];
  return <>{nodes}</>;
}

interface MathTextProps {
  text: string;
  className?: string;
  as?: 'span' | 'p' | 'div';
}

export const MathText: React.FC<MathTextProps> = ({
  text,
  className = '',
  as: Tag = 'span',
}) => <Tag className={className}>{renderMathInText(text)}</Tag>;
