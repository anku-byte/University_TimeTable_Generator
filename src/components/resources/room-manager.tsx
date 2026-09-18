'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Building } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  capacity: number;
  roomType: 'LECTURE' | 'LAB';
}

export function RoomManager() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [roomType, setRoomType] = useState<'LECTURE' | 'LAB'>('LECTURE');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resources/room');
      const data = await res.json();
      if (data.success) setRooms(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/resources/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, capacity: Number(capacity), roomType }),
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        setIsModalOpen(false);
        fetchRooms();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this room?')) return;
    try {
      await fetch(`/api/resources/room?id=${id}`, { method: 'DELETE' });
      fetchRooms();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Classrooms & Laboratories</h3>
          <p className="text-xs text-slate-500">Configure campus rooms, seating capacity, and room types.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500 text-xs">
          No rooms added yet. Click &quot;Add Room&quot; or import via CSV.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Room Name / Number</th>
                <th className="px-4 py-3">Room Type</th>
                <th className="px-4 py-3">Seating Capacity</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    {r.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.roomType === 'LAB'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {r.roomType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {r.capacity} Seats
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                      title="Delete Room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Add Classroom / Lab</h3>
            <p className="text-xs text-slate-500 mb-4">Set room designation, room type, and seating capacity.</p>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Room Name / Code</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hall 101 or Computer Lab A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Room Type</label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as 'LECTURE' | 'LAB')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="LECTURE">LECTURE (Standard Classroom)</option>
                  <option value="LAB">LAB (Specialized Laboratory)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
