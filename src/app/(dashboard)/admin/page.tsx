'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Building,
  BookOpen,
  Layers,
  Play,
  CalendarDays,
  Building2,
  CheckCircle,
  FolderTree,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    facultyCount: 0,
    roomCount: 0,
    subjectCount: 0,
    sectionCount: 0,
    departmentCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [fRes, rRes, subRes, secRes, deptRes] = await Promise.all([
          fetch('/api/resources/faculty'),
          fetch('/api/resources/room'),
          fetch('/api/resources/subject'),
          fetch('/api/resources/section'),
          fetch('/api/resources/department'),
        ]);

        const f = await fRes.json();
        const r = await rRes.json();
        const sub = await subRes.json();
        const sec = await secRes.json();
        const dept = await deptRes.json();

        setStats({
          facultyCount: f.data?.length || 0,
          roomCount: r.data?.length || 0,
          subjectCount: sub.data?.length || 0,
          sectionCount: sec.data?.length || 0,
          departmentCount: dept.data?.length || 0,
        });
      } catch (e) {
        console.error('Failed to load dashboard stats:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-950 text-blue-300 rounded border border-blue-800 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-blue-400" /> Academic Administration System
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CampusGrid Dashboard</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Centralized academic timetable management system. Configure institutional resources, verify curriculum requirements, and generate conflict-free schedules across departments, faculty, and classrooms.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/admin/generate"
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-2 shadow-xs"
            >
              <Play className="w-3.5 h-3.5" /> Generate Timetable
            </Link>
            <Link
              href="/timetable"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium border border-slate-700 transition-colors flex items-center gap-2"
            >
              <CalendarDays className="w-3.5 h-3.5" /> View Timetable Grid
            </Link>
          </div>
        </div>
      </div>

      {/* System Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Departments"
          value={isLoading ? '...' : stats.departmentCount}
          subtitle="Academic units"
          icon={FolderTree}
          color="bg-blue-50 text-blue-900"
        />
        <StatCard
          title="Faculty Staff"
          value={isLoading ? '...' : stats.facultyCount}
          subtitle="Teaching instructors"
          icon={Users}
          color="bg-slate-100 text-slate-800"
        />
        <StatCard
          title="Classrooms & Labs"
          value={isLoading ? '...' : stats.roomCount}
          subtitle="Available spaces"
          icon={Building}
          color="bg-slate-100 text-slate-800"
        />
        <StatCard
          title="Catalog Courses"
          value={isLoading ? '...' : stats.subjectCount}
          subtitle="Active subjects"
          icon={BookOpen}
          color="bg-slate-100 text-slate-800"
        />
        <StatCard
          title="Student Sections"
          value={isLoading ? '...' : stats.sectionCount}
          subtitle="Enrolled batches"
          icon={Layers}
          color="bg-slate-100 text-slate-800"
        />
      </div>

      {/* Quick Administrative Workflow Steps */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Academic Administration Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <span className="font-bold text-blue-900 text-xs">Step 1</span>
            <h3 className="font-semibold text-slate-800">Resource Setup</h3>
            <p className="text-slate-500 leading-relaxed">
              Define academic departments, classrooms, faculty availability, and catalog courses in Resource Management.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <span className="font-bold text-blue-900 text-xs">Step 2</span>
            <h3 className="font-semibold text-slate-800">Curriculum Assignment</h3>
            <p className="text-slate-500 leading-relaxed">
              Assign courses and weekly lecture hours to faculty members for each student section.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <span className="font-bold text-blue-900 text-xs">Step 3</span>
            <h3 className="font-semibold text-slate-800">Timetable Generation</h3>
            <p className="text-slate-500 leading-relaxed">
              Execute automatic schedule generation to compute a conflict-free master timetable.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <span className="font-bold text-blue-900 text-xs">Step 4</span>
            <h3 className="font-semibold text-slate-800">Review & Publish</h3>
            <p className="text-slate-500 leading-relaxed">
              Review draft timetables, perform optional manual adjustments, and publish for student and viewer access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
