import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, UserPlus, Archive, ArrowUpDown, FileText } from 'lucide-react';
import { candidateApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Table } from '../../components/Table';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';

const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const SOURCE_LABELS = {
  referral: 'Referral', job_portal: 'Job Portal', campus: 'Campus Drive',
  linkedin: 'LinkedIn', company_website: 'Company Website', other: 'Other',
};

export const CandidateList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [archived, setArchived] = useState('false');
  const [sort, setSort] = useState('-createdAt');
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['candidates', debouncedSearch, source, archived, sort],
    queryFn: () => candidateApi.list({ search: debouncedSearch, source, archived, sort, limit: 50 }).then((r) => r.data.data),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Candidates</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} {archived === 'true' ? 'archived' : 'active'} candidate{data?.total === 1 ? '' : 's'}</p>
        </div>
        <Button onClick={() => navigate('/candidates/new')}><Plus size={16} /> Add Candidate</Button>
      </div>

      {/* Pipeline snapshot - a quick visual hook into recruitment health */}
      <Card className="p-5 bg-gradient-to-r from-brand-600 to-brand-700 text-white border-none">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-white/15 flex items-center justify-center shrink-0"><UserPlus size={20} /></div>
          <div>
            <p className="font-medium">Recruitment Pipeline</p>
            <p className="text-sm text-brand-100">Manage candidates from application through to selection. Head to <Link to="/applications" className="underline font-medium">Applications</Link> to move candidates through stages.</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Search by name, email, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            placeholder="All sources"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Select
            value={archived}
            onChange={(e) => setArchived(e.target.value)}
            options={[{ value: 'false', label: 'Active candidates' }, { value: 'true', label: 'Archived candidates' }]}
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <ArrowUpDown size={13} className="text-slate-400" />
          <select className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-600" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="fullName">Name (A-Z)</option>
            <option value="-fullName">Name (Z-A)</option>
            <option value="-applicationDate">Most recent application date</option>
          </select>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <Skeleton rows={6} cols={5} />
        ) : isError ? (
          <ErrorState />
        ) : data?.candidates?.length ? (
          <Table columns={['Name', 'Education', 'Skills', 'Source', 'Applications']}>
            {data.candidates.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/candidates/${c._id}`)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold shrink-0">
                      {c.fullName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{c.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.education?.degree || '—'} {c.education?.institution ? `· ${c.education.institution}` : ''}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {(c.skills || []).slice(0, 3).map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{s}</span>
                    ))}
                    {c.skills?.length > 3 && <span className="text-xs text-slate-400">+{c.skills.length - 3}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{SOURCE_LABELS[c.source] || c.source}</td>
                <td className="px-4 py-3 text-slate-600">
                  <span className="inline-flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded-full">
                    <FileText size={12} /> {c.applicationCount}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState
            icon={archived === 'true' ? Archive : UserPlus}
            title={archived === 'true' ? 'No archived candidates' : 'No candidates found'}
            message={archived === 'true' ? 'Archived candidates will appear here.' : 'Try adjusting your filters, or add your first candidate.'}
          />
        )}
      </Card>
    </div>
  );
};
