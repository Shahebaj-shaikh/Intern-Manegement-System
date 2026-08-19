import { useState } from 'react';
import { certificateApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export const VerifyCertificate = () => {
  const [id, setId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const { data } = await certificateApi.verifyPublic(id);
      setResult({ ok: true, data: data.data });
    } catch (err) {
      setResult({ ok: false, message: err.response?.data?.message || 'Not found' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Verify Certificate</h2>
        <div className="flex gap-2">
          <input className="flex-1 px-3 py-2 border rounded" placeholder="Enter certificate ID (e.g. IMS-CERT-XXXX)" value={id} onChange={(e) => setId(e.target.value)} />
          <Button onClick={handleVerify} loading={loading}>Verify</Button>
        </div>

        {result && (
          <div className="mt-6">
            {result.ok ? (
              <div>
                <p className="text-sm text-slate-500">Certificate ID: <strong>{result.data.certificateId}</strong></p>
                <p className="mt-2">Name: <strong>{result.data.internName || '—'}</strong></p>
                <p>Role: {result.data.role}</p>
                <p>Duration: {result.data.durationText}</p>
                <p>Issued: {new Date(result.data.issueDate).toLocaleDateString()}</p>
                <p>Status: {result.data.status}</p>
              </div>
            ) : (
              <p className="text-red-600">{result.message}</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
