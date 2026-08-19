import React, { useState, useEffect } from 'react';
import axios from '../../api/axios'; // Adjust path based on your setup
import { useAuth } from '../../context/AuthContext'; // 🔐 Global Auth Context
import AttendanceModal from '../../components/AttendanceModal'; // 📊 Popup Modal
import { 
  Calendar, Clock, AlertTriangle, Download, 
  FileEdit, CheckCircle, XCircle, Search, Filter 
} from 'lucide-react'; 

// 1. Helper to calculate total days between two dates 📅
export const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// 2. Helper to compute attendance stats 🧮
export const computeAttendanceStats = (attendanceRecords = [], leaveHistory = [], totalWorkingDays = 22) => {
  const presentDays = attendanceRecords.filter(r => r.status === 'Present').length;

  const approvedLeaveDays = leaveHistory
    .filter(leave => leave.status === 'Approved')
    .reduce((sum, leave) => sum + calculateDays(leave.startDate, leave.endDate), 0);

  const unapprovedAbsences = attendanceRecords.filter(r => r.status === 'Absent').length;

  const effectivePresentDays = Math.min(totalWorkingDays, presentDays + approvedLeaveDays);
  const attendanceRate = ((effectivePresentDays / totalWorkingDays) * 100).toFixed(1);

  return {
    presentDays,
    approvedLeaveDays,
    unapprovedAbsences,
    totalWorkingDays,
    attendanceRate: Math.min(100, parseFloat(attendanceRate))
  };
};

export function AttendancePage() {

  // 🔐 Pull user profile and offer letter details from Auth
  const { user } = useAuth();

  const offerLetterData = {
    startDate: user?.offerLetter?.startDate || '2026-01-01',
    endDate: user?.offerLetter?.endDate || '2026-06-30',
  };

  // State Management 📊
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  
  // Pop-up Summary Modal State 👁️
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  
  // Filters & Month Selection
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Stats
  const [stats, setStats] = useState({
    attendanceRate: 100,
    daysPresent: 0,
    totalRecords: 0,
    workingHoursTotal: 0
  });

  // Correction Request Modal States
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({ checkIn: '', checkOut: '', reason: '' });

  // 🛠️ Developer Testing Reset Handler (Independent Top Level)
  const handleDevReset = async () => {
    try {
      const res = await axios.delete('/attendance/reset-today');
      alert('Database Cleared! You can now test Check-In again. 🔄');
      
      setIsCheckedIn(false);
      setTodayRecord(null);
      
      await fetchAttendance(); // Fetch fresh data from backend
    } catch (err) {
      console.error('Reset Error:', err.response?.data || err);
      alert(err.response?.data?.message || 'Failed to reset attendance in database.');
    }
  };

  // 📡 Fetch Attendance Data & Auto-Detect Check-In Status
  const fetchAttendance = async () => {
    try {
      setLoading(true);

      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      const res = await axios.get(`/attendance?from=${startDate}&to=${endDate}&limit=100`);
      
      const rawData = res.data?.data?.records || res.data?.records || res.data?.data || res.data || [];
      const data = Array.isArray(rawData) ? rawData : [];

      setAttendance(data);

      const todayDateString = new Date().toLocaleDateString();
      
      const today = data.find(rec => {
        if (!rec?.date && !rec?.createdAt) return false;
        const recDateString = new Date(rec.date || rec.createdAt).toLocaleDateString();
        return recDateString === todayDateString;
      });

      if (today) {
        setTodayRecord(today);
        const hasCheckedIn = Boolean(today.checkIn && !today.checkOut);
        setIsCheckedIn(hasCheckedIn);
      } else {
        setIsCheckedIn(false);
        setTodayRecord(null);
      }

      const presentDays = data.filter(r => r.status === 'Present' || r.status === 'present').length;
      const totalRecordsCount = data.length;
      const rate = totalRecordsCount > 0 ? Math.round((presentDays / totalRecordsCount) * 100) : 100;
      
      setStats({
        daysPresent: presentDays,
        totalRecords: totalRecordsCount,
        attendanceRate: isNaN(rate) ? 100 : rate,
      });

    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      setAttendance([]); 
    } finally {
      setLoading(false);
    }
  };

  // Fetch Attendance Data on Month Change 📡
  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth]);

  // 2. Check-In / Check-Out 🟢🔴
  const handleCheckIn = async () => {
    try {
      const res = await axios.post('/attendance/check-in');
      setIsCheckedIn(true);
      alert('Checked in successfully! 🟢 Have a productive day!');
      fetchAttendance();
    } catch (err) {
      console.error('Check-in error response:', err.response?.data);
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await axios.post('/attendance/check-out');
      alert('Checked out successfully! 🔴 Great work today!');
      fetchAttendance();
    } catch (err) {
      console.error('Check-out error response:', err.response?.data);
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  // 3. Correction Request Logic 📝
  const handleOpenCorrection = (record) => {
    setSelectedRecord(record);
    setCorrectionForm({
      checkIn: record.checkIn ? new Date(record.checkIn).toISOString().slice(11, 16) : '',
      checkOut: record.checkOut ? new Date(record.checkOut).toISOString().slice(11, 16) : '',
      reason: ''
    });
    setIsCorrectionModalOpen(true);
  };

  const submitCorrectionRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/attendance/${selectedRecord._id}/correction`, correctionForm);
      alert('Correction request submitted for approval!');
      setIsCorrectionModalOpen(false);
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed');
    }
  };

  // 4. Export CSV Report 📥
  const exportReport = () => {
    const headers = "Date,Status,Check In,Check Out,Working Hours\n";
    const rows = attendance.map(r => 
      `${new Date(r.date).toLocaleDateString()},${r.status},${r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-'},${r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-'},${r.workingHours || 0}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_Report_${selectedMonth}.csv`;
    a.click();
  };

  // Helper Badge Colors 🏷️
  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-green-100 text-green-800 border-green-200',
      half_day: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      leave: 'bg-amber-100 text-amber-800 border-amber-200',
      Present: 'bg-green-100 text-green-800 border-green-200',
      Absent: 'bg-red-100 text-red-800 border-red-200',
      Leave: 'bg-amber-100 text-amber-800 border-amber-200',
      Holiday: 'bg-blue-100 text-blue-800 border-blue-200',
      Weekend: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status}
      </span>
    );
  };

  // Filtered List
  const filteredAttendance = attendance.filter(item => {
    if (statusFilter === 'All') return true;
    return item.status === statusFilter;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      
      {/* Dev Reset Button */}
      {import.meta.env.DEV && (
        <button 
          onClick={handleDevReset}
          className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg hover:bg-rose-100 transition flex items-center gap-1 shadow-sm"
        >
          <span>🔄</span> Dev Reset
        </button>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Internship Contract: <span className="font-semibold text-gray-700">{offerLetterData.startDate}</span> to <span className="font-semibold text-gray-700">{offerLetterData.endDate}</span>
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setIsSummaryModalOpen(true)}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
            >
              <span>📊</span> Quick Summary
            </button>

            <button 
              onClick={handleCheckIn}
              disabled={isCheckedIn}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
                isCheckedIn 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-not-allowed opacity-80' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {isCheckedIn ? '✅ Checked In Today' : '🟢 Check In'}
            </button>
              
            <button 
              onClick={handleCheckOut}
              disabled={!isCheckedIn || Boolean(todayRecord?.checkOut)}
              className={`px-4 py-2 rounded-lg font-medium text-sm text-white transition flex items-center gap-2 ${
                todayRecord?.checkOut
                  ? 'bg-red-100 text-red-700 border border-red-300 cursor-not-allowed opacity-80'
                  : !isCheckedIn 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
              }`}
            >
              {todayRecord?.checkOut ? '🔴 Checked Out' : '🔴 Check Out'}
            </button>
          </div>

          {isCheckedIn && (
            <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>●</span> Active Shift: You have already checked in for today!
            </p>
          )}
        </div>
      </div>

      {/* Low Attendance Warning Alert ⚠️ */}
      {stats.attendanceRate < 75 && stats.totalRecords > 5 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600 h-5 w-5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Low Attendance Warning</p>
              <p className="text-xs text-amber-700">Your attendance rate is {stats.attendanceRate}%. Please maintain at least 75% compliance.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview Cards 📈 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.attendanceRate}%</h3>
            <p className="text-xs text-gray-500 font-medium">Monthly Rate</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.daysPresent}</h3>
            <p className="text-xs text-gray-500 font-medium">Days Present</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalRecords}</h3>
            <p className="text-xs text-gray-500 font-medium">Total Records</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <span>📜</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">{offerLetterData.startDate}</h3>
            <p className="text-xs text-gray-500 font-medium">Start Date</p>
          </div>
        </div>
      </div>

      {/* Toolbar 🛠️ */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
            <option value="Holiday">Holiday</option>
            <option value="Weekend">Weekend</option>
          </select>
        </div>

        <button 
          onClick={exportReport}
          className="flex items-center gap-2 text-sm border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg text-gray-700 transition"
        >
          <Download className="h-4 w-4" /> Export Report
        </button>
      </div>

      {/* Attendance History Table 📋 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading attendance data...</div>
        ) : filteredAttendance.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No attendance records</h3>
            <p className="text-xs text-gray-400 mt-1">Check in or change your filters to view tracking data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Check In</th>
                  <th className="p-4">Check Out</th>
                  <th className="p-4">Working Hours</th>
                  <th className="p-4">Correction / Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredAttendance.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-medium text-gray-800">
                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4">{getStatusBadge(record.status)}</td>
                    <td className="p-4 text-gray-600">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="p-4 text-gray-600">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="p-4 text-gray-600 font-medium">
                      {record.workingHours ? `${record.workingHours.toFixed(1)} hrs` : '0 hrs'}
                    </td>
                    <td className="p-4">
                      {record.correctionRequest?.status === 'Pending' ? (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium">Request Pending</span>
                      ) : record.correctionRequest?.status === 'Approved' ? (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium">Corrected</span>
                      ) : (
                        <button 
                          onClick={() => handleOpenCorrection(record)}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1"
                        >
                          <FileEdit className="h-3.5 w-3.5" /> Request Fix
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Pop-up Modal */}
      <AttendanceModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        offerLetterData={offerLetterData}
      />

      {/* Correction Request Modal 📝 */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Attendance Correction Request</h2>
            <p className="text-xs text-gray-500 mb-4">Select the correct check-in/out time and submit for manager review.</p>
            
            <form onSubmit={submitCorrectionRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Check In Time</label>
                <input 
                  type="time" 
                  value={correctionForm.checkIn}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, checkIn: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Check Out Time</label>
                <input 
                  type="time" 
                  value={correctionForm.checkOut}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, checkOut: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Request</label>
                <textarea 
                  rows="3"
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  placeholder="e.g., Forgot to check out, system network issue"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AttendancePage;