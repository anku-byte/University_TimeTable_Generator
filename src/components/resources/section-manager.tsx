'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Layers, BookOpen, UserCheck, GraduationCap } from 'lucide-react';

interface Program {
  id: string;
  name: string;
  code: string;
}

interface Section {
  id: string;
  name: string;
  studentCount: number;
  department: string;
  departmentId?: string;
  programId?: string;
  semester?: number;
  programRef?: { name: string; code: string };
}

interface Assignment {
  id: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  weeklyHoursRequired: number;
  batchGroup?: string;
  durationHours?: number;
  section?: Section;
  subject?: { code: string; name: string; preferredRoomType?: string };
  faculty?: { name: string };
}

export function SectionManager() {
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // Options for Assignment Modal
  const [facultyOptions, setFacultyOptions] = useState<{ id: string; name: string }[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<{ id: string; code: string; name: string }[]>([]);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  // Section Form state - programId & semester are REQUIRED
  const [sectionName, setSectionName] = useState('');
  const [studentCount, setStudentCount] = useState(45);
  const [department, setDepartment] = useState('Computer Science');
  const [programId, setProgramId] = useState('');
  const [semester, setSemester] = useState(1);

  // Assignment Form state
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(3);
  const [batchGroup, setBatchGroup] = useState<'ALL' | 'GROUP_A' | 'GROUP_B'>('ALL');
  const [durationHours, setDurationHours] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [secRes, asgnRes, facRes, subRes, deptRes] = await Promise.all([
        fetch('/api/resources/section'),
        fetch('/api/resources/assignment'),
        fetch('/api/resources/faculty'),
        fetch('/api/resources/subject'),
        fetch('/api/resources/department'),
      ]);

      const [secData, asgnData, facData, subData, deptData] = await Promise.all([
        secRes.json(),
        asgnRes.json(),
        facRes.json(),
        subRes.json(),
        deptRes.json(),
      ]);

      if (secData.success) setSections(secData.data);
      if (asgnData.success) setAssignments(asgnData.data);
      if (facData.success) setFacultyOptions(facData.data);
      if (subData.success) setSubjectOptions(subData.data);

      if (deptData.success) {
        const progs: Program[] = [];
        deptData.data.forEach((d: any) => {
          if (d.programs && Array.isArray(d.programs)) {
            d.programs.forEach((p: any) => progs.push(p));
          }
        });
        if (progs.length > 0) {
          setPrograms(progs);
          if (!programId) setProgramId(progs[0].id);
        } else {
          const hRes = await fetch('/api/resources/hierarchy');
          const hData = await hRes.json();
          if (hData.success && hData.data?.programs) {
            setPrograms(hData.data.programs);
            if (!programId && hData.data.programs.length > 0) setProgramId(hData.data.programs[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching section manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId) {
      alert('Academic Program is required for automatic curriculum resolution.');
      return;
    }
    try {
      const res = await fetch('/api/resources/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sectionName,
          studentCount: Number(studentCount),
          department,
          programId,
          semester: Number(semester),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSectionName('');
        setStudentCount(45);
        setIsSectionModalOpen(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to add section');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating section');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      const res = await fetch(`/api/resources/section?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSections((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(data.error || 'Failed to delete section');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting section');
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/resources/assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId,
          facultyId: selectedFacultyId,
          weeklyHoursRequired: Number(weeklyHours),
          batchGroup,
          durationHours: Number(durationHours),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAssignmentModalOpen(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to link subject and faculty');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating assignment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sections Table Card */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-900" /> Academic Class Sections
            </h3>
            <p className="text-xs text-slate-500">
              Each section must be bound to a Degree Program & Semester so its curriculum is auto-resolved.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsSectionModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-900 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Section
            </button>
            <button
              onClick={() => setIsAssignmentModalOpen(true)}
              className="px-3.5 py-1.5 border border-slate-300 text-slate-700 bg-white rounded-md text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Manual Assignment
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading sections...</div>
        ) : sections.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500 text-xs">
            No sections added yet. Click &quot;Add Section&quot; to create one.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Section Name</th>
                  <th className="px-4 py-3">Degree Program</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-900" />
                      {sec.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {sec.programRef ? (
                        <span>
                          <span className="font-mono text-xs text-blue-900 mr-1.5">[{sec.programRef.code}]</span>
                          {sec.programRef.name}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold text-[11px]">No Program Set</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">
                      {sec.semester ? `Sem ${sec.semester}` : <span className="text-amber-600">None</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{sec.department}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {sec.studentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Section"
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
      </div>

      {/* Curriculum Bindings Table */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-blue-900" /> Existing Section-Subject Bindings ({assignments.length})
        </h4>
        <p className="text-xs text-slate-500">
          These rows are passed directly to the generator. If any courses are missing from this table, the new auto-solver creates them automatically from Program Curriculum!
        </p>
        {assignments.length === 0 ? (
          <div className="p-6 text-center bg-blue-50/50 rounded-xl border border-blue-100 text-blue-900 text-xs">
            No manual assignments configured yet. The auto-solver will generate all curriculum bindings automatically on the Batch Generator page!
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Course / Subject</th>
                  <th className="px-4 py-3">Assigned Faculty</th>
                  <th className="px-4 py-3">Batch Group</th>
                  <th className="px-4 py-3">Weekly Slots</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-bold text-blue-900">
                      {a.section?.name || sections.find((s) => s.id === a.sectionId)?.name}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {a.subject?.code ? `${a.subject.code} - ${a.subject.name}` : 'Course Assigned'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {a.faculty?.name || 'Faculty Assigned'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">
                      {a.batchGroup || 'ALL'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">{a.weeklyHoursRequired} hrs / week</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Add Student Section</h3>
            <p className="text-xs text-slate-500 mb-4">Define a new student class section with mandatory Program & Semester.</p>

            <form onSubmit={handleAddSection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section Name *</label>
                <input
                  type="text"
                  required
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder="e.g. CS-3A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Degree Program * (Required for Auto-Curriculum)</label>
                <select
                  required
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester *</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Count *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={studentCount}
                    onChange={(e) => setStudentCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-xs"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Manual Curriculum Binding</h3>
            <p className="text-xs text-slate-500 mb-4">Manually assign a specific faculty member and course to a section.</p>

            <form onSubmit={handleAddAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class Section</label>
                <select
                  required
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900 outline-none"
                >
                  <option value="">-- Choose Section --</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Subject</label>
                <select
                  required
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900 outline-none"
                >
                  <option value="">-- Choose Course --</option>
                  {subjectOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Faculty Instructor</label>
                <select
                  required
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900 outline-none"
                >
                  <option value="">-- Choose Faculty --</option>
                  {facultyOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Group</label>
                  <select
                    value={batchGroup}
                    onChange={(e) => setBatchGroup(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900 outline-none"
                  >
                    <option value="ALL">Entire Class (ALL)</option>
                    <option value="GROUP_A">Group A (Lab Batch 1)</option>
                    <option value="GROUP_B">Group B (Lab Batch 2)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Block Hours</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Required Weekly Hours</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-xs"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
