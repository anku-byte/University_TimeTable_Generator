'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Filter, Eye, Building2 } from 'lucide-react';

interface Slot {
  id: string;
  dayOfWeek: string;
  timeSlotIndex: number;
  section: { id: string; name: string; department?: string };
  subject: { id: string; code: string; name: string };
  faculty: { id: string; name: string };
  room: { id: string; name: string };
}

interface Timetable {
  id: string;
  name: string;
  academicTerm: string;
  status: string;
  createdAt: string;
  slots: Slot[];
}

const timeSlotLabels = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
];

const days: Array<'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'> = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export default function ViewerDashboardPage() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Filters
  const [deptFilter, setDeptFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  // Dynamic filter options
  const [departments, setDepartments] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [faculties, setFaculties] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);

  useEffect(() => {
    async function loadPublishedTimetables() {
      setLoading(true);
      try {
        const res = await fetch('/api/generate');
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          // Filter only published timetables for viewer
          const published = data.data.filter((t: Timetable) => t.status === 'PUBLISHED');
          setTimetables(published.length > 0 ? published : data.data); // Fallback to all if no published yet for preview
          if (published.length > 0) {
            setSelectedTimetableId(published[0].id);
          } else if (data.data.length > 0) {
            setSelectedTimetableId(data.data[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadPublishedTimetables();
  }, []);

  const activeTimetable = timetables.find((t) => t.id === selectedTimetableId) || timetables[0];

  useEffect(() => {
    if (activeTimetable && activeTimetable.slots) {
      const depts = new Set<string>();
      const secs = new Set<string>();
      const facs = new Set<string>();
      const rms = new Set<string>();

      activeTimetable.slots.forEach((s) => {
        if (s.section?.department) depts.add(s.section.department);
        if (s.section?.name) secs.add(s.section.name);
        if (s.faculty?.name) facs.add(s.faculty.name);
        if (s.room?.name) rms.add(s.room.name);
      });

      setDepartments(Array.from(depts));
      setSections(Array.from(secs));
      setFaculties(Array.from(facs));
      setRooms(Array.from(rms));
    }
  }, [activeTimetable]);

  const filteredSlots = (activeTimetable?.slots || []).filter((slot) => {
    if (deptFilter && slot.section?.department !== deptFilter) return false;
    if (sectionFilter && slot.section?.name !== sectionFilter) return false;
    if (facultyFilter && slot.faculty?.name !== facultyFilter) return false;
    if (roomFilter && slot.room?.name !== roomFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded text-xs font-semibold mb-1">
            <Eye className="w-3.5 h-3.5" /> Published Schedules
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Timetable Viewer</h1>
          <p className="text-xs text-slate-500">View published class timetables by department, section, faculty member, or classroom.</p>
        </div>

        {timetables.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-700">Select Schedule:</label>
            <select
              value={selectedTimetableId}
              onChange={(e) => setSelectedTimetableId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              {timetables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.academicTerm}) {t.status === 'PUBLISHED' ? '✓ Published' : '(Draft)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-blue-900" />
          <span>Filter Timetable</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Faculty Member</label>
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="">All Faculty</option>
              {faculties.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Classroom / Lab</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="">All Rooms</option>
              {rooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timetable Schedule Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading timetable schedule...</div>
      ) : !activeTimetable ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
          No published timetable is currently available. Please check back later or log in as an administrator.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full border-collapse min-w-[800px] text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold text-[11px]">
                <th className="py-3 px-4 w-32 border-b border-slate-800">Time Slot</th>
                {days.map((day) => (
                  <th key={day} className="py-3 px-3 border-b border-slate-800 text-center uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {timeSlotLabels.map((slotTime, slotIdx) => (
                <tr key={slotIdx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-600 bg-slate-50/80 border-r border-slate-200 text-[11px]">
                    {slotTime}
                  </td>
                  {days.map((day) => {
                    const slotEntries = filteredSlots.filter(
                      (s) => s.dayOfWeek === day && s.timeSlotIndex === slotIdx
                    );

                    return (
                      <td key={day} className="p-2 border-r border-slate-200 align-top h-24 w-1/6">
                        {slotEntries.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-[10px] text-slate-300 italic">
                            Free
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {slotEntries.map((entry) => (
                              <div
                                key={entry.id || `${entry.section.id}-${entry.subject.id}`}
                                className="p-2 bg-blue-50/80 border border-blue-200 rounded-md text-left space-y-0.5"
                              >
                                <div className="font-semibold text-blue-900 text-xs truncate">
                                  {entry.subject.code}: {entry.subject.name}
                                </div>
                                <div className="text-[10px] text-slate-700 flex items-center justify-between">
                                  <span className="font-medium text-slate-800">{entry.section.name}</span>
                                  <span className="bg-white px-1 py-0.2 rounded border border-blue-200 text-blue-800 font-semibold">
                                    {entry.room.name}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  Faculty: {entry.faculty.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

