'use client';

interface ExportPanelProps {
  code: string;
  theme: string;
  engine: 'mermaid' | 'plantuml';
}

export default function ExportPanel({ code, theme, engine }: ExportPanelProps) {
  const handleExport = (format: 'png' | 'svg') => {
    console.log('Export:', format);
    alert(`Export ${format} - Coming soon!`);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('png')}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        PNG
      </button>
      <button
        onClick={() => handleExport('svg')}
        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        SVG
      </button>
    </div>
  );
}
