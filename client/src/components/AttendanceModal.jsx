import React, { useState, useEffect } from 'react';

const AttendanceModal = ({ isOpen, onClose, offerLetterData }) => {
  if (!isOpen) return null;

  // 1. Onboarding Offer Letter Metadata 📜
  const startDate = offerLetterData?.startDate || '2026-01-01';
  const endDate = offerLetterData?.endDate || '2026-06-30';

  // 2. Dummy Monthly State Data 📊
  const totalWorkingDays = 22; // Excluding weekends & holidays
  const [unapprovedAbsences, setUnapprovedAbsences] = useState(1);
  const [approvedLeaves, setApprovedLeaves] = useState(1);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);

  // 3. Dynamic Percentage Calculation Formula 🧮
  const totalDeductions = unapprovedAbsences + approvedLeaves;
  const netPresentDays = Math.max(0, totalWorkingDays - totalDeductions);
  const attendancePercentage = ((netPresentDays / totalWorkingDays) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-6">
        
        {/* Modal Header 📌 */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">📅 My Attendance Details</h2>
            <p className="text-sm text-gray-500">
              Contract Period: <span className="font-semibold text-gray-700">{startDate}</span> to <span className="font-semibold text-gray-700">{endDate}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">
            ✕
          </button>
        </div>

        {/* Attendance Summary Stat Cards 📊 */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm font-medium text-green-700">Attendance Rate 📈</span>
            <p className="text-2xl font-bold text-green-600">{attendancePercentage}%</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-blue-700">Present Days 🟩</span>
            <p className="text-2xl font-bold text-blue-600">{netPresentDays} / {totalWorkingDays}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-sm font-medium text-amber-700">Leaves / Absences 🟡</span>
            <p className="text-2xl font-bold text-amber-600">{totalDeductions} Days</p>
          </div>
        </div>

        {/* Check-In / Check-Out Actions ⏱️ */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-bold">Today's Shift</span>
            <p className="text-sm font-semibold text-gray-700">
              {checkInTime ? `Checked In: ${checkInTime}` : 'Not Checked In'} 
              {checkOutTime ? ` | Checked Out: ${checkOutTime}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCheckInTime(new Date().toLocaleTimeString())}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm shadow transition"
            >
              🟢 Check-in
            </button>
            <button 
              onClick={() => setCheckOutTime(new Date().toLocaleTimeString())}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-sm shadow transition"
            >
              🔴 Check-out
            </button>
          </div>
        </div>

        {/* Attendance Status Legend 🏷️ */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-2">Attendance Status Key</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full font-medium">🟩 Present</span>
            <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full font-medium">🟥 Absent</span>
            <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">🟨 Leave</span>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">🟦 Holiday</span>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full font-medium">⬜ Weekend</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AttendanceModal;