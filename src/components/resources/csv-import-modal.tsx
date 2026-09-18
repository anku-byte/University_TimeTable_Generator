'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [resourceType, setResourceType] = useState<'faculty' | 'room' | 'subject' | 'section'>('faculty');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceType', resourceType);

    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to import CSV' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error uploading file' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Bulk CSV Data Import</h3>
            <p className="text-xs text-slate-500">Upload CSV file to seed faculty, rooms, courses, or sections.</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Resource Type</label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="faculty">Faculty Members (name, email, maxHoursPerDay)</option>
              <option value="room">Classrooms & Labs (name, capacity, roomType)</option>
              <option value="subject">Courses & Subjects (code, name, credits, requiredHoursPerWeek, preferredRoomType)</option>
              <option value="section">Student Sections (name, studentCount, department)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              {message.text}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow"
            >
              <Upload className="w-4 h-4" /> {uploading ? 'Importing...' : 'Upload & Process CSV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
