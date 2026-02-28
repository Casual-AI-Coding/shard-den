'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface PreviewProps {
  code: string;
  theme: string;
  engine: 'mermaid' | 'plantuml';
}

export default function Preview({ code, theme, engine }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (engine === 'mermaid') {
      mermaid.render('mermaid-preview', code)
        .then(({ svg }) => {
          setSvg(svg);
          setError(null);
        })
        .catch((err) => {
          setError(err.message);
        });
    }
  }, [code, theme, engine]);

  if (error) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full p-4 overflow-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
