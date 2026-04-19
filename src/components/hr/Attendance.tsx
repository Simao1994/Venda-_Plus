// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import {
  Calendar, CheckCircle2, XCircle, Clock, AlertCircle,
  RefreshCw, TrendingUp, Users, Download, ChevronLeft, ChevronRight
} from 'lucide-react';

const STATUS_CONFIG = {
  present: { label: 'Presente', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2, dot: 'bg-emerald-400' },
  absent: { label: 'Faltou', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: XCircle, dot: 'bg-rose-400' },
  late: { label: 'Atrasado', color: 'bg-gold-primary/10 text-gold-primary border-gold-primary/20', icon: Clock, dot: 'bg-gold-primary' },
  sick_leave: { label: 'Licença', color: 'bg-gold-primary/10 text-gold-primary border-gold-primary/20', icon: AlertCircle, dot: 'bg-gold-primary' },
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
        api.get('/api/hr/employees?status=active').then(r => r.json()),
        api.get(`/api/hr/attendance?date=${date}`).then(r => r.json())
      ]);
      const emps = empRes || [];
      const atts = attRes || [];
      setEmployees(emps);
      setAttendance(atts);
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

      const res = await api.post('/api/hr/attendance', payload);
      if (!res.ok) throw new Error('Falha ao registar presença');
      await fetchData();
    } catch (err) {
      console.error('Erro ao registar presença:', err);
      alert('Erro ao guardar presença.');
    } finally {
      setSaving(null);
    }
  };

  const getAtt = (id: number) => attendance.find(a => a.employee_id === id);

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
    <div className="p-8 space-y-8 max-w-7xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Controlo de Presenças</h2>
          <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Registe a assiduidade diária da sua equipa</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gold-primary/20 text-gold-primary rounded-xl text-xs font-black uppercase tracking-widest border border-gold-primary/30 hover:bg-gold-primary/30 transition-all"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Presentes', value: presentCount, color: 'from-emerald-500/30 to-emerald-600/10', border: 'border-emerald-500/20', icon: CheckCircle2, textColor: 'text-emerald-400' },
          { label: 'Faltas', value: absentCount, color: 'from-rose-500/30 to-rose-600/10', border: 'border-rose-500/20', icon: XCircle, textColor: 'text-rose-400' },
          { label: 'Atrasados', value: lateCount, color: 'from-gold-primary/30 to-gold-secondary/10', border: 'border-gold-primary/20', icon: Clock, textColor: 'text-gold-primary' },
          { label: 'Por registar', value: unregistered, color: 'from-white/10 to-white/5', border: 'border-white/10', icon: AlertCircle, textColor: 'text-white/50' },
        ].map(stat => (
          <div key={stat.label} className={`glass-panel bg-gradient-to-br ${stat.color} rounded-2xl p-5 border ${stat.border}`}>
            <stat.icon size={20} className={`mb-2 ${stat.textColor}`} />
            <div className={`text-3xl font-black ${stat.textColor}`}>{stat.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Date navigator */}
      <div className="glass-panel rounded-[2rem] border border-white/5 p-4 flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/30">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-gold-primary" />
          <div className="text-center">
            <p className="text-sm font-black text-white capitalize">{formattedDate}</p>
          </div>
          <input
            type="date"
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:ring-2 focus:ring-gold-primary focus:outline-none"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <button onClick={() => changeDate(1)} disabled={date >= new Date().toISOString().split('T')[0]} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/30 disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="animate-spin text-gold-primary" size={28} />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="text-white/10 mx-auto mb-3" />
            <p className="font-bold text-white/30">Nenhum funcionário activo encontrado.</p>
            <p className="text-sm text-white/15">Adicione funcionários no separador "Funcionários".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/20 text-[10px] uppercase tracking-widest font-black">
                <tr>
                  <th className="px-6 py-4">Funcionário</th>
                  <th className="px-6 py-4">Status Actual</th>
                  <th className="px-6 py-4">Entrada</th>
                  <th className="px-6 py-4">Saída</th>
                  <th className="px-6 py-4 text-right">Marcar Presença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {employees.map(emp => {
                  const att = getAtt(emp.id);
                  const cfg = att ? STATUS_CONFIG[att.status as keyof typeof STATUS_CONFIG] : null;
                  const isSaving = saving === emp.id;
                  const initials = (emp.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <tr key={emp.id} className={`hover:bg-white/5 transition-colors ${isSaving ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-primary/30 to-gold-secondary/20 flex items-center justify-center text-gold-primary font-black text-xs border border-gold-primary/20">
                            {initials}
                          </div>
                          <div>
                            <div className="font-black text-white text-sm">{emp.name}</div>
                            <div className="text-xs text-white/30 font-medium">{emp.position}</div>
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
                          <span className="text-xs text-white/15 font-medium italic">Não registado</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="time"
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white w-24 focus:ring-2 focus:ring-gold-primary focus:outline-none"
                          value={checkTimes[emp.id]?.in || '08:00'}
                          onChange={e => setCheckTimes(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], in: e.target.value } }))}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="time"
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white w-24 focus:ring-2 focus:ring-gold-primary focus:outline-none"
                          value={checkTimes[emp.id]?.out || '17:00'}
                          onChange={e => setCheckTimes(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], out: e.target.value } }))}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1.5">
                          {[
                            { status: 'present', label: 'Presente', Icon: CheckCircle2, cls: 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20' },
                            { status: 'late', label: 'Atrasado', Icon: Clock, cls: 'text-gold-primary hover:bg-gold-primary/10 border-gold-primary/20' },
                            { status: 'absent', label: 'Faltou', Icon: XCircle, cls: 'text-rose-400 hover:bg-rose-500/10 border-rose-500/20' },
                            { status: 'sick_leave', label: 'Licença', Icon: AlertCircle, cls: 'text-gold-primary hover:bg-gold-primary/10 border-gold-primary/20' },
                          ].map(({ status, label, Icon, cls }) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(emp.id, status)}
                              disabled={isSaving}
                              title={label}
                              className={`p-2 rounded-xl border transition-all ${cls} ${att?.status === status ? 'ring-2 ring-offset-1 ring-offset-transparent' : ''}`}
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


