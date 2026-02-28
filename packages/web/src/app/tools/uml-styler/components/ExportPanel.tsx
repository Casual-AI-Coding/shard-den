'use client';

import React, { useState, useRef } from 'react';

interface ExportPanelProps {
  code: string;
  theme: string;
  engine: 'mermaid' | 'plantuml';
}

type ExportFormat = 'png' | 'svg';

export default function ExportPanel({ code, theme, engine }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [scale, setScale] = useState<1 | 2 | 3 | 4>(2);

  const exportSVG = async () => {
    const svgElement = document.querySelector('#mermaid-preview svg') as SVGSVGElement;
    if (!svgElement) {
      alert('No diagram to export');
      return;
    }

    // Clone SVG
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    
    // Get dimensions
    const bbox = svgElement.getBBox();
    const width = bbox.width + bbox.x;
    const height = bbox.height + bbox.y;
    
    // Set attributes
    clonedSvg.setAttribute('width', String(width));
    clonedSvg.setAttribute('height', String(height));
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Serialize
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    
    // Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPNG = async () => {
    const svgElement = document.querySelector('#mermaid-preview svg') as SVGSVGElement;
    if (!svgElement) {
      alert('No diagram to export');
      return;
    }

    // Clone SVG
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    
    // Get dimensions
    const bbox = svgElement.getBBox();
    const width = bbox.width + bbox.x;
    const height = bbox.height + bbox.y;
    
    // Scale for higher resolution
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    
    // Set attributes
    clonedSvg.setAttribute('width', String(width));
    clonedSvg.setAttribute('height', String(height));
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Add background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', 'white');
    clonedSvg.insertBefore(background, clonedSvg.firstChild);
    
    // Serialize
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      alert('Failed to create canvas context');
      return;
    }
    
    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);
    
    // Create image from SVG
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    return new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
        URL.revokeObjectURL(url);
        
        // Convert to PNG
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          // Download
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `diagram-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
          resolve();
        }, 'image/png');
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG'));
      };
      
      img.src = url;
    });
  };

  const handleExport = async (format: ExportFormat) => {
    if (!code.trim()) {
      alert('No diagram to export');
      return;
    }

    setIsExporting(true);
    try {
      if (format === 'svg') {
        await exportSVG();
      } else {
        await exportPNG();
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Scale selector */}
      <select
        value={scale}
        onChange={(e) => setScale(Number(e.target.value) as 1 | 2 | 3 | 4)}
        className="px-2 py-1 border rounded text-sm"
        title="Export scale"
      >
        <option value={1}>1x</option>
        <option value={2}>2x</option>
        <option value={3}>3x</option>
        <option value={4}>4x</option>
      </select>
      
      {/* Export buttons */}
      <button
        onClick={() => handleExport('png')}
        disabled={isExporting}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? 'Exporting...' : 'PNG'}
      </button>
      <button
        onClick={() => handleExport('svg')}
        disabled={isExporting}
        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        SVG
      </button>
    </div>
  );
}