// src/pages/leaves/LeavesPage.jsx
import React, { useState } from 'react';
import { Calendar, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LeavesPage() {
  const { user } = useAuth();
  
  // Check if logged-in user is Admin / HR / Team Lead
  const isAdminOrHR = ['super_admin', 'hr', 'team_lead'].includes(user?.role);

  // Modal State for Applying Leave 📝
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Leave Form Fields 📋
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Leave Balance Summary Data 📊
  const [leaveBalance, setLeaveBalance] = useState({
    total: 12,
    used: 2,
    remaining: 10,
  });

  // Dummy Leave History Data 📜
  const [leaveHistory, setLeaveHistory] = useState([
    {
      id: 'leave-01',
      _id: 'leave-01',
      applicantName: 'Rahul Verma',
      leaveType: 'Medical',
      startDate: '2026-03-10',
      endDate: '2026-03-11',
      reason: 'Fever and viral infection',
      status: 'Approved',
    },
    {
      id: 'leave-02',
      _id: 'leave-02',
      applicantName: 'Payal Shirbhhate',
      leaveType: 'Casual',
      startDate: '2026-04-05',
      endDate: '2026-04-05',
      reason: 'Personal family function',
      status: 'Pending',
    },
  ]);

  // Status Action Handler (Approve / Reject) ⚡
  const handleStatusUpdate = async (leaveId, status) => {
    try {
      // Backend API Integration call
      const res = await fetch(`/api/leaves/${leaveId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          decision: status.toLowerCase(), // 'approved' or 'rejected'
          reviewComment: status === 'approved' ? 'Approved by Admin' : 'Rejected by Admin'
        })
      });

      if (res.ok) {
        setLeaveHistory((prev) =>
          prev.map((item) =>
            (item._id === leaveId || item.id === leaveId)
              ? { ...item, status: status === 'approved' ? 'Approved' : 'Rejected' }
              : item
          )
        );
      } else {
        // Fallback for local UI testing if backend API is not linked yet
        setLeaveHistory((prev) =>
          prev.map((item) =>
            (item._id === leaveId || item.id === leaveId)
              ? { ...item, status: status === 'approved' ? 'Approved' : 'Rejected' }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating leave status:', error);
      // Fallback UI update
      setLeaveHistory((prev) =>
        prev.map((item) =>
          (item._id === leaveId || item.id === leaveId)
            ? { ...item, status: status === 'approved' ? 'Approved' : 'Rejected' }
            : item
        )
      );
    }
  };

  // Handle Leave Submission 🚀
  const handleApplyLeave = (e) => {
    e.preventDefault();
    const newRecord = {
      id: `leave-0${leaveHistory.length + 1}`,
      _id: `leave-0${leaveHistory.length + 1}`,
      applicantName: user?.name || 'Current User',
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      status: 'Pending',
    };

    setLeaveHistory([newRecord, ...leaveHistory]);
    setLeaveBalance({ ...leaveBalance, used: leaveBalance.used + 1, remaining: leaveBalance.remaining - 1 });
    setIsApplyModalOpen(false);
    setLeaveForm({ leaveType: 'Casual', startDate: '', endDate: '', reason: '' });
    alert('Leave application submitted successfully! 🏖️');
  };

  // Helper Badge Colors 🏷️
  const getStatusBadge = (status) => {
    const styles = {
      Approved: 'bg-green-100 text-green-800 border-green-200',
      Pending: 'bg-amber-100 text-amber-800 border-amber-200',
      Rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles['Pending']}`}>{status}</span>;
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management 🏖️</h1>
          <p className="text-sm text-gray-500 mt-1">
            Apply for leaves, track your balances, and view approval statuses.
          </p>
        </div>
        
        {/* Trigger Apply Leave Modal Button ➕ */}
        <button 
          onClick={() => setIsApplyModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition flex items-center gap-2 shadow-md"
        >
          <PlusCircle className="h-4 w-4" /> Apply For Leave
        </button>
      </div>

      {/* Leave Balance Summary Cards 📊 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{leaveBalance.total} Days</h3>
            <p className="text-xs text-gray-500 font-medium">Total Allocated Leaves</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{leaveBalance.remaining} Days</h3>
            <p className="text-xs text-gray-500 font-medium">Remaining Balance 🌿</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{leaveBalance.used} Days</h3>
            <p className="text-xs text-gray-500 font-medium">Leaves Taken / Used</p>
          </div>
        </div>
      </div>

      {/* Leave History Table 📋 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-base">
            {isAdminOrHR ? 'All Team Leave Requests 📜' : 'My Leave History 📜'}
          </h3>
        </div>
        
        {leaveHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No leave requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {isAdminOrHR && <th className="p-4">Intern Name</th>}
                  <th className="p-4">Leave Type</th>
                  <th className="p-4">From Date</th>
                  <th className="p-4">To Date</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  {isAdminOrHR && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {leaveHistory.map((leave) => (
                  <tr key={leave._id || leave.id} className="hover:bg-slate-50/50 transition">
                    {isAdminOrHR && (
                      <td className="p-4 font-semibold text-slate-800">{leave.applicantName || 'Intern'}</td>
                    )}
                    <td className="p-4 font-medium text-gray-700">{leave.leaveType}</td>
                    <td className="p-4 text-gray-600">{leave.startDate}</td>
                    <td className="p-4 text-gray-600">{leave.endDate}</td>
                    <td className="p-4 text-gray-600 max-w-xs truncate">{leave.reason}</td>
                    <td className="p-4">{getStatusBadge(leave.status)}</td>

                    {/* Actions Column for Admin/HR */}
                    {isAdminOrHR && (
                      <td className="p-4 text-right">
                        {leave.status === 'Pending' || leave.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStatusUpdate(leave._id || leave.id, 'approved')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center gap-1 transition shadow-sm"
                            >
                              Approve
                            </button>

                            <button
                              onClick={() => handleStatusUpdate(leave._id || leave.id, 'rejected')}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md flex items-center gap-1 transition shadow-sm"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium capitalize">
                            {leave.status}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal Form 📝 */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800">🏖️ Apply for Leave</h2>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            </div>
            
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Leave Type</label>
                <select 
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Casual">Casual Leave</option>
                  <option value="Medical">Medical Leave</option>
                  <option value="Paid">Paid Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Reason for Leave</label>
                <textarea 
                  rows="3"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Provide a brief explanation for your absence..."
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
                >
                  Submit Application 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default LeavesPage;