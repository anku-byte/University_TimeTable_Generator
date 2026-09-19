'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, FolderTree, AlertCircle, CheckCircle } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
}

export function DepartmentManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    try {
      const res = await fetch('/api/resources/department');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDepartments(data.data);
      }
    } catch {
      setError('Failed to fetch departments');
    }
  }

  async function handleAddDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/resources/department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to add department');
        setIsLoading(false);
        return;
      }

      setSuccess(`Department '${data.data.name}' added successfully.`);
      setName('');
      setCode('');
      fetchDepartments();
    } catch {
      setError('An error occurred while creating department.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteDepartment(id: string) {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await fetch(`/api/resources/department?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDepartments((prev) => prev.filter((d) => d.id !== id));
      } else {
        setError(data.error || 'Failed to delete department');
      }
    } catch {
      setError('Failed to delete department');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Academic Departments</h2>
          <p className="text-xs text-slate-500">Manage institutional faculties and degree departments</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Add Department Form */}
      <form onSubmit={handleAddDepartment} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Add New Department</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Department Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Computer Science & Engineering"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Code / Abbreviation</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., CSE"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase text-slate-900"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {isLoading ? 'Saving...' : 'Add Department'}
          </button>
        </div>
      </form>

      {/* Department List Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-2.5 px-4">Code</th>
              <th className="py-2.5 px-4">Department Name</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {departments.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-slate-400">
                  No departments found. Add one above.
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-semibold text-blue-900">{dept.code}</td>
                  <td className="py-2.5 px-4 font-medium">{dept.name}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteDepartment(dept.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

