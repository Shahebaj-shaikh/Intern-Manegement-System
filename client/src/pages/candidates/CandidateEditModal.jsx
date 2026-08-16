import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { candidateApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { CandidateFormFields } from './CandidateFormFields';

export const CandidateEditModal = ({ open, onClose, onSaved, candidate }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (candidate) {
      setForm({
        fullName: candidate.fullName || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        degree: candidate.education?.degree || '',
        institution: candidate.education?.institution || '',
        branch: candidate.education?.branch || '',
        graduationYear: candidate.education?.graduationYear || '',
        skills: (candidate.skills || []).join(', '),
        source: candidate.source || 'other',
        profileSummary: candidate.profileSummary || '',
        resumeFile: null,
      });
    }
  }, [candidate, open]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'resumeFile') { if (v) fd.append('resume', v); }
        else if (v !== null) fd.append(k, v);
      });
      await candidateApi.update(candidate._id, fd);
      showToast('Candidate updated successfully');
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update candidate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Candidate" width="max-w-2xl">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-6">
        <CandidateFormFields form={form} setForm={setForm} isEdit existingResumeName={candidate?.resume?.fileName} />
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save changes</Button>
        </div>
      </form>
    </Modal>
  );
};
