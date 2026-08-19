import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Textarea } from '../../components/Textarea';

const SOURCES = [
  { value: 'referral', label: 'Referral' },
  { value: 'job_portal', label: 'Job Portal' },
  { value: 'campus', label: 'Campus Drive' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'company_website', label: 'Company Website' },
  { value: 'other', label: 'Other' },
];

export const CandidateFormFields = ({ form, setForm, isEdit, existingResumeName }) => {
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Input label="Full name" required value={form.fullName} onChange={update('fullName')} className="sm:col-span-2" />
      <Input label="Email" type="email" required value={form.email} onChange={update('email')} />
      <Input label="Phone" value={form.phone} onChange={update('phone')} />

      <Input label="Degree" value={form.degree} onChange={update('degree')} />
      <Input label="Institution" value={form.institution} onChange={update('institution')} />
      <Input label="Branch" value={form.branch} onChange={update('branch')} />
      <Input label="Graduation year" type="number" value={form.graduationYear} onChange={update('graduationYear')} />

      <Input
        label="Skills"
        placeholder="React, Node.js, MongoDB"
        value={form.skills}
        onChange={update('skills')}
        className="sm:col-span-2"
      />

      <Select label="Source" value={form.source} onChange={update('source')} options={SOURCES} />

      <div className="sm:col-span-1">
        <label className="block text-sm font-medium text-slate-700 mb-1">Resume {isEdit && '(optional — replaces current file)'}</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setForm((f) => ({ ...f, resumeFile: e.target.files[0] }))}
          className="text-sm w-full"
        />
        {isEdit && existingResumeName && <p className="text-xs text-slate-400 mt-1">Current: {existingResumeName}</p>}
      </div>

      <Textarea label="Profile summary" value={form.profileSummary} onChange={update('profileSummary')} className="sm:col-span-2" />
    </div>
  );
};
