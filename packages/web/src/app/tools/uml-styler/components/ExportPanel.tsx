'use client';

// 默认导出尺寸（当 SVG bbox 获取失败时的后备值）
const DEFAULT_EXPORT_WIDTH = 800;
const DEFAULT_EXPORT_HEIGHT = 600;

/**
 * 将 SVG 转换为 PNG Data URL
 */
async function svgToPngDataUrl(
  svgElement: SVGSVGElement,
  scale: number
): Promise<string> {
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  const bbox = svgElement.getBBox();
  const width = bbox.width + bbox.x;
  const height = bbox.height + bbox.y;

  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  clonedSvg.setAttribute('width', String(width));
  clonedSvg.setAttribute('height', String(height));
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Add white background
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', '100%');
  background.setAttribute('height', '100%');
  background.setAttribute('fill', 'white');
  clonedSvg.insertBefore(background, clonedSvg.firstChild);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);

  const canvas = document.createElement('canvas');
  canvas.width = scaledWidth;
  canvas.height = scaledHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建画布上下文');
  }

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, scaledWidth, scaledHeight);

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise<string>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      URL.revokeObjectURL(url);
      const pngDataUrl = canvas.toDataURL('image/png');
      resolve(pngDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG 加载失败'));
    };

    img.src = url;
  });
}

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

interface ExportPanelProps {
  code: string;
  theme: string;
  engine: 'mermaid' | 'plantuml' | 'd2' | 'graphviz' | 'wavedrom';
  scale?: 1 | 2 | 3 | 4;
}

export default function ExportPanel({ code, theme, engine, scale = 2 }: ExportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    setIsOpen(false);
    
    if (!code.trim()) {
      alert('No diagram to export');
      return;
    }

    const svgElement = document.querySelector('.mermaid-preview svg') as SVGSVGElement;
    if (!svgElement) {
      alert('No diagram to export. Please render a diagram first.');
      return;
    }

    try {
      if (format === 'svg') {
        const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
        const bbox = svgElement.getBBox();
        const width = bbox.width + bbox.x;
        const height = bbox.height + bbox.y;
        
        clonedSvg.setAttribute('width', String(width));
        clonedSvg.setAttribute('height', String(height));
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `diagram-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'png') {
        const pngDataUrl = await svgToPngDataUrl(svgElement, scale);
        
        const link = document.createElement('a');
        link.href = pngDataUrl;
        link.download = `diagram-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'pdf') {
        const bbox = svgElement.getBBox();
        const width = bbox.width + bbox.x || DEFAULT_EXPORT_WIDTH;
        const height = bbox.height + bbox.y || DEFAULT_EXPORT_HEIGHT;
        
        const pngDataUrl = await svgToPngDataUrl(svgElement, scale);
        const pngBase64 = pngDataUrl.split(',')[1];
        const pngBytes = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));
        
        // Create PDF with proper dimensions
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([width, height]);
        
        const pngImage = await pdfDoc.embedPng(pngBytes);
        
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
        
        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `diagram-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('导出失败，请重试或联系支持');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>导出</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 bottom-full mb-1 w-40 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50">
            <div className="p-1">
              <button
                onClick={() => handleExport('png')}
                disabled={!code.trim()}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center">P</span>
                PNG
              </button>
              <button
                onClick={() => handleExport('svg')}
                disabled={!code.trim()}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="w-4 h-4 bg-green-600 rounded text-white text-xs flex items-center justify-center">S</span>
                SVG
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={!code.trim()}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="w-4 h-4 bg-red-600 rounded text-white text-xs flex items-center justify-center">P</span>
                PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
