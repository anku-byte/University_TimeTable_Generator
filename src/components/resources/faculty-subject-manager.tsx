'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, GraduationCap, BookOpen, Layers } from 'lucide-react';

interface FacultyOption {
  id: string;
  name: string;
  email: string;
}

interface SubjectOption {
  id: string;
  code: string;
  name: string;
  preferredRoomType: string;
}

interface ExpertiseRecord {
  id: string;
  facultyId: string;
  subjectId: string;
  faculty: { id: string; name: string; email: string };
  subject: { id: string; code: string; name: string; preferredRoomType: string };
}

export function FacultySubjectManager() {
  const [list, setList] = useState<ExpertiseRecord[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [filterFacultyId, setFilterFacultyId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, facRes, subRes] = await Promise.all([
        fetch('/api/resources/faculty-subject'),
        fetch('/api/resources/faculty'),
        fetch('/api/resources/subject'),
      ]);

      const [expData, facData, subData] = await Promise.all([
        expRes.json(),
        facRes.json(),
        subRes.json(),
      ]);

      if (expData.success) setList(expData.data);
      if (facData.success) setFaculties(facData.data);
      if (subData.success) setSubjects(subData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId || !selectedSubjectId) return;

    try {
      const res = await fetch('/api/resources/faculty-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facultyId: selectedFacultyId, subjectId: selectedSubjectId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setSelectedFacultyId('');
        setSelectedSubjectId('');
        loadData();
      } else {
        alert(data.error || 'Failed to link faculty expertise');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating expertise entry');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this subject from faculty expertise?')) return;
    try {
      const res = await fetch(`/api/resources/faculty-subject?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setList((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(data.error || 'Failed to remove expertise');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredList = filterFacultyId
    ? list.filter((item) => item.facultyId === filterFacultyId)
    : list;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-900" />
            Faculty Teaching Eligibility
          </h3>
          <p className="text-xs text-slate-500">
            Defines which subjects each faculty member is qualified to teach. Used by auto-assignment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterFacultyId}
            onChange={(e) => setFilterFacultyId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-700 outline-none"
          >
            <option value="">All Faculty ({faculties.length})</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Link Faculty to Course
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading faculty course eligibility...</div>
      ) : filteredList.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500 text-xs">
          No faculty-course eligibility mappings defined. Add one above so the auto-solver knows who can teach each course!
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Faculty Member</th>
                <th className="px-4 py-3">Eligible Subject / Course</th>
                <th className="px-4 py-3">Course Type</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900">
                    {row.faculty?.name || 'Unknown Faculty'}
                    <span className="block text-[10px] font-normal text-slate-400">{row.faculty?.email}</span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 font-mono text-[11px] mr-2">
                      {row.subject?.code}
                    </span>
                    {row.subject?.name}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.subject?.preferredRoomType === 'LAB'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {row.subject?.preferredRoomType || 'LECTURE'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                      title="Remove"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Link Faculty Eligibility</h3>
            <p className="text-xs text-slate-500 mb-4">Select a faculty member and the course they are qualified to teach.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Member</label>
                <select
                  required
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900 outline-none focus:ring-1 focus:ring-blue-900"
                >
                  <option value="">-- Choose Faculty --</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Eligible Course</label>
                <select
                  required
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900 outline-none focus:ring-1 focus:ring-blue-900"
                >
                  <option value="">-- Choose Course --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.preferredRoomType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-xs"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

