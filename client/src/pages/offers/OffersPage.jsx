import { useEffect, useState } from 'react';
import { offerApi, internApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const initialForm = {
  intern: '',
  offerTitle: 'Software Developer Intern',
  internshipType: 'stipend',
  stipend: 15000,
  joiningDate: '',
  internshipEndDate: '',
  notes: '',
};

const statusStyles = {
  draft: {
    background: '#f3f4f6',
    color: '#374151',
  },
  offered: {
    background: '#dbeafe',
    color: '#1d4ed8',
  },
  accepted: {
    background: '#dcfce7',
    color: '#15803d',
  },
  rejected: {
    background: '#fee2e2',
    color: '#b91c1c',
  },
  withdrawn: {
    background: '#fef3c7',
    color: '#92400e',
  },
};

function formatDate(value) {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function OfferStatus({ status }) {
  const style = statusStyles[status] || statusStyles.draft;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '5px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        background: style.background,
        color: style.color,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

export function OffersPage() {
  const { user, loading: authLoading } = useAuth();

  const [offers, setOffers] = useState([]);
  const [interns, setInterns] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const role = user?.role || '';

  const isHr = role === 'hr' || role === 'super_admin';
  const isIntern = role === 'intern';

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await offerApi.list();
      setOffers(response.data?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load offers. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadInterns = async () => {
    if (!isHr) return;

    try {
      const response = await internApi.list({
        limit: 100,
        page: 1,
      });

      setInterns(response.data?.data?.interns || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load interns.'
      );
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;

    loadOffers();
    loadInterns();
  }, [authLoading, user, isHr]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        ...form,
        stipend: Number(form.stipend || 0),
      };

      const response = await offerApi.create(payload);

      const createdOffer = response.data?.data;

      setOffers((previous) => [
        createdOffer,
        ...previous,
      ]);

      setForm(initialForm);
      setShowCreate(false);
      setSuccess('Offer created successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to create offer.'
      );
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id, action, successMessage) => {
    try {
      setActionId(id);
      setError('');
      setSuccess('');

      await action(id);
      await loadOffers();

      setSuccess(successMessage);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to complete this action.'
      );
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt(
      'Enter rejection reason (optional):'
    );

    try {
      setActionId(id);
      setError('');
      setSuccess('');

      await offerApi.reject(id, reason || '');
      await loadOffers();

      setSuccess('Offer rejected.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to reject offer.'
      );
    } finally {
      setActionId(null);
    }
  };

  if (authLoading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        Please log in to view offers.
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 700,
            }}
          >
            {isIntern ? 'My Offers' : 'Offers'}
          </h1>

          <p
            style={{
              marginTop: '8px',
              color: '#6b7280',
            }}
          >
            {isIntern
              ? 'View and respond to your internship offers.'
              : 'Manage internship offers and responses.'}
          </p>
        </div>

        {isHr && (
          <button
            type="button"
            onClick={() => {
              setShowCreate((value) => !value);
              setError('');
              setSuccess('');
            }}
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '11px 16px',
              background: '#111827',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showCreate ? 'Close Form' : '+ Create Offer'}
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: '#dcfce7',
            color: '#166534',
          }}
        >
          {success}
        </div>
      )}

      {/* HR Create Offer Form */}
      {isHr && showCreate && (
        <form
          onSubmit={handleCreate}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: '18px',
              fontSize: '20px',
            }}
          >
            Create Internship Offer
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            <label>
              <span>Intern</span>

              <select
                name="intern"
                value={form.intern}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                }}
              >
                <option value="">
                  Select intern
                </option>

                {interns.map((intern) => (
                  <option
                    key={intern._id}
                    value={intern._id}
                  >
                    {intern.fullName} — {intern.email}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Offer Title</span>

              <input
                name="offerTitle"
                value={form.offerTitle}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                }}
              />
            </label>

            <label>
              <span>Internship Type</span>

              <select
                name="internshipType"
                value={form.internshipType}
                onChange={handleChange}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                }}
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="stipend">Stipend</option>
              </select>
            </label>

            <label>
              <span>Stipend</span>

              <input
                type="number"
                min="0"
                name="stipend"
                value={form.stipend}
                onChange={handleChange}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                }}
              />
            </label>

            <label>
              <span>Joining Date</span>

              <input
                type="date"
                name="joiningDate"
                value={form.joiningDate}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                }}
              />
            </label>

            <label>
              <span>Internship End Date</span>

              <input
                type="date"
                name="internshipEndDate"
                value={form.internshipEndDate}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                }}
              />
            </label>
          </div>

          <label
            style={{
              display: 'block',
              marginTop: '16px',
            }}
          >
            <span>Notes</span>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                resize: 'vertical',
              }}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: '18px',
              border: 'none',
              borderRadius: '8px',
              padding: '11px 18px',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Creating...' : 'Create Offer'}
          </button>
        </form>
      )}

      {/* Offers List */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
            }}
          >
            Loading offers...
          </div>
        ) : offers.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#6b7280',
            }}
          >
            {isIntern
              ? 'You do not have any offers yet.'
              : 'No offers found.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '900px',
              }}
            >
              <thead>
                <tr>
                  {isHr && <th style={headerStyle}>Intern</th>}
                  <th style={headerStyle}>Offer</th>
                  <th style={headerStyle}>Type</th>
                  <th style={headerStyle}>Joining</th>
                  <th style={headerStyle}>End Date</th>
                  <th style={headerStyle}>Status</th>
                  <th style={headerStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {offers.map((offer) => (
                  <tr key={offer._id}>
                    {isHr && (
                      <td style={cellStyle}>
                        <strong>
                          {offer.intern?.fullName || '-'}
                        </strong>

                        <div
                          style={{
                            color: '#6b7280',
                            fontSize: '13px',
                            marginTop: '3px',
                          }}
                        >
                          {offer.intern?.email || '-'}
                        </div>
                      </td>
                    )}

                    <td style={cellStyle}>
                      {offer.offerTitle}
                    </td>

                    <td style={cellStyle}>
                      {offer.internshipType}
                      {offer.internshipType === 'stipend' &&
                        ` — ₹${offer.stipend || 0}`}
                    </td>

                    <td style={cellStyle}>
                      {formatDate(offer.joiningDate)}
                    </td>

                    <td style={cellStyle}>
                      {formatDate(offer.internshipEndDate)}
                    </td>

                    <td style={cellStyle}>
                      <OfferStatus status={offer.status} />
                    </td>

                    <td style={cellStyle}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {isHr &&
                          offer.status === 'draft' && (
                            <button
                              type="button"
                              disabled={actionId === offer._id}
                              onClick={() =>
                                runAction(
                                  offer._id,
                                  offerApi.send,
                                  'Offer sent successfully.'
                                )
                              }
                              style={actionButtonStyle}
                            >
                              Send
                            </button>
                          )}

                        {isHr &&
                          ['draft', 'offered'].includes(
                            offer.status
                          ) && (
                            <button
                              type="button"
                              disabled={actionId === offer._id}
                              onClick={() =>
                                runAction(
                                  offer._id,
                                  offerApi.withdraw,
                                  'Offer withdrawn successfully.'
                                )
                              }
                              style={{
                                ...actionButtonStyle,
                                background: '#fff7ed',
                                color: '#c2410c',
                              }}
                            >
                              Withdraw
                            </button>
                          )}

                        {isIntern &&
                          offer.status === 'offered' && (
                            <>
                              <button
                                type="button"
                                disabled={actionId === offer._id}
                                onClick={() =>
                                  runAction(
                                    offer._id,
                                    offerApi.accept,
                                    'Offer accepted successfully.'
                                  )
                                }
                                style={{
                                  ...actionButtonStyle,
                                  background: '#dcfce7',
                                  color: '#166534',
                                }}
                              >
                                Accept
                              </button>

                              <button
                                type="button"
                                disabled={actionId === offer._id}
                                onClick={() =>
                                  handleReject(offer._id)
                                }
                                style={{
                                  ...actionButtonStyle,
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}

                        {!(
                          (isHr &&
                            ['draft', 'offered'].includes(
                              offer.status
                            )) ||
                          (isIntern &&
                            offer.status === 'offered')
                        ) && (
                          <span
                            style={{
                              color: '#9ca3af',
                              fontSize: '13px',
                            }}
                          >
                            No action
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const headerStyle = {
  textAlign: 'left',
  padding: '14px 16px',
  background: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '13px',
  color: '#374151',
};

const cellStyle = {
  padding: '15px 16px',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'top',
  fontSize: '14px',
};

const actionButtonStyle = {
  border: 'none',
  borderRadius: '7px',
  padding: '7px 11px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontWeight: 600,
  cursor: 'pointer',
};

export default OffersPage;;