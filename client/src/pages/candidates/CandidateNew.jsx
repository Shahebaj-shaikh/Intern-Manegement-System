import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { candidateApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { CandidateFormFields } from './CandidateFormFields';

const empty = {
  fullName: '', email: '', phone: '', degree: '', institution: '', branch: '', graduationYear: '',
  skills: '', source: 'other', profileSummary: '', resumeFile: null,
};

export const CandidateNew = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'resumeFile') { if (v) fd.append('resume', v); }
        else if (v !== '' && v !== null) fd.append(k, v);
      });
      const { data } = await candidateApi.create(fd);
      showToast('Candidate added successfully');
      navigate(`/candidates/${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create candidate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      <Link to="/candidates" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to candidates
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><UserPlus size={20} /></div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Add Candidate</h1>
          <p className="text-sm text-slate-500">Add someone to the recruitment pipeline</p>
        </div>
      </div>

      <Card className="p-6">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={onSubmit} className="space-y-6">
          <CandidateFormFields form={form} setForm={setForm} />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => navigate('/candidates')}>Cancel</Button>
            <Button type="submit" loading={loading}>Add candidate</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
