'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

interface ExportActionsProps {
  title: string;
  subtitle: string;
  gridData: Record<string, Record<number, any>>;
}

export function ExportActions({ title, subtitle, gridData }: ExportActionsProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const handleExportPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subtitle, gridData }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_Timetable.pdf`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setDownloadingExcel(true);
    try {
      const res = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, gridData }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_Timetable.xlsx`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleExportPdf}
        disabled={downloadingPdf}
        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
      >
        <FileText className="w-4 h-4" />
        {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
      </button>
      <button
        onClick={handleExportExcel}
        disabled={downloadingExcel}
        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
      >
        <FileSpreadsheet className="w-4 h-4" />
        {downloadingExcel ? 'Exporting XLSX...' : 'Export Excel'}
      </button>
    </div>
  );
}
