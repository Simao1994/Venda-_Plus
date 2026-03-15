// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Calendar, CheckCircle2, XCircle, Clock, AlertCircle,
  RefreshCw, TrendingUp, Users, Download, ChevronLeft, ChevronRight
} from 'lucide-react';

const STATUS_CONFIG = {
  present: { label: 'Presente', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, dot: 'bg-emerald-500' },
  absent: { label: 'Faltou', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle, dot: 'bg-rose-500' },
  late: { label: 'Atrasado', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, dot: 'bg-amber-500' },
  sick_leave: { label: 'Licença', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle, dot: 'bg-blue-500' },
};

export default function Attendance() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [checkTimes, setCheckTimes] = useState<Record<number, { in: string; out: string }>>({});

  useEffect(() => { fetchData(); }, [date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        supabase.from('hr_employees').select('*').eq('company_id', user?.company_id).eq('status', 'active').order('name'),
        supabase.from('hr_attendance').select('*').eq('date', date)
      ]);
      const emps = empRes.data || [];
      const atts = attRes.data || [];
      setEmployees(emps);
      setAttendance(atts);
      // Init horários com o que está na BD
      const times: Record<number, { in: string; out: string }> = {};
      emps.forEach((e: any) => {
        const att = atts.find((a: any) => a.employee_id === e.id);
        times[e.id] = { in: att?.check_in || '08:00', out: att?.check_out || '17:00' };
      });
      setCheckTimes(times);
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (employeeId: number, status: string) => {
    setSaving(employeeId);
    try {
      const times = checkTimes[employeeId] || { in: '08:00', out: '17:00' };
      const existing = attendance.find(a => a.employee_id === employeeId);

      const payload = {
        employee_id: employeeId,
        date,
        status,
        check_in: status === 'present' || status === 'late' ? times.in : null,
        check_out: status === 'present' ? times.out : null,
      };

      if (existing) {
        await supabase.from('hr_attendance').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('hr_attendance').insert([payload]);
      }
      await fetchData();
    } catch (err) {
      console.error('Erro ao registar presença:', err);
      alert('Erro ao guardar presença.');
    } finally {
      setSaving(null);
    }
  };

  const getAtt = (id: number) => attendance.find(a => a.employee_id === id);

  // Stats
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const unregistered = employees.length - attendance.length;

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-AO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Controlo de Presenças</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Registe a assiduidade diária da sua equipa</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Presentes', value: presentCount, color: 'from-emerald-500 to-teal-600', icon: CheckCircle2 },
          { label: 'Faltas', value: absentCount, color: 'from-rose-500 to-rose-600', icon: XCircle },
          { label: 'Atrasados', value: lateCount, color: 'from-amber-500 to-orange-500', icon: Clock },
          { label: 'Por registar', value: unregistered, color: 'from-zinc-500 to-zinc-700', icon: AlertCircle },
        ].map(stat => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-lg`}>
            <stat.icon size={20} className="mb-2 opacity-80" />
            <div className="text-3xl font-black">{stat.value}</div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Date navigator */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-4 flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-yellow-500" />
          <div className="text-center">
            <p className="text-sm font-black text-zinc-900 capitalize">{formattedDate}</p>
          </div>
          <input
            type="date"
            className="border border-zinc-200 rounded-xl px-3 py-1.5 text-sm font-bold text-zinc-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <button onClick={() => changeDate(1)} disabled={date >= new Date().toISOString().split('T')[0]} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="animate-spin text-yellow-500" size={28} />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="text-zinc-200 mx-auto mb-3" />
            <p className="font-bold text-zinc-400">Nenhum funcionário activo encontrado.</p>
            <p className="text-sm text-zinc-300">Adicione funcionários no separador "Funcionários".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-zinc-500 text-[10px] uppercase tracking-widest font-black">
                <tr>
                  <th className="px-6 py-4">Funcionário</th>
                  <th className="px-6 py-4">Status Actual</th>
                  <th className="px-6 py-4">Entrada</th>
                  <th className="px-6 py-4">Saída</th>
                  <th className="px-6 py-4 text-right">Marcar Presença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {employees.map(emp => {
                  const att = getAtt(emp.id);
                  const cfg = att ? STATUS_CONFIG[att.status as keyof typeof STATUS_CONFIG] : null;
                  const isSaving = saving === emp.id;
                  const initials = (emp.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <tr key={emp.id} className={`hover:bg-zinc-50/50 transition-colors ${isSaving ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-600 flex items-center justify-center text-white font-black text-xs shadow">
                            {initials}
                          </div>
                          <div>
                            <div className="font-black text-zinc-900 text-sm">{emp.name}</div>
                            <div className="text-xs text-zinc-400 font-medium">{emp.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {cfg ? (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-300 font-medium italic">Não registado</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="time"
                          className="border border-zinc-200 rounded-lg px-2 py-1 text-sm font-bold text-zinc-700 w-24 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                          value={checkTimes[emp.id]?.in || '08:00'}
                          onChange={e => setCheckTimes(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], in: e.target.value } }))}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="time"
                          className="border border-zinc-200 rounded-lg px-2 py-1 text-sm font-bold text-zinc-700 w-24 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                          value={checkTimes[emp.id]?.out || '17:00'}
                          onChange={e => setCheckTimes(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], out: e.target.value } }))}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1.5">
                          {[
                            { status: 'present', label: 'Presente', Icon: CheckCircle2, cls: 'text-emerald-600 hover:bg-emerald-50 border-emerald-200' },
                            { status: 'late', label: 'Atrasado', Icon: Clock, cls: 'text-amber-600 hover:bg-amber-50 border-amber-200' },
                            { status: 'absent', label: 'Faltou', Icon: XCircle, cls: 'text-rose-600 hover:bg-rose-50 border-rose-200' },
                            { status: 'sick_leave', label: 'Licença', Icon: AlertCircle, cls: 'text-blue-600 hover:bg-blue-50 border-blue-200' },
                          ].map(({ status, label, Icon, cls }) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(emp.id, status)}
                              disabled={isSaving}
                              title={label}
                              className={`p-2 rounded-xl border transition-all ${cls} ${att?.status === status ? 'ring-2 ring-offset-1' : ''}`}
                            >
                              {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Icon size={16} />}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
