import { useEffect, useState } from 'react';
import { onboardingApi, documentApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const statusStyles = {
  not_started: {
    background: '#f3f4f6',
    color: '#374151',
  },
  in_progress: {
    background: '#dbeafe',
    color: '#1d4ed8',
  },
  completed: {
    background: '#dcfce7',
    color: '#15803d',
  },
};

const documentLabels = {
  offer_letter: 'Offer Letter',
  college_id: 'College ID',
  joining_doc: 'Joining Document',
};

function formatDate(value) {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }) {
  const style =
    statusStyles[status] || statusStyles.not_started;

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
      {String(status || '').replace('_', ' ') || '-'}
    </span>
  );
}

export function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();

  const [onboardings, setOnboardings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const role = user?.role || '';
  const isHr = role === 'hr' || role === 'super_admin';
  const isIntern = role === 'intern';

  const loadOnboarding = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await onboardingApi.list();
      const records = response.data?.data || [];

      setOnboardings(records);

      if (records.length > 0) {
        const firstRecord = records[0];

        setSelected(firstRecord);

        await loadProgress(firstRecord._id);
      } else {
        setSelected(null);
        setProgress(null);
        setDocuments([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load onboarding information.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (id) => {
    try {
      const response = await onboardingApi.progress(id);
      const data = response.data?.data;

      setProgress(data);
      setDocuments(data?.documents || []);

      // Keep the populated intern and offer information
      // from the /api/onboarding response.
      if (data?.onboarding) {
        setSelected((previous) => {
          if (!previous) {
            return data.onboarding;
          }

          return {
            ...previous,
            ...data.onboarding,
            intern:
              previous.intern ||
              data.onboarding.intern,
            offer:
              previous.offer ||
              data.onboarding.offer,
          };
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load onboarding progress.'
      );
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadOnboarding();
    }
  }, [authLoading, user]);

  const selectOnboarding = async (record) => {
    setSelected(record);
    setProgress(null);
    setError('');
    setSuccess('');

    await loadProgress(record._id);
  };

  const handleStart = async () => {
    if (!selected) return;

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const response = await onboardingApi.start(
        selected._id
      );

      const updated = response.data?.data;

      setSelected((previous) => ({
        ...previous,
        ...updated,
        intern: previous?.intern || updated?.intern,
        offer: previous?.offer || updated?.offer,
      }));

      setOnboardings((previous) =>
        previous.map((item) =>
          item._id === updated._id
            ? {
                ...item,
                ...updated,
                intern: item.intern || updated.intern,
                offer: item.offer || updated.offer,
              }
            : item
        )
      );

      await loadProgress(updated._id);

      setSuccess('Onboarding started successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to start onboarding.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selected) return;

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const response = await onboardingApi.complete(
        selected._id
      );

      const updated = response.data?.data;

      setSelected((previous) => ({
        ...previous,
        ...updated,
        intern: previous?.intern || updated?.intern,
        offer: previous?.offer || updated?.offer,
      }));

      setOnboardings((previous) =>
        previous.map((item) =>
          item._id === updated._id
            ? {
                ...item,
                ...updated,
                intern: item.intern || updated.intern,
                offer: item.offer || updated.offer,
              }
            : item
        )
      );

      await loadProgress(updated._id);

      setSuccess(
        'Onboarding completed successfully.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to complete onboarding.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpload = async (event, type) => {
    const file = event.target.files?.[0];

    if (!file || !selected) return;

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();

      formData.append('file', file);
      formData.append('type', type);
      formData.append(
        'owner',
        selected.intern?._id || selected.intern
      );
      formData.append('ownerModel', 'Intern');

      await documentApi.upload(formData);

      await loadProgress(selected._id);

      setSuccess(
        `${
          documentLabels[type] || 'Document'
        } uploaded successfully.`
      );

      event.target.value = '';
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to upload document.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div
        style={{
          padding: '32px',
          textAlign: 'center',
        }}
      >
        Loading onboarding...
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          padding: '32px',
          textAlign: 'center',
        }}
      >
        Please log in to view onboarding.
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 700,
          }}
        >
          {isIntern ? 'My Onboarding' : 'Onboarding'}
        </h1>

        <p
          style={{
            marginTop: '8px',
            color: '#6b7280',
          }}
        >
          {isIntern
            ? 'Complete your onboarding requirements.'
            : 'Monitor and manage intern onboarding.'}
        </p>
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

      {/* HR onboarding list */}
      {isHr && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          {onboardings.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280',
              }}
            >
              No onboarding records found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: '800px',
                }}
              >
                <thead>
                  <tr>
                    <th style={headerStyle}>Intern</th>
                    <th style={headerStyle}>Offer</th>
                    <th style={headerStyle}>
                      Joining Date
                    </th>
                    <th style={headerStyle}>Status</th>
                    <th style={headerStyle}>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {onboardings.map((record) => (
                    <tr
                      key={record._id}
                      onClick={() =>
                        selectOnboarding(record)
                      }
                      style={{
                        cursor: 'pointer',
                        background:
                          selected?._id === record._id
                            ? '#f9fafb'
                            : '#fff',
                      }}
                    >
                      <td style={cellStyle}>
                        <strong>
                          {record.intern?.fullName ||
                            'Unknown Intern'}
                        </strong>

                        <div
                          style={{
                            color: '#6b7280',
                            fontSize: '13px',
                            marginTop: '3px',
                          }}
                        >
                          {record.intern?.email || '-'}
                        </div>
                      </td>

                      <td style={cellStyle}>
                        {record.offer?.offerTitle || '-'}
                      </td>

                      <td style={cellStyle}>
                        {formatDate(
                          record.offer?.joiningDate
                        )}
                      </td>

                      <td style={cellStyle}>
                        <StatusBadge
                          status={record.status}
                        />
                      </td>

                      <td style={cellStyle}>
                        {formatDate(record.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Selected onboarding */}
      {selected ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Progress */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: '20px',
              }}
            >
              Onboarding Progress
            </h2>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span>Status</span>

              <StatusBadge status={selected.status} />
            </div>

            <div
              style={{
                height: '10px',
                background: '#e5e7eb',
                borderRadius: '999px',
                overflow: 'hidden',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  width: `${progress?.progress || 0}%`,
                  height: '100%',
                  background: '#2563eb',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            <p
              style={{
                margin: 0,
                color: '#6b7280',
              }}
            >
              {progress?.progress || 0}% completed
            </p>

            {isHr &&
              selected.status === 'not_started' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleStart}
                  style={primaryButtonStyle}
                >
                  Start Onboarding
                </button>
              )}
          </div>

          {/* Checklist */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: '20px',
              }}
            >
              Required Documents
            </h2>

            {[
              {
                label: 'Offer Letter',
                key: 'offerLetterSubmitted',
              },
              {
                label: 'College ID',
                key: 'collegeIdSubmitted',
              },
              {
                label: 'Joining Document',
                key: 'joiningDocumentSubmitted',
              },
            ].map((item) => {
              const completed =
                progress?.checklist?.[item.key] ||
                selected.checklist?.[item.key] ||
                false;

              return (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom:
                      '1px solid #f3f4f6',
                  }}
                >
                  <span>{item.label}</span>

                  <span
                    style={{
                      fontWeight: 600,
                      color: completed
                        ? '#15803d'
                        : '#b91c1c',
                    }}
                  >
                    {completed
                      ? 'Completed'
                      : 'Pending'}
                  </span>
                </div>
              );
            })}

            {isIntern &&
              selected.status !== 'completed' && (
                <div
                  style={{
                    display: 'grid',
                    gap: '12px',
                    marginTop: '18px',
                  }}
                >
                  <label>
                    <span
                      style={{
                        display: 'block',
                        marginBottom: '5px',
                      }}
                    >
                      Upload Offer Letter
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={actionLoading}
                      onChange={(event) =>
                        handleUpload(
                          event,
                          'offer_letter'
                        )
                      }
                    />
                  </label>

                  <label>
                    <span
                      style={{
                        display: 'block',
                        marginBottom: '5px',
                      }}
                    >
                      Upload College ID
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={actionLoading}
                      onChange={(event) =>
                        handleUpload(
                          event,
                          'college_id'
                        )
                      }
                    />
                  </label>

                  <label>
                    <span
                      style={{
                        display: 'block',
                        marginBottom: '5px',
                      }}
                    >
                      Upload Joining Document
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={actionLoading}
                      onChange={(event) =>
                        handleUpload(
                          event,
                          'joining_doc'
                        )
                      }
                    />
                  </label>
                </div>
              )}
          </div>

          {/* Uploaded documents */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              gridColumn: '1 / -1',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: '20px',
              }}
            >
              Uploaded Documents
            </h2>

            {documents.length === 0 ? (
              <p style={{ color: '#6b7280' }}>
                No onboarding documents uploaded yet.
              </p>
            ) : (
              documents.map((document) => (
                <div
                  key={document._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 0',
                    borderBottom:
                      '1px solid #f3f4f6',
                  }}
                >
                  <div>
                    <strong>
                      {document.fileName ||
                        document.type}
                    </strong>

                    <div
                      style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginTop: '3px',
                      }}
                    >
                      {documentLabels[
                        document.type
                      ] || document.type}
                    </div>
                  </div>

                  <a
                    href={`http://localhost:5000${document.filePath}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#2563eb',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    View
                  </a>
                </div>
              ))
            )}
          </div>

          {/* HR complete */}
          {isHr &&
            selected.status === 'in_progress' && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleComplete}
                  style={primaryButtonStyle}
                >
                  Complete Onboarding
                </button>
              </div>
            )}
        </div>
      ) : (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          {isIntern
            ? 'No onboarding record is available yet.'
            : 'Select an onboarding record to view details.'}
        </div>
      )}
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

const primaryButtonStyle = {
  marginTop: '18px',
  border: 'none',
  borderRadius: '8px',
  padding: '11px 18px',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

export default OnboardingPage;