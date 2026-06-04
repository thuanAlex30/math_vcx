import React from 'react';

const PageBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen page-mesh">
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-indigo-400/15 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-cyan-400/10 blur-3xl" />
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

export default PageBackground;
