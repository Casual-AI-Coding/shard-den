'use client';

import { useState, useCallback, useEffect } from 'react';
import { initWasm, JsonExtractor } from '@/lib/core';

// Icons as SVG components
const CodeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const ArrowPathIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BeakerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

export default function JsonExtractorPage() {
  const [input, setInput] = useState('');
  const [paths, setPaths] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [format, setFormat] = useState('json');
  const [isLoading, setIsLoading] = useState(true);
  const [extractor, setExtractor] = useState<any>(null);

  useEffect(() => {
    initWasm()
      .then(() => JsonExtractor.create())
      .then((ex) => {
        setExtractor(ex);
        setIsLoading(false);
      })
      .catch((e) => {
        setError('Failed to load WASM: ' + (e instanceof Error ? e.message : String(e)));
        setIsLoading(false);
      });
  }, []);

  const handleExtract = useCallback(async () => {
    setError('');
    setOutput('');

    if (!input.trim()) {
      setError('Please enter JSON input');
      return;
    }
    if (!paths.trim()) {
      setError('Please enter path expression');
      return;
    }

    try {
      const result = extractor.extract_with_format(input, paths, format);
      setOutput(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, [input, paths, format, extractor]);

  const handleDetect = useCallback(async () => {
    setError('');
    setOutput('');

    if (!input.trim()) {
      setError('Please enter JSON input');
      return;
    }

    try {
      const detectedPaths = extractor.detect_paths(input);
      setOutput('Available paths:\n' + JSON.stringify(JSON.parse(detectedPaths), null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, [input, extractor]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setInput(text);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  }, [output]);

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#1E293B]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CodeIcon />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">JSON Extractor</h1>
              <p className="text-sm text-slate-400">Extract data from JSON using JSONPath</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-3 text-slate-400">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Loading extractor...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="space-y-6">
              {/* JSON Input */}
              <div className="bg-[#1E293B] rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <DocumentIcon />
                    <span className="font-medium text-white">Input JSON</span>
                  </div>
                  <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <input 
                      type="file" 
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    Upload
                  </label>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='{"items": [{"id": 1, "name": "test"}]}'
                  className="w-full h-72 p-4 bg-transparent font-mono text-sm text-slate-300 placeholder-slate-600 focus:outline-none resize-none"
                  spellCheck={false}
                />
              </div>

              {/* Paths Input */}
              <div className="bg-[#1E293B] rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <BeakerIcon />
                    <span className="font-medium text-white">JSONPath</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={paths}
                  onChange={(e) => setPaths(e.target.value)}
                  placeholder="$.items[*].name, $.items[*].id"
                  className="w-full px-4 py-3 bg-transparent font-mono text-sm text-slate-300 placeholder-slate-600 focus:outline-none"
                />
              </div>

              {/* Format & Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-slate-400 mb-2">Output Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1E293B] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="text">Text</option>
                    <option value="yaml">YAML</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-slate-400 mb-2">&nbsp;</label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExtract}
                      disabled={!extractor}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowPathIcon />
                      Extract
                    </button>
                    <button
                      onClick={handleDetect}
                      disabled={!extractor}
                      className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <BeakerIcon />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-slate-400 mb-2">&nbsp;</label>
                  <button
                    onClick={() => {
                      setInput('');
                      setPaths('');
                      setOutput('');
                      setError('');
                    }}
                    className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Output Panel */}
            <div className="space-y-6">
              <div className="bg-[#1E293B] rounded-xl border border-slate-800 overflow-hidden h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <CodeIcon />
                    <span className="font-medium text-white">Output</span>
                  </div>
                  {output && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  )}
                </div>
                {error && (
                  <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <textarea
                  value={output}
                  readOnly
                  placeholder="Result will appear here..."
                  className="w-full h-[500px] lg:h-auto min-h-[400px] p-4 bg-transparent font-mono text-sm text-slate-300 placeholder-slate-600 focus:outline-none resize-none"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 p-6 bg-[#1E293B] rounded-xl border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">JSONPath Syntax Reference</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { code: '$.name', desc: 'Object key' },
              { code: '$.items[*]', desc: 'Array wildcard' },
              { code: '$[0]', desc: 'Array index' },
              { code: '$..id', desc: 'Recursive descent' },
              { code: '$[?(@.price>10)]', desc: 'Filter expression' },
            ].map((item) => (
              <div key={item.code} className="p-3 bg-slate-800/50 rounded-lg">
                <code className="block font-mono text-sm text-emerald-400 mb-1">{item.code}</code>
                <span className="text-xs text-slate-500">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
