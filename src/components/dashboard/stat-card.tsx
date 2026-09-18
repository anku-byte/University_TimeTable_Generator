import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'bg-indigo-50 text-indigo-600' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>
      <div className={`p-3.5 rounded-2xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
