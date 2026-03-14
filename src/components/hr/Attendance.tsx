import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function Attendance() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        fetch('/api/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/hr/attendance?date=${date}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const empData = await empRes.json();
      const attData = await attRes.json();
      setEmployees(empData.filter((e: any) => e.status === 'active'));
      setAttendance(attData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (employeeId: number, status: string) => {
    try {
      const res = await fetch('/api/hr/attendance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: employeeId,
          date,
          status,
          check_in: status === 'present' ? '08:00' : null,
          check_out: status === 'present' ? '17:00' : null
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const getAttendanceForEmployee = (employeeId: number) => {
    return attendance.find(a => a.employee_id === employeeId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Controle de Presenças</h2>
          <p className="text-gray-500">Registre a entrada e saída dos funcionários</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border shadow-sm">
          <Calendar size={20} className="text-indigo-600 ml-2" />
          <input 
            type="date" 
            className="border-none focus:ring-0 font-bold text-gray-700"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Funcionário</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Entrada</th>
                <th className="px-6 py-4 font-bold">Saída</th>
                <th className="px-6 py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => {
                const att = getAttendanceForEmployee(emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="font-bold text-gray-900 text-sm">{emp.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {att ? (
                        <span className={`flex items-center gap-1 text-xs font-bold ${
                          att.status === 'present' ? 'text-emerald-600' :
                          att.status === 'absent' ? 'text-rose-600' :
                          att.status === 'late' ? 'text-amber-600' : 'text-blue-600'
                        }`}>
                          {att.status === 'present' ? <CheckCircle2 size={14} /> :
                           att.status === 'absent' ? <XCircle size={14} /> :
                           att.status === 'late' ? <Clock size={14} /> : <AlertCircle size={14} />}
                          {att.status === 'present' ? 'Presente' :
                           att.status === 'absent' ? 'Faltou' :
                           att.status === 'late' ? 'Atrasado' : 'Licença'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium italic">Não registrado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{att?.check_in || '--:--'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{att?.check_out || '--:--'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleStatusChange(emp.id, 'present')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Presente"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleStatusChange(emp.id, 'absent')}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Faltou"
                        >
                          <XCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleStatusChange(emp.id, 'late')}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Atrasado"
                        >
                          <Clock size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
