import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { 
  Users, CheckCircle2, Clock, AlertCircle, 
  Search, Calendar, Filter, Download, PlusCircle, Check, X 
} from 'lucide-react';

export function AdminAttendancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    pendingCorrections: 0
  });

  // Modal States 📊
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [adminComment, setAdminComment] = useState('');

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    internId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkIn: '',
    checkOut: '',
    remark: ''
  });

  // Fetch Admin Attendance Data 📡
  const fetchAdminAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/attendance/admin/all?date=${selectedDate}&status=${statusFilter}`);
      const fetchedRecords = res.data?.data?.records || [];
      setRecords(fetchedRecords);

      // Compute Stats 📊
      const presentCount = fetchedRecords.filter(r => r.status === 'Present').length;
      const absentCount = fetchedRecords.filter(r => r.status === 'Absent').length;
      const pendingCount = fetchedRecords.filter(r => r.correctionRequest?.status === 'Pending').length;

      setStats({
        total: fetchedRecords.length,
        present: presentCount,
        absent: absentCount,
        pendingCorrections: pendingCount
      });
    } catch (err) {
      console.error('Failed to fetch admin attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminAttendance();
  }, [selectedDate, statusFilter]);

  // Handle Correction Approval / Rejection 📝
  const handleCorrectionAction = async (action) => {
    try {
      await axios.patch(`/attendance/admin/correction/${selectedRecord._id}`, {
        action,
        adminComment
      });
      alert(`Correction request ${action.toLowerCase()} successfully!`);
      setIsReviewModalOpen(false);
      setAdminComment('');
      fetchAdminAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process request');
    }
  };

  // Submit Manual Attendance Entry ✍️
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/attendance/admin/manual', manualForm);
      alert('Manual attendance recorded successfully!');
      setIsManualModalOpen(false);
      setManualForm({ internId: '', date: selectedDate, status: 'Present', checkIn: '', checkOut: '', remark: '' });
      fetchAdminAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record manual attendance');
    }
  };

  // Filter Search Results
  const filteredRecords = records.filter(r => 
    r.intern?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.intern?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Team Attendance Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor, review, and manage intern daily attendance logs.</p>
        </div>

        <button 
          onClick={() => setIsManualModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
        >
          <PlusCircle className="h-4 w-4" /> Manual Attendance / Leave
        </button>
      </div>

      {/* Overview Stat Cards 📈 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
            <p className="text-xs text-gray-500 font-medium">Total Tracked Today</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.present}</h3>
            <p className="text-xs text-gray-500 font-medium">Present Today</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.absent}</h3>
            <p className="text-xs text-gray-500 font-medium">Absent / Unmarked</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.pendingCorrections}</h3>
            <p className="text-xs text-gray-500 font-medium">Pending Corrections</p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters 🛠️ */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search intern name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
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
          </select>
        </div>
      </div>

      {/* Table Section 📋 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading team attendance...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No attendance records found for this date.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Intern</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Check In</th>
                  <th className="p-4">Check Out</th>
                  <th className="p-4">Working Hours</th>
                  <th className="p-4">Action / Request</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {r.intern?.name?.charAt(0) || 'I'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{r.intern?.name || 'Unknown Intern'}</p>
                        <p className="text-xs text-gray-400">{r.intern?.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        r.status === 'Present' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="p-4 text-gray-600">
                      {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      {r.workingHours ? `${r.workingHours} hrs` : '0 hrs'}
                    </td>
                    <td className="p-4">
                      {r.correctionRequest?.status === 'Pending' ? (
                        <button 
                          onClick={() => { setSelectedRecord(r); setIsReviewModalOpen(true); }}
                          className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-lg text-xs transition flex items-center gap-1 shadow-sm"
                        >
                          <span>⚠️ Review Fix</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Regular Record</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Review Correction Request 📝 */}
      {isReviewModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Review Correction Request</h2>
            <p className="text-xs text-gray-500 mb-4">Request from <span className="font-semibold text-gray-700">{selectedRecord.intern?.name}</span></p>

            <div className="space-y-3 bg-slate-50 p-3 rounded-lg text-xs border border-slate-200 mb-4">
              <p><strong>Reason:</strong> {selectedRecord.correctionRequest?.reason || 'No reason specified'}</p>
              <p><strong>Current Check-In:</strong> {selectedRecord.checkIn ? new Date(selectedRecord.checkIn).toLocaleTimeString() : 'N/A'}</p>
              <p><strong>Current Check-Out:</strong> {selectedRecord.checkOut ? new Date(selectedRecord.checkOut).toLocaleTimeString() : 'N/A'}</p>
            </div>

            <textarea 
              rows="3"
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="Admin comment / note (Optional)"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsReviewModalOpen(false)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleCorrectionAction('Rejected')}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
              <button 
                onClick={() => handleCorrectionAction('Approved')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
              >
                <Check className="h-3.5 w-3.5" /> Approve Fix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Manual Attendance / Leave Entry ✍️ */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Manual Attendance Entry</h2>
            <p className="text-xs text-gray-500 mb-4">Override or record manual attendance/leave for an intern.</p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Select Record (or Target Intern ID)</label>
                <select 
                  value={manualForm.internId}
                  onChange={(e) => setManualForm({ ...manualForm, internId: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Intern --</option>
                  {records.map(r => (
                    <option key={r.intern?._id} value={r.intern?._id}>{r.intern?.name} ({r.intern?.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                  <option value="Holiday">Holiday</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remark / Reason</label>
                <input 
                  type="text"
                  placeholder="e.g. Approved leave, Official Duty"
                  value={manualForm.remark}
                  onChange={(e) => setManualForm({ ...manualForm, remark: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button 
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminAttendancePage;