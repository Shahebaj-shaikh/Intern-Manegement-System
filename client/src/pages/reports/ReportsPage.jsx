import { useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import api from '../../api/axios';

const REPORTS = [
  { key: 'interns', label: 'Intern List Report', desc: 'All interns with department, status, and team lead info.' },
  { key: 'attendance', label: 'Attendance Report', desc: 'Daily check-in/check-out records across interns.' },
  { key: 'leaves', label: 'Leave Report', desc: 'All leave requests and their approval status.' },
  { key: 'tasks', label: 'Task Report', desc: 'Task assignments, priorities, and statuses.' },
  { key: 'performance', label: 'Performance Report', desc: 'Evaluation scores and feedback per intern.' },
];

export const ReportsPage = () => {
  const [downloading, setDownloading] = useState('');

  const download = async (key, format) => {
    setDownloading(key + format);
    try {
      const res = await api.get(`/reports/${key}`, { params: { format }, responseType: format === 'csv' ? 'blob' : 'json' });
      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${key}-report.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${key}-report.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-500">Export data as CSV or JSON for offline analysis.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <Card key={r.key} className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><BarChart3 size={17} /></div>
              <h3 className="font-medium text-slate-800">{r.label}</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">{r.desc}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => download(r.key, 'csv')} loading={downloading === r.key + 'csv'}><Download size={14} /> CSV</Button>
              <Button variant="secondary" onClick={() => download(r.key, 'json')} loading={downloading === r.key + 'json'}><Download size={14} /> JSON</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
