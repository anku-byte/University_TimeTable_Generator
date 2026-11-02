'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, Clock, Users } from 'lucide-react';

interface ProgramOption {
  id: string;
  name: string;
  code: string;
}

interface SubjectOption {
  id: string;
  code: string;
  name: string;
  requiredHoursPerWeek: number;
  preferredRoomType: string;
}

interface CurriculumRecord {
  id: string;
  programId: string;
  semester: number;
  subjectId: string;
  weeklyHours: number | null;
  durationHours: number;
  splitIntoGroups: boolean;
  program: { id: string; name: string; code: string };
  subject: { id: string; code: string; name: string; requiredHoursPerWeek: number; preferredRoomType: string };
}

export function CurriculumSubjectManager() {
  const [list, setList] = useState<CurriculumRecord[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [semester, setSemester] = useState(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [weeklyHours, setWeeklyHours] = useState<number | ''>('');
  const [durationHours, setDurationHours] = useState(1);
  const [splitIntoGroups, setSplitIntoGroups] = useState(false);

  const [filterProgramId, setFilterProgramId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [curRes, progRes, subRes] = await Promise.all([
        fetch('/api/resources/curriculum-subject'),
        fetch('/api/resources/department'),
        fetch('/api/resources/subject'),
      ]);

      const [curData, progData, subData] = await Promise.all([
        curRes.json(),
        progRes.json(),
        subRes.json(),
      ]);

      if (curData.success) setList(curData.data);
      if (subData.success) setSubjects(subData.data);

      if (progData.success) {
        // Collect programs from department response or fetch hierarchy
        const progs: ProgramOption[] = [];
        progData.data.forEach((d: any) => {
          if (d.programs && Array.isArray(d.programs)) {
            d.programs.forEach((p: any) => progs.push(p));
          }
        });
        if (progs.length > 0) {
          setPrograms(progs);
        } else {
          // Fallback to direct hierarchy endpoint if department had no programs included
          const hRes = await fetch('/api/resources/hierarchy');
          const hData = await hRes.json();
          if (hData.success && hData.data?.programs) {
            setPrograms(hData.data.programs);
          }
        }
      }
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
    if (!selectedProgramId || !selectedSubjectId || !semester) return;

    try {
      const res = await fetch('/api/resources/curriculum-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: selectedProgramId,
          semester: Number(semester),
          subjectId: selectedSubjectId,
          weeklyHours: weeklyHours === '' ? null : Number(weeklyHours),
          durationHours: Number(durationHours),
          splitIntoGroups: Boolean(splitIntoGroups),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setSelectedProgramId('');
        setSelectedSubjectId('');
        setWeeklyHours('');
        setDurationHours(1);
        setSplitIntoGroups(false);
        loadData();
      } else {
        alert(data.error || 'Failed to add curriculum subject');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving curriculum subject');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this subject from program curriculum?')) return;
    try {
      const res = await fetch(`/api/resources/curriculum-subject?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setList((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(data.error || 'Failed to delete curriculum item');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredList = filterProgramId
    ? list.filter((item) => item.programId === filterProgramId)
    : list;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-900" />
            Program Curriculum & Semester Plan
          </h3>
          <p className="text-xs text-slate-500">
            Specifies the syllabus courses each degree program & semester studies. Auto-solver uses this to generate section timetables automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {programs.length > 0 && (
            <select
              value={filterProgramId}
              onChange={(e) => setFilterProgramId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-700 outline-none"
            >
              <option value="">All Programs ({programs.length})</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Curriculum Course
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading program curriculum...</div>
      ) : filteredList.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500 text-xs">
          No curriculum defined yet. Add courses to programs and semesters so timetables can be generated automatically!
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Program & Degree</th>
                <th className="px-4 py-3">Sem</th>
                <th className="px-4 py-3">Course / Subject</th>
                <th className="px-4 py-3">Hours / Week</th>
                <th className="px-4 py-3">Session Block</th>
                <th className="px-4 py-3">Lab Split</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] mr-2">
                      {row.program?.code}
                    </span>
                    {row.program?.name}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-blue-900">Sem {row.semester}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    <span className="font-mono text-slate-500 mr-1.5">[{row.subject?.code}]</span>
                    {row.subject?.name}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">
                    {row.weeklyHours ?? row.subject?.requiredHoursPerWeek} hrs
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {row.durationHours} hr{row.durationHours > 1 ? 's' : ''}/block
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {row.splitIntoGroups ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        <Users className="w-3 h-3" /> Group A & B
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Entire Class</span>
                    )}
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
            <h3 className="text-base font-bold text-slate-800 mb-1">Add Course to Curriculum</h3>
            <p className="text-xs text-slate-500 mb-4">Bind a subject to a degree program and semester.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Program</label>
                <select
                  required
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900 outline-none focus:ring-1 focus:ring-blue-900"
                >
                  <option value="">-- Select Degree Program --</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Block Duration (Hrs)</label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900 outline-none focus:ring-1 focus:ring-blue-900"
                  >
                    <option value={1}>1 hour (Theory)</option>
                    <option value={2}>2 hours (Standard Lab)</option>
                    <option value={3}>3 hours (Long Lab / Project)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Subject</label>
                <select
                  required
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    const sub = subjects.find((s) => s.id === e.target.value);
                    if (sub) {
                      setWeeklyHours(sub.requiredHoursPerWeek);
                      if (sub.preferredRoomType === 'LAB') {
                        setDurationHours(2);
                        setSplitIntoGroups(true);
                      } else {
                        setDurationHours(1);
                        setSplitIntoGroups(false);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900 outline-none focus:ring-1 focus:ring-blue-900"
                >
                  <option value="">-- Choose Course --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.preferredRoomType}, {s.requiredHoursPerWeek}h/wk)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Weekly Teaching Hours (optional, defaults to course credits)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  placeholder="Defaults to subject hours"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="splitGroups"
                  checked={splitIntoGroups}
                  onChange={(e) => setSplitIntoGroups(e.target.checked)}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                />
                <label htmlFor="splitGroups" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Split into parallel batches (Group A & Group B for Labs)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
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
                  Save Curriculum Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

