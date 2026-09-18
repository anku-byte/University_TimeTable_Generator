'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Layers, BookOpen, UserCheck } from 'lucide-react';

interface Section {
  id: string;
  name: string;
  studentCount: number;
  department: string;
}

interface Assignment {
  id: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  weeklyHoursRequired: number;
  section?: Section;
  subject?: { code: string; name: string };
  faculty?: { name: string };
}

export function SectionManager() {
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Options for Assignment Modal
  const [facultyOptions, setFacultyOptions] = useState<{ id: string; name: string }[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<{ id: string; code: string; name: string }[]>([]);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  // Section Form state
  const [sectionName, setSectionName] = useState('');
  const [studentCount, setStudentCount] = useState(45);
  const [department, setDepartment] = useState('Computer Science');

  // Assignment Form state
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(3);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [secRes, asgnRes, facRes, subRes] = await Promise.all([
        fetch('/api/resources/section'),
        fetch('/api/resources/assignment'),
        fetch('/api/resources/faculty'),
        fetch('/api/resources/subject'),
      ]);

      const secData = await secRes.json();
      const asgnData = await asgnRes.json();
      const facData = await facRes.json();
      const subData = await subRes.json();

      if (secData.success) setSections(secData.data);
      if (asgnData.success) setAssignments(asgnData.data);
      if (facData.success) setFacultyOptions(facData.data);
      if (subData.success) setSubjectOptions(subData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/resources/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sectionName, studentCount: Number(studentCount), department }),
      });
      const data = await res.json();
      if (data.success) {
        setSectionName('');
        setIsSectionModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAssignmentModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Delete this section?')) return;
    try {
      await fetch(`/api/resources/section?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sections Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Student Sections & Batches</h3>
            <p className="text-xs text-slate-500">Define academic sections, student counts, and department affiliations.</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsSectionModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Section
            </button>
            <button
              onClick={() => setIsAssignmentModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
            >
              <Plus className="w-4 h-4" /> Bind Subject & Faculty
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
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Section Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Student Strength</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      {sec.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{sec.department}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {sec.studentCount} Students
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
          <BookOpen className="w-4 h-4 text-indigo-600" /> Section Curriculum & Assigned Faculty
        </h4>
        {assignments.length === 0 ? (
          <div className="p-6 text-center bg-indigo-50/50 rounded-xl border border-indigo-100 text-indigo-800 text-xs">
            No subject/faculty assignments linked to sections. Click &quot;Bind Subject & Faculty&quot; above to configure curriculum.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Course / Subject</th>
                  <th className="px-4 py-3">Assigned Faculty</th>
                  <th className="px-4 py-3">Weekly Slots</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-bold text-indigo-600">
                      {a.section?.name || sections.find((s) => s.id === a.sectionId)?.name}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {a.subject?.code ? `${a.subject.code} - ${a.subject.name}` : 'Course Assigned'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {a.faculty?.name || 'Faculty Assigned'}
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
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Add Student Section</h3>
            <p className="text-xs text-slate-500 mb-4">Define a new student class section.</p>

            <form onSubmit={handleAddSection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section Name</label>
                <input
                  type="text"
                  required
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder="e.g. CS-3A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Count</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Curriculum Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Bind Subject & Faculty to Section</h3>
            <p className="text-xs text-slate-500 mb-4">Assign a subject and instructor to a student section.</p>

            <form onSubmit={handleAddAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Section</label>
                <select
                  required
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Subject</label>
                <select
                  required
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjectOptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Faculty Member</label>
                <select
                  required
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Choose Faculty --</option>
                  {facultyOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Required Weekly Hours</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow"
                >
                  Save Binding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
