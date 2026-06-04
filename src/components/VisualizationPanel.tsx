import React, { useEffect, useRef } from 'react';
import type { VisualizationData } from '../types';
import { LineChart, Shapes, ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: new (el: HTMLElement, opts?: object) => {
        setExpression: (e: { id: string; latex: string }) => void;
        destroy: () => void;
      };
    };
  }
}

interface VisualizationPanelProps {
  visualization: VisualizationData | null;
}

const DESMOS_SCRIPT = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1d9eb431df79214167d';

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({ visualization }) => {
  const desmosRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!visualization || visualization.visualization !== 'graph' || !desmosRef.current) return;

    const expr =
      visualization.data.latex ||
      visualization.data.expression ||
      'y=x^2';

    const latex = expr.startsWith('y=') || expr.includes('=') ? expr : `y=${expr}`;

    const init = () => {
      if (!window.Desmos || !desmosRef.current) return;
      calcRef.current?.destroy();
      const calc = new window.Desmos.GraphingCalculator(desmosRef.current, {
        expressions: true,
        keypad: false,
        settingsMenu: false,
        zoomButtons: true,
      });
      calc.setExpression({ id: 'main', latex });
      if (visualization.data.roots?.length) {
        visualization.data.roots.forEach((r, i) => {
          calc.setExpression({ id: `root${i}`, latex: `x=${r}` });
        });
      }
      calcRef.current = calc;
    };

    if (window.Desmos) {
      init();
    } else {
      const script = document.createElement('script');
      script.src = DESMOS_SCRIPT;
      script.async = true;
      script.onload = init;
      document.body.appendChild(script);
    }

    return () => {
      calcRef.current?.destroy();
      calcRef.current = null;
    };
  }, [visualization]);

  if (!visualization) {
    return (
      <div className="card p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <LineChart className="w-8 h-8 text-slate-400" />
        </div>
        <p className="font-medium text-slate-600 dark:text-slate-400">Chưa có minh họa</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          Đồ thị Desmos hoặc hình học sẽ tự hiện khi bài có hàm số / hình vẽ
        </p>
      </div>
    );
  }

  if (visualization.visualization === 'graph') {
    return (
      <div className="card p-4 overflow-hidden">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <LineChart className="w-5 h-5" />
          Đồ thị hàm số (Desmos)
        </h3>
        <div ref={desmosRef} className="w-full h-[320px] rounded-xl border border-gray-200 dark:border-gray-700" />
      </div>
    );
  }

  if (visualization.visualization === 'geometry') {
    const sides = visualization.data.sides || [3, 4, 5];
    const scale = 40;
    const ax = 20;
    const ay = 200;
    const bx = ax + sides[0] * scale;
    const by = ay;
    const cx = ax;
    const cy = ay - sides[1] * scale;

    return (
      <div className="card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-indigo-600">
          <Shapes className="w-5 h-5" />
          Hình minh họa
        </h3>
        <svg viewBox="0 0 280 220" className="w-full max-h-[280px] bg-slate-50 dark:bg-gray-800 rounded-xl">
          <polygon
            points={`${ax},${ay} ${bx},${by} ${cx},${cy}`}
            fill="rgba(37,99,235,0.15)"
            stroke="#2563eb"
            strokeWidth="2"
          />
          <text x={(ax + bx) / 2} y={ay + 18} fontSize="12" fill="currentColor" textAnchor="middle">
            {sides[0]}
          </text>
          <text x={ax - 14} y={(ay + cy) / 2} fontSize="12" fill="currentColor">
            {sides[1]}
          </text>
        </svg>
        <p className="text-xs text-gray-500 mt-2 text-center">
          GeoGebra: mở{' '}
          <a
            href="https://www.geogebra.org/geometry"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            geogebra.org/geometry
          </a>{' '}
          để chỉnh sửa tương tác
        </p>
      </div>
    );
  }

  if (visualization.visualization === 'vector') {
    return (
      <div className="card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          Vector
        </h3>
        <svg viewBox="0 0 200 200" className="w-full h-48">
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#2563eb" />
            </marker>
          </defs>
          <line x1="20" y1="180" x2="180" y2="180" stroke="#94a3b8" strokeWidth="1" />
          <line x1="20" y1="20" x2="20" y2="180" stroke="#94a3b8" strokeWidth="1" />
          <line
            x1="100"
            y1="100"
            x2="160"
            y2="60"
            stroke="#2563eb"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
        </svg>
      </div>
    );
  }

  return null;
};

export default VisualizationPanel;
