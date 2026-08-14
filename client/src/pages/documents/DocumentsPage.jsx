import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { documentApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useToast } from '../../context/ToastContext';

const DOC_TYPES = [
  { value: 'resume', label: 'Resume' },
  { value: 'college_id', label: 'College ID' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'joining_doc', label: 'Joining Document' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'task_doc', label: 'Task Document' },
  { value: 'performance_report', label: 'Performance Report' },
  { value: 'other', label: 'Other' },
];

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export const DocumentsPage = () => {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('resume');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading, isError } = useQuery({ queryKey: ['documents'], queryFn: () => documentApi.list().then((r) => r.data.data) });

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file.');
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('type', type);
      fd.append('file', file);
      await documentApi.upload(fd);
      showToast('Document uploaded');
      setFile(null);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['documents'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    await documentApi.remove(id);
    showToast('Document deleted');
    qc.invalidateQueries({ queryKey: ['documents'] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Documents</h1>
        <Button onClick={() => setShowForm(true)}><Upload size={16} /> Upload Document</Button>
      </div>

      {isLoading ? (
        <Skeleton rows={4} cols={3} />
      ) : isError ? (
        <ErrorState />
      ) : data?.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((d) => (
            <Card key={d._id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><FileText size={18} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{d.fileName}</p>
                <p className="text-xs text-slate-400 capitalize">{d.type.replace(/_/g, ' ')}</p>
              </div>
              <a href={`${API_ORIGIN}${d.filePath}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-brand-600"><Download size={16} /></a>
              <button onClick={() => remove(d._id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
            </Card>
          ))}
        </div>
      ) : (
        <Card><EmptyState icon={FileText} title="No documents uploaded" message="Upload resumes, IDs, or other files here." /></Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Upload Document">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={upload} className="space-y-4">
          <Select label="Document type" value={type} onChange={(e) => setType(e.target.value)} options={DOC_TYPES} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
            <p className="text-xs text-slate-400 mt-1">Max 10MB. PDF, Word, images, or archives.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Upload</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
