'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Users,
  Calendar,
  Layers,
  Check,
  ChevronRight,
} from 'lucide-react';
import { DAYS_OF_WEEK, TIME_SLOTS } from '@/lib/utils';

export function ClassAllocator() {
  // Master Hierarchy Data
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);

  // Selection States
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | ''>('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedCoFaculties, setSelectedCoFaculties] = useState<string[]>([]);
  const [subjectType, setSubjectType] = useState<'LECTURE' | 'LAB'>('LECTURE');
  const [labGroup, setLabGroup] = useState<'ALL' | 'GROUP_A' | 'GROUP_B'>('ALL');
  const [durationHours, setDurationHours] = useState(1);
  const [preferredDay, setPreferredDay] = useState('');

  // Execution States
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [commitSuccessMsg, setCommitSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch initial master data
  useEffect(() => {
    async function loadData() {
      try {
        const [hierRes, secRes, subRes, facRes] = await Promise.all([
          fetch('/api/resources/hierarchy').then((r) => r.json()),
          fetch('/api/resources/section').then((r) => r.json()),
          fetch('/api/resources/subject').then((r) => r.json()),
          fetch('/api/resources/faculty').then((r) => r.json()),
        ]);

        if (hierRes.success) {
          setDepartments(hierRes.data.departments || []);
          setPrograms(hierRes.data.programs || []);
          setCalendars(hierRes.data.calendars || []);
          if (hierRes.data.departments?.length > 0) {
            setSelectedDept(hierRes.data.departments[0].id);
          }
        }
        if (secRes.success) setSections(secRes.data || []);
        if (subRes.success) setSubjects(subRes.data || []);
        if (facRes.success) setFaculties(facRes.data || []);
      } catch (err: any) {
        setErrorMsg('Failed to load university resource configuration.');
      }
    }
    loadData();
  }, []);

  // Filter programs based on selected department
  const filteredPrograms = programs.filter(
    (p) => !selectedDept || p.departmentId === selectedDept
  );

  // Filter sections based on selected program and semester
  const filteredSections = sections.filter((s) => {
    if (selectedProgram && s.programId && s.programId !== selectedProgram) return false;
    if (selectedSemester && s.semester && s.semester !== Number(selectedSemester)) return false;
    return true;
  });

  // When subject changes, automatically adjust subjectType and duration
  const handleSubjectChange = (subId: string) => {
    setSelectedSubject(subId);
    const sub = subjects.find((s) => s.id === subId);
    if (sub) {
      const isLab = sub.preferredRoomType === 'LAB';
      setSubjectType(sub.preferredRoomType);
      setDurationHours(isLab ? 2 : 1);
      if (!isLab) setLabGroup('ALL');
    }
  };

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection || !selectedSubject || !selectedFaculty) {
      alert('Please select Section, Subject, and Faculty.');
      return;
    }

    setLoading(true);
    setResult(null);
    setCommitSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/allocate/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: selectedDept || undefined,
          programId: selectedProgram || undefined,
          semester: selectedSemester ? Number(selectedSemester) : undefined,
          sectionId: selectedSection,
          subjectId: selectedSubject,
          facultyId: selectedFaculty,
          coFacultyIds: selectedCoFaculties,
          subjectType,
          labGroup,
          durationHours: Number(durationHours),
          preferredDay: preferredDay || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setErrorMsg(json.error || 'Allocation evaluation failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during allocation recommendation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async (rec: any, index: number) => {
    setCommitting(index);
    setCommitSuccessMsg('');
    try {
      const res = await fetch('/api/allocate/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: rec.dayOfWeek,
          startSlotIndex: rec.startSlotIndex,
          durationHours: rec.durationHours,
          sectionId: selectedSection,
          subjectId: selectedSubject,
          facultyId: selectedFaculty,
          roomId: rec.room.id,
          batchGroup: labGroup,
          coFacultyIds: selectedCoFaculties,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCommitSuccessMsg(
          `Allocated ${rec.durationHours} period(s) on ${rec.dayOfWeek} in ${rec.room.name} (${rec.timeLabel})!`
        );
        // Refresh recommendation results
        handleRecommend({ preventDefault: () => {} } as any);
      } else {
        alert(json.error || 'Failed to commit slot allocation.');
      }
    } catch (err: any) {
      alert(err.message || 'Error committing allocation.');
    } finally {
      setCommitting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Allocation Input Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-800" />
              Intelligent Class & Resource Allocation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select class requirements. The solver checks all university constraints and determines valid (Slot + Room) alternatives.
            </p>
          </div>
          {calendars[0] && (
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-md flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {calendars[0].termName} ({calendars[0].totalTeachingWeeks} Weeks)
            </span>
          )}
        </div>

        <form onSubmit={handleRecommend} className="space-y-5">
          {/* Row 1: Department, Program, Semester */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedProgram('');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900 bg-white"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Program</label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900 bg-white"
              >
                <option value="">All Programs</option>
                {filteredPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900 bg-white"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Section, Subject, Faculty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Section <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900 bg-white"
              >
                <option value="">-- Select Section --</option>
                {filteredSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} ({sec.studentCount} students)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Catalog <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900 bg-white"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name} ({sub.credits} Cr, {sub.preferredRoomType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Faculty <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900 bg-white"
              >
                <option value="">-- Select Faculty --</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.code ? `(${f.code})` : ''} - Max {f.maxHoursPerDay}h/day
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Lab Configuration (Groups, Duration, Co-Faculty, Preferred Day) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubjectType('LECTURE');
                    setDurationHours(1);
                    setLabGroup('ALL');
                  }}
                  className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md border text-center ${
                    subjectType === 'LECTURE'
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Theory
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubjectType('LAB');
                    setDurationHours(2);
                  }}
                  className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md border text-center ${
                    subjectType === 'LAB'
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Laboratory
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch / Group
              </label>
              <select
                disabled={subjectType === 'LECTURE'}
                value={labGroup}
                onChange={(e) => setLabGroup(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="ALL">Entire Section (Combined)</option>
                <option value="GROUP_A">Group A (Batch 1)</option>
                <option value="GROUP_B">Group B (Batch 2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900 bg-white"
              >
                <option value={1}>1 Period (1 Hour)</option>
                <option value={2}>2 Contiguous Periods (2 Hours)</option>
                <option value={3}>3 Contiguous Periods (3 Hours)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Day (Optional)</label>
              <select
                value={preferredDay}
                onChange={(e) => setPreferredDay(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 outline-none text-slate-900 bg-white"
              >
                <option value="">Any Available Day</option>
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-white rounded-md text-xs font-semibold hover:bg-blue-800 transition shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Evaluating University Constraints...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Find Valid Time Slots & Rooms
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Notification */}
      {commitSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {commitSuccessMsg}
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Allocation Results Display */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Recommended Valid Allocations ({result.recommendations?.length || 0} valid alternatives found)
              </h4>
              <p className="text-xs text-slate-500">
                Analyzed {result.analyzedSlotsCount} slot combinations across university rooms, sections, and faculty schedules.
              </p>
            </div>
          </div>

          {/* Recommendation Cards */}
          {result.recommendations && result.recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.recommendations.map((rec: any, idx: number) => (
                <div
                  key={idx}
                  className={`bg-white rounded-xl border p-4 shadow-xs transition hover:border-blue-900 flex flex-col justify-between ${
                    idx === 0 ? 'border-blue-800 ring-1 ring-blue-800/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                        {rec.dayOfWeek}
                      </span>
                      {idx === 0 ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-900 text-white px-2 py-0.5 rounded-full">
                          Top Recommendation
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Alternative #{idx + 1}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-blue-800" />
                        <span className="font-semibold">{rec.timeLabel}</span>
                        <span className="text-[11px] text-slate-400">
                          (Periods {rec.startSlotIndex + 1}
                          {rec.durationHours > 1 ? `-${rec.endSlotIndex + 1}` : ''})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="font-semibold text-slate-900">{rec.room.name}</span>
                        <span className="text-[11px] text-slate-500">
                          ({rec.room.roomType}, Cap: {rec.room.capacity})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-700">
                        <User className="w-3.5 h-3.5 text-amber-700" />
                        <span>Faculty: <strong className="text-slate-900">{rec.faculty.name}</strong></span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Section: <strong>{result.request.section.name}</strong> ({result.request.labGroup})</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Suitability: <strong className="text-blue-900">{rec.score}%</strong>
                    </span>
                    <button
                      type="button"
                      disabled={committing !== null}
                      onClick={() => handleCommit(rec, idx)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition disabled:opacity-50"
                    >
                      {committing === idx ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          Assign This Slot
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h5 className="text-sm font-semibold text-slate-800">No Valid Time Slot Available</h5>
              <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                All candidate slots currently violate one or more institutional constraints (faculty availability, room occupancy, contiguous break, or daily workload limits).
              </p>
            </div>
          )}

          {/* Diagnostic Conflicts Accordion / List */}
          {result.conflicts && result.conflicts.length > 0 && (
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Evaluated Constraint Bottlenecks ({result.conflicts.length})
              </h5>
              <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 max-h-40 overflow-y-auto">
                {result.conflicts.slice(0, 10).map((conf: string, i: number) => (
                  <li key={i}>{conf}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
