'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, Building, BookOpen, Layers, Upload, FolderTree, GraduationCap, CalendarRange, CalendarDays } from 'lucide-react';
import { DepartmentManager } from '@/components/resources/department-manager';
import { CalendarManager } from '@/components/resources/calendar-manager';
import { FacultyManager } from '@/components/resources/faculty-manager';
import { RoomManager } from '@/components/resources/room-manager';
import { SubjectManager } from '@/components/resources/subject-manager';
import { SectionManager } from '@/components/resources/section-manager';
import { FacultySubjectManager } from '@/components/resources/faculty-subject-manager';
import { CurriculumSubjectManager } from '@/components/resources/curriculum-subject-manager';
import { CSVImportModal } from '@/components/resources/csv-import-modal';

function ResourcesContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<
    'departments' | 'faculty' | 'room' | 'subject' | 'section' | 'curriculum' | 'expertise' | 'calendars'
  >('departments');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'courses') setActiveTab('subject');
      else if (tabParam === 'rooms') setActiveTab('room');
      else if (tabParam === 'sections') setActiveTab('section');
      else if (['departments', 'faculty', 'room', 'subject', 'section', 'curriculum', 'expertise', 'calendars'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, [tabParam]);

  const tabs = [
    { id: 'departments', label: 'Departments', icon: FolderTree },
    { id: 'curriculum', label: 'Curriculum Plan', icon: CalendarRange },
    { id: 'calendars', label: 'Academic Calendars', icon: CalendarDays },
    { id: 'expertise', label: 'Faculty Eligibility', icon: GraduationCap },
    { id: 'faculty', label: 'Faculty Staff', icon: Users },
    { id: 'room', label: 'Classrooms & Labs', icon: Building },
    { id: 'subject', label: 'Courses & Subjects', icon: BookOpen },
    { id: 'section', label: 'Sections & Classes', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Resource Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure departments, curriculum syllabus, teacher course eligibility, rooms, and student sections
          </p>
        </div>
        <button
          onClick={() => setIsCsvModalOpen(true)}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-medium flex items-center gap-2 transition-colors self-start md:self-auto shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" /> Bulk CSV Import
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-3.5 font-medium text-xs flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-blue-900 text-blue-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div key={refreshKey} className="pt-2">
        {activeTab === 'departments' && <DepartmentManager />}
        {activeTab === 'curriculum' && <CurriculumSubjectManager />}
        {activeTab === 'calendars' && <CalendarManager />}
        {activeTab === 'expertise' && <FacultySubjectManager />}
        {activeTab === 'faculty' && <FacultyManager />}
        {activeTab === 'room' && <RoomManager />}
        {activeTab === 'subject' && <SubjectManager />}
        {activeTab === 'section' && <SectionManager />}
      </div>

      {/* Bulk CSV Import Modal */}
      <CSVImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading resources...</div>}>
      <ResourcesContent />
    </Suspense>
  );
}
