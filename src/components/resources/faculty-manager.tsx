'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Plus, Trash2, Clock, Mail } from 'lucide-react';

interface Faculty {
  id: string;
  name: string;
  email: string;
  maxHoursPerDay: number;
}

export function FacultyManager() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [maxHours, setMaxHours] = useState(4);

  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resources/faculty');
      const data = await res.json();
      if (data.success) setFaculties(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/resources/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, maxHoursPerDay: Number(maxHours) }),
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        setEmail('');
        setIsModalOpen(false);
        fetchFaculties();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this faculty member?')) return;
    try {
      await fetch(`/api/resources/faculty?id=${id}`, { method: 'DELETE' });
      fetchFaculties();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Faculty Members</h3>
          <p className="text-xs text-slate-500">Manage teaching staff, email addresses, and daily maximum hours.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Faculty Member
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading faculty members...</div>
      ) : faculties.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500 text-xs">
          No faculty members added yet. Click &quot;Add Faculty Member&quot; or import via CSV.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Faculty Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Max Daily Hours</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {faculties.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {f.name.charAt(0)}
                    </div>
                    {f.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {f.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                      <Clock className="w-3 h-3" /> {f.maxHoursPerDay} hrs / day
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                      title="Delete Faculty"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Add Faculty Member</h3>
            <p className="text-xs text-slate-500 mb-4">Enter faculty credentials and daily max hours.</p>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Alan Turing"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="turing@university.edu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Teaching Hours / Day</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={maxHours}
                  onChange={(e) => setMaxHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow"
                >
                  Save Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
