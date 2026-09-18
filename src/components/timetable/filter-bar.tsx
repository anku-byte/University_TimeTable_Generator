'use client';

import { Filter, Layers, UserCheck, Building } from 'lucide-react';

interface FilterBarProps {
  filterType: 'section' | 'faculty' | 'room';
  setFilterType: (type: 'section' | 'faculty' | 'room') => void;
  selectedId: string;
  setSelectedId: (id: string) => void;
  sections: { id: string; name: string }[];
  faculties: { id: string; name: string }[];
  rooms: { id: string; name: string }[];
}

export function FilterBar({
  filterType,
  setFilterType,
  selectedId,
  setSelectedId,
  sections,
  faculties,
  rooms,
}: FilterBarProps) {
  const currentOptions =
    filterType === 'section' ? sections : filterType === 'faculty' ? faculties : rooms;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Filter Mode Buttons */}
      <div className="flex items-center space-x-2">
        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filter View:
        </span>
        <div className="flex bg-slate-100 p-1 rounded-lg space-x-1">
          <button
            onClick={() => {
              setFilterType('section');
              setSelectedId(sections[0]?.id || '');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterType === 'section' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Section Schedule
          </button>
          <button
            onClick={() => {
              setFilterType('faculty');
              setSelectedId(faculties[0]?.id || '');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterType === 'faculty' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Faculty Workload
          </button>
          <button
            onClick={() => {
              setFilterType('room');
              setSelectedId(rooms[0]?.id || '');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterType === 'room' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Room Occupancy
          </button>
        </div>
      </div>

      {/* Target Resource Selector */}
      <div className="flex items-center space-x-3">
        <label className="text-xs font-semibold text-slate-700">Select Entity:</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm min-w-[200px]"
        >
          {currentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
