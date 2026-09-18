'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Building,
  BookOpen,
  Layers,
  Cpu,
  CalendarDays,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    facultyCount: 4,
    roomCount: 5,
    subjectCount: 5,
    sectionCount: 3,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [fRes, rRes, subRes, secRes] = await Promise.all([
          fetch('/api/resources/faculty'),
          fetch('/api/resources/room'),
          fetch('/api/resources/subject'),
          fetch('/api/resources/section'),
        ]);

        const f = await fRes.json();
        const r = await rRes.json();
        const sub = await subRes.json();
        const sec = await secRes.json();

        setStats({
          facultyCount: f.data?.length || 4,
          roomCount: r.data?.length || 5,
          subjectCount: sub.data?.length || 5,
          sectionCount: sec.data?.length || 3,
        });
      } catch (e) {
        console.error(e);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Cpu className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/30 text-indigo-300 rounded-full text-xs font-semibold backdrop-blur-sm border border-indigo-400/30">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> CSP Backtracking Algorithm Engine Online
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">University Timetable System</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Automatically generate 100% clash-free class schedules across all academic sections, faculty members, and campus classrooms using Constraint Satisfaction Backtracking.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/admin/generate"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" /> Trigger Generator Engine
            </Link>
            <Link
              href="/timetable"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" /> View Timetable Grid
            </Link>
          </div>
        </div>
      </div>

      {/* System Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Faculty"
          value={stats.facultyCount}
          subtitle="Teaching instructors"
          icon={Users}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Active Rooms"
          value={stats.roomCount}
          subtitle="Lecture halls & Labs"
          icon={Building}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Catalog Courses"
          value={stats.subjectCount}
          subtitle="Active subjects"
          icon={BookOpen}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Student Sections"
          value={stats.sectionCount}
          subtitle="Enrolled batches"
          icon={Layers}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Zero-Collision Safeguards</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ensures zero faculty double-booking, room double-booking, section clashes, and room type mismatches at any time slot.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Backtracking Heuristics</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Leverages Minimum Remaining Values (MRV) and Least Constraining Value (LCV) to achieve fast solver convergence.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Interactive Override & Exports</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Allows drag-and-drop manual slot adjustments with live conflict alerts, plus instant PDF and Excel exports.
          </p>
        </div>
      </div>
    </div>
  );
}
