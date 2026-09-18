'use client';

import { useState } from 'react';
import { Users, Building, BookOpen, Layers, Upload } from 'lucide-react';
import { FacultyManager } from '@/components/resources/faculty-manager';
import { RoomManager } from '@/components/resources/room-manager';
import { SubjectManager } from '@/components/resources/subject-manager';
import { SectionManager } from '@/components/resources/section-manager';
import { CSVImportModal } from '@/components/resources/csv-import-modal';

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<'faculty' | 'room' | 'subject' | 'section'>('faculty');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = [
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'room', label: 'Rooms & Labs', icon: Building },
    { id: 'subject', label: 'Courses / Subjects', icon: BookOpen },
    { id: 'section', label: 'Sections & Curriculum', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">University Resource Management</h1>
          <p className="text-xs text-slate-500 mt-1">Manage teaching staff, physical classrooms, subjects, and section curricula.</p>
        </div>
        <button
          onClick={() => setIsCsvModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow transition-all self-start md:self-auto"
        >
          <Upload className="w-4 h-4" /> Bulk CSV Import
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-4 font-semibold text-xs flex items-center gap-2 transition-all border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div key={refreshKey} className="pt-2">
        {activeTab === 'faculty' && <FacultyManager />}
        {activeTab === 'room' && <RoomManager />}
        {activeTab === 'subject' && <SubjectManager />}
        {activeTab === 'section' && <SectionManager />}
      </div>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
