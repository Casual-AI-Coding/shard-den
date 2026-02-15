'use client';

import { useState, useCallback } from 'react';

export default function JsonExtractorPage() {
  const [input, setInput] = useState('');
  const [paths, setPaths] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const handleExtract = useCallback(async () => {
    setError('');
    setOutput('');

    try {
      // TODO: Load WASM and call extractor
      // const extractor = new JsonExtractor();
      // const result = extractor.extract(input, paths);
      setOutput('WASM integration pending...');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, [input, paths]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">JSON Extractor</h1>
          <p className="text-slate-600">Extract fields from JSON using path syntax</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Input JSON
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your JSON here..."
                className="w-full h-64 p-4 font-mono text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                spellCheck={false}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Paths (comma-separated)
              </label>
              <input
                type="text"
                value={paths}
                onChange={(e) => setPaths(e.target.value)}
                placeholder="e.g., data.items[].id, data.name"
                className="w-full px-4 py-2 font-mono text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExtract}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Extract
              </button>
              <button
                onClick={() => {
                  setInput('');
                  setPaths('');
                  setOutput('');
                  setError('');
                }}
                className="px-6 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Output */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Output
            </label>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            <textarea
              value={output}
              readOnly
              placeholder="Result will appear here..."
              className="w-full h-96 p-4 font-mono text-sm bg-slate-100 border border-slate-300 rounded-lg"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 p-6 bg-white rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Path Syntax</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <code className="block bg-slate-100 px-2 py-1 rounded mb-1">key</code>
              <span className="text-slate-600">Object key</span>
            </div>
            <div>
              <code className="block bg-slate-100 px-2 py-1 rounded mb-1">*</code>
              <span className="text-slate-600">Wildcard</span>
            </div>
            <div>
              <code className="block bg-slate-100 px-2 py-1 rounded mb-1">[]</code>
              <span className="text-slate-600">Array items</span>
            </div>
            <div>
              <code className="block bg-slate-100 px-2 py-1 rounded mb-1">[0]</code>
              <span className="text-slate-600">Array index</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
