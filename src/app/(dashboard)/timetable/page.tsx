'use client';

import { useState, useEffect } from 'react';
import { FilterBar } from '@/components/timetable/filter-bar';
import { TimetableGrid } from '@/components/timetable/timetable-grid';
import { ExportActions } from '@/components/timetable/export-actions';
import { TimetableSlotData } from '@/components/timetable/slot-card';
import { CalendarDays, RefreshCw } from 'lucide-react';

export default function TimetablePage() {
  const [filterType, setFilterType] = useState<'section' | 'faculty' | 'room'>('section');
  const [selectedEntityId, setSelectedEntityId] = useState('');

  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [faculties, setFaculties] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [slots, setSlots] = useState<TimetableSlotData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [secRes, facRes, roomRes, ttRes] = await Promise.all([
        fetch('/api/resources/section'),
        fetch('/api/resources/faculty'),
        fetch('/api/resources/room'),
        fetch('/api/generate'),
      ]);

      const secData = await secRes.json();
      const facData = await facRes.json();
      const roomData = await roomRes.json();
      const ttData = await ttRes.json();

      if (secData.success) {
        setSections(secData.data);
        if (secData.data.length > 0 && !selectedEntityId) {
          setSelectedEntityId(secData.data[0].id);
        }
      }
      if (facData.success) setFaculties(facData.data);
      if (roomData.success) setRooms(roomData.data);

      if (ttData.success && ttData.data.length > 0) {
        const latestTt = ttData.data[0];
        const hydratedSlots: TimetableSlotData[] = latestTt.slots.map((s: any) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          timeSlotIndex: s.timeSlotIndex,
          sectionId: s.sectionId,
          sectionName: s.section?.name || 'Section',
          subjectId: s.subjectId,
          subjectCode: s.subject?.code || 'SUB',
          subjectName: s.subject?.name || 'Subject',
          roomType: s.subject?.preferredRoomType || 'LECTURE',
          facultyId: s.facultyId,
          facultyName: s.faculty?.name || 'Faculty',
          roomId: s.roomId,
          roomName: s.room?.name || 'Room',
        }));
        setSlots(hydratedSlots);
      } else {
        const defaultSlots: TimetableSlotData[] = [
          {
            id: 'demo-1',
            dayOfWeek: 'MONDAY',
            timeSlotIndex: 0,
            sectionId: secData.data?.[0]?.id || 'sec1',
            sectionName: secData.data?.[0]?.name || 'CS-3A',
            subjectId: 's1',
            subjectCode: 'CS-301',
            subjectName: 'Data Structures & Algorithms',
            roomType: 'LECTURE',
            facultyId: facData.data?.[0]?.id || 'f1',
            facultyName: facData.data?.[0]?.name || 'Dr. Alan Turing',
            roomId: roomData.data?.[0]?.id || 'r1',
            roomName: roomData.data?.[0]?.name || 'Hall 101',
          },
          {
            id: 'demo-2',
            dayOfWeek: 'TUESDAY',
            timeSlotIndex: 1,
            sectionId: secData.data?.[0]?.id || 'sec1',
            sectionName: secData.data?.[0]?.name || 'CS-3A',
            subjectId: 's2',
            subjectCode: 'CS-301L',
            subjectName: 'DSA Lab',
            roomType: 'LAB',
            facultyId: facData.data?.[0]?.id || 'f1',
            facultyName: facData.data?.[0]?.name || 'Dr. Alan Turing',
            roomId: roomData.data?.[3]?.id || 'r4',
            roomName: roomData.data?.[3]?.name || 'Computer Lab 1',
          },
        ];
        setSlots(defaultSlots);
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

  const handleSlotMove = (movedSlot: TimetableSlotData, newDay: string, newSlotIndex: number) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === movedSlot.id
          ? {
              ...s,
              dayOfWeek: newDay,
              timeSlotIndex: newSlotIndex,
              hasConflict: movedSlot.hasConflict,
            }
          : s
      )
    );
  };

  const activeEntityName =
    filterType === 'section'
      ? sections.find((s) => s.id === selectedEntityId)?.name || 'Section'
      : filterType === 'faculty'
      ? faculties.find((f) => f.id === selectedEntityId)?.name || 'Faculty'
      : rooms.find((r) => r.id === selectedEntityId)?.name || 'Room';

  const gridMapForExport: Record<string, Record<number, any>> = {};
  slots
    .filter((s) => {
      if (filterType === 'section') return s.sectionId === selectedEntityId;
      if (filterType === 'faculty') return s.facultyId === selectedEntityId;
      if (filterType === 'room') return s.roomId === selectedEntityId;
      return true;
    })
    .forEach((s) => {
      if (!gridMapForExport[s.dayOfWeek]) gridMapForExport[s.dayOfWeek] = {};
      gridMapForExport[s.dayOfWeek][s.timeSlotIndex] = s;
    });

  return (
    <div className="space-y-6">
      {/* Title & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-900" /> Timetable Grid
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive schedule viewer with section, faculty, and room perspectives.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <ExportActions
            title={`${activeEntityName} Timetable`}
            subtitle={`Filter: ${filterType.toUpperCase()} — Academic Schedule`}
            gridData={gridMapForExport}
          />
        </div>
      </div>

      {/* Dynamic Filter Bar */}
      <FilterBar
        filterType={filterType}
        setFilterType={setFilterType}
        selectedId={selectedEntityId}
        setSelectedId={setSelectedEntityId}
        sections={sections}
        faculties={faculties}
        rooms={rooms}
      />

      {/* Main Timetable Calendar Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">Loading Timetable Grid...</div>
      ) : (
        <TimetableGrid
          slots={slots}
          filterType={filterType}
          selectedEntityId={selectedEntityId}
          onSlotMove={handleSlotMove}
        />
      )}
    </div>
  );
}
