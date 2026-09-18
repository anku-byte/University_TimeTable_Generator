'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, Clock } from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  requiredHoursPerWeek: number;
  preferredRoomType: 'LECTURE' | 'LAB';
}

export function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState(3);
  const [hours, setHours] = useState(3);
  const [preferredRoomType, setPreferredRoomType] = useState<'LECTURE' | 'LAB'>('LECTURE');

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resources/subject');
      const data = await res.json();
      if (data.success) setSubjects(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/resources/subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name,
          credits: Number(credits),
          requiredHoursPerWeek: Number(hours),
          preferredRoomType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCode('');
        setName('');
        setIsModalOpen(false);
        fetchSubjects();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course subject?')) return;
    try {
      await fetch(`/api/resources/subject?id=${id}`, { method: 'DELETE' });
      fetchSubjects();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Academic Courses & Subjects</h3>
          <p className="text-xs text-slate-500">Manage course catalog, credits, required weekly slots, and room preferences.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading subjects...</div>
      ) : subjects.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500 text-xs">
          No course subjects added yet. Click &quot;Add Subject&quot; or import via CSV.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Course Code</th>
                <th className="px-4 py-3">Subject Name</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">Weekly Hours</th>
                <th className="px-4 py-3">Preferred Room</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-600">{s.code}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{s.credits} Credits</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {s.requiredHoursPerWeek} hrs / wk
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        s.preferredRoomType === 'LAB'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {s.preferredRoomType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                      title="Delete Subject"
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

      {/* Add Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Add Course Subject</h3>
            <p className="text-xs text-slate-500 mb-4">Set course code, name, weekly hours, and room preference.</p>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CS-301"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Hours</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Room</label>
                  <select
                    value={preferredRoomType}
                    onChange={(e) => setPreferredRoomType(e.target.value as 'LECTURE' | 'LAB')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="LECTURE">LECTURE</option>
                    <option value="LAB">LAB</option>
                  </select>
                </div>
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
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
