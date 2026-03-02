'use client';

import React, { useState } from 'react';

interface ShareState {
  code: string;
  engine: 'mermaid' | 'plantuml';
  theme: string;
  tuning?: {
    primaryColor?: string;
    fontFamily?: string;
    fontSize?: number;
    lineWidth?: number;
    backgroundColor?: string;
  };
}

interface ShareButtonProps {
  getState: () => ShareState;
}

export default function ShareButton({ getState }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      const state = getState();
      const { generateShareUrl } = await import('../lib/share/urlEncoder');
      const url = generateShareUrl(state);
      
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setError(null);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy');
      setCopied(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </>
      )}
      {error && <span className="text-red-300 ml-2">{error}</span>}
    </button>
  );
}
