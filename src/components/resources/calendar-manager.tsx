'use client';

import { FormEvent, useEffect, useState } from 'react';

type PeriodConfig = { index: number; label: string; isLunch: boolean };
type Calendar = {
  id: string;
  termName: string;
  termType: 'ODD' | 'EVEN';
  isSummer: boolean;
  startDate: string;
  endDate: string;
  periodStructure: PeriodConfig[];
  labStartPeriods: number[];
};

const workingDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function periodsFor(isSummer: boolean): PeriodConfig[] {
  const times = isSummer
    ? ['07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00']
    : ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00'];

  return times.map((time, index) => ({
    index,
    label: `${index + 1} (${time})`,
    isLunch: false,
  }));
}

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function CalendarManager() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [termName, setTermName] = useState('');
  const [termType, setTermType] = useState<'ODD' | 'EVEN'>('ODD');
  const [isSummer, setIsSummer] = useState(false);
  const [startDate, setStartDate] = useState(dateInputValue(new Date()));
  const [endDate, setEndDate] = useState(dateInputValue(new Date(Date.now() + 120 * 86400000)));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCalendars = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/resources/calendar');
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to load academic calendars.');
      }
      setCalendars(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load academic calendars.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalendars();
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const periodStructure = periodsFor(isSummer);
    try {
      const response = await fetch('/api/resources/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termName,
          termType,
          isSummer,
          startDate,
          endDate,
          totalTeachingWeeks: 15,
          creditHourMultiplier: 10,
          workingDays,
          periodStructure,
          labStartPeriods: isSummer ? [0, 2, 4] : [0, 2, 5],
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to create academic calendar.');
      }
      setTermName('');
      await loadCalendars();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create academic calendar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Create Academic Calendar</h2>
          <p className="mt-1 text-xs text-slate-500">Choose a regular semester or a morning-only summer schedule.</p>
        </div>

        <label className="block text-xs font-medium text-slate-700">
          Term name
          <input
            required
            value={termName}
            onChange={(event) => setTermName(event.target.value)}
            placeholder="2027-Even"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-slate-700">
            Semester
            <select
              value={termType}
              onChange={(event) => setTermType(event.target.value as 'ODD' | 'EVEN')}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ODD">Odd</option>
              <option value="EVEN">Even</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-700">
            Schedule
            <select
              value={isSummer ? 'summer' : 'regular'}
              onChange={(event) => setIsSummer(event.target.value === 'summer')}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="regular">Regular (8 periods)</option>
              <option value="summer">Summer (6 morning periods)</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-slate-700">
            Start date
            <input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-slate-700">
            End date
            <input required type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
        </div>

        <p className="text-xs text-slate-500">
          {isSummer ? 'Lab sessions can start at periods 1, 3, or 5.' : 'Lab sessions can start at periods 1, 3, or 6.'}
          {' '}Generation uses the calendar with the latest start date.
        </p>

        {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Create calendar'}
        </button>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Existing Calendars</h2>
        {loading ? (
          <p className="mt-4 text-xs text-slate-500">Loading calendars...</p>
        ) : calendars.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">No academic calendars have been created.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {calendars.map((calendar, index) => (
              <li key={calendar.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{calendar.termName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {calendar.termType} · {calendar.isSummer ? 'Summer morning schedule' : 'Regular schedule'} · {calendar.periodStructure.length} periods
                  </p>
                </div>
                {index === 0 && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    Latest start date
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
