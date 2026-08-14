import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, CalendarCheck } from 'lucide-react';
import { attendanceApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { StatCard } from '../../components/StatCard';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AttendancePage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const isIntern = user.role === 'intern';

  const { data, isLoading, isError } = useQuery({ queryKey: ['attendance'], queryFn: () => attendanceApi.list({ limit: 60 }).then((r) => r.data.data) });
  const { data: summary } = useQuery({ queryKey: ['attendance-summary'], queryFn: () => attendanceApi.summary().then((r) => r.data.data), enabled: isIntern });

  const today = new Date().toDateString();
  const todayRecord = data?.records?.find((r) => new Date(r.date).toDateString() === today);

  const handleCheckIn = async () => {
    try {
      await attendanceApi.checkIn();
      showToast('Checked in successfully');
      qc.invalidateQueries({ queryKey: ['attendance'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not check in', 'error');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceApi.checkOut();
      showToast('Checked out successfully');
      qc.invalidateQueries({ queryKey: ['attendance'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not check out', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Attendance</h1>
          <p className="text-sm text-slate-500">{isIntern ? 'Track your daily check-ins' : 'Team attendance records'}</p>
        </div>
        {isIntern && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCheckIn} disabled={Boolean(todayRecord?.checkIn)}><LogIn size={16} /> Check In</Button>
            <Button onClick={handleCheckOut} disabled={!todayRecord?.checkIn || Boolean(todayRecord?.checkOut)}><LogOut size={16} /> Check Out</Button>
          </div>
        )}
      </div>

      {isIntern && summary && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Attendance Rate" value={`${summary.percentage}%`} icon={CalendarCheck} />
          <StatCard label="Days Present" value={summary.present} accent="text-emerald-600 bg-emerald-50" icon={CalendarCheck} />
          <StatCard label="Total Records" value={summary.total} accent="text-slate-600 bg-slate-100" icon={CalendarCheck} />
        </div>
      )}

      <Card>
        {isLoading ? (
          <Skeleton rows={6} cols={5} />
        ) : isError ? (
          <ErrorState />
        ) : data?.records?.length ? (
          <Table columns={isIntern ? ['Date', 'Check In', 'Check Out', 'Hours', 'Status'] : ['Intern', 'Date', 'Check In', 'Check Out', 'Status']}>
            {data.records.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50">
                {!isIntern && <td className="px-4 py-3 font-medium text-slate-700">{r.intern?.fullName}</td>}
                <td className="px-4 py-3 text-slate-600">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-600">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '—'}</td>
                <td className="px-4 py-3 text-slate-600">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—'}</td>
                {isIntern && <td className="px-4 py-3 text-slate-600">{r.workingHours ?? '—'}</td>}
                <td className="px-4 py-3"><Badge value={r.status} /></td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState icon={CalendarCheck} title="No attendance records" message={isIntern ? 'Check in to start tracking your attendance.' : 'No records for your team yet.'} />
        )}
      </Card>
    </div>
  );
};
