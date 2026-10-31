import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  authStorage,
  fetchAdminDocuments,
  uploadAdminDocument,
  reindexAdminDocument,
  deleteAdminDocument,
  lookupSpreadsheet,
  fetchAdminEnquiries,
  fetchAdminUnansweredQueries,
  AdminDocument,
  EnquirySubmission,
  UnansweredQueryLog,
} from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'enquiries' | 'unanswered' | 'spreadsheets'>('documents');
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [enquiries, setEnquiries] = useState<EnquirySubmission[]>([]);
  const [unanswered, setUnanswered] = useState<UnansweredQueryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // New document form state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('circular_notice');
  const [newReference, setNewReference] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Spreadsheet lookup state
  const [pinInput, setPinInput] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const navigate = useNavigate();
  const user = authStorage.getUser();

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      navigate('/admin');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docs, enqs, unans] = await Promise.all([
        fetchAdminDocuments().catch(() => []),
        fetchAdminEnquiries().catch(() => []),
        fetchAdminUnansweredQueries().catch(() => []),
      ]);
      setDocuments(docs);
      setEnquiries(enqs);
      setUnanswered(unans);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) {
        authStorage.removeToken();
        navigate('/admin');
      } else {
        setMessage('Error loading admin data: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authStorage.removeToken();
    authStorage.removeUser();
    navigate('/admin');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newTitle) {
      setNewTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setNewContent(text);
    };
    reader.readAsText(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    setIsUploading(true);
    try {
      const res = await uploadAdminDocument({
        title: newTitle,
        sourceType: newType,
        sourceReference: newReference || 'Admin Ingestion Portal',
        content: newContent,
      });

      setMessage(res.message);
      setShowUploadModal(false);
      setNewTitle('');
      setNewReference('');
      setNewContent('');
      await loadData();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReindex = async (id: string) => {
    try {
      const res = await reindexAdminDocument(id);
      setMessage(res.message);
      await loadData();
    } catch (err: any) {
      alert('Reindex failed: ' + err.message);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from the knowledge base?`)) {
      return;
    }
    try {
      const res = await deleteAdminDocument(id);
      setMessage(res.message);
      await loadData();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handlePinLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setIsLookingUp(true);
    setLookupResult(null);
    try {
      const res = await lookupSpreadsheet(pinInput.trim());
      setLookupResult(res);
      if (res.success && res.spreadsheetUrl) {
        window.open(res.spreadsheetUrl, '_blank');
      }
    } catch (err: any) {
      setLookupResult({ success: false, message: err.message });
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <>
      <Header />
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', minHeight: '65vh' }}>
        {/* Top greeting bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
          <div>
            <h1 style={{ color: '#1A4A95', margin: 0, fontSize: '28px' }}>SmartConnect Admin Portal</h1>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
              Logged in as: <b>{user?.username || 'Administrator'}</b> ({user?.role || 'admin'})
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={() => navigate('/chatbot')}
              style={{
                backgroundColor: '#267EB2',
                color: 'white',
                border: 0,
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Test AI Chatbot
            </button>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 0,
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Status notification banner */}
        {message && (
          <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '12px 16px', borderRadius: '8px', margin: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{message}</span>
            <button onClick={() => setMessage(null)} style={{ background: 'none', border: 0, color: '#065f46', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {/* Tab selection */}
        <div style={{ display: 'flex', gap: '12px', margin: '25px 0 20px 0', borderBottom: '1px solid #cbd5e1', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('documents')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'documents' ? '3px solid #2E56DD' : 'none',
              color: activeTab === 'documents' ? '#2E56DD' : '#64748b',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            📚 Knowledge Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'enquiries' ? '3px solid #2E56DD' : 'none',
              color: activeTab === 'enquiries' ? '#2E56DD' : '#64748b',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            📋 Admission Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('unanswered')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'unanswered' ? '3px solid #2E56DD' : 'none',
              color: activeTab === 'unanswered' ? '#2E56DD' : '#64748b',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            ❓ Unanswered Queries ({unanswered.length})
          </button>
          <button
            onClick={() => setActiveTab('spreadsheets')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'spreadsheets' ? '3px solid #2E56DD' : 'none',
              color: activeTab === 'spreadsheets' ? '#2E56DD' : '#64748b',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            📊 Course Spreadsheets
          </button>
        </div>

        {/* TAB 1: KNOWLEDGE DOCUMENTS */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <p style={{ color: '#475569', margin: 0, fontSize: '15px' }}>
                Manage approved institutional knowledge sources indexed in the vector store for chatbot retrieval.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                style={{
                  background: 'linear-gradient(to bottom right, #2E56DD, #58c1F8)',
                  color: 'white',
                  border: 0,
                  padding: '10px 18px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  boxShadow: '0 2px 6px rgba(46, 86, 221, 0.3)',
                }}
              >
                + Add / Upload Document
              </button>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>Loading knowledge documents...</p>
            ) : (
              <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#334155' }}>
                      <th style={{ padding: '14px 16px' }}>Document Title</th>
                      <th style={{ padding: '14px 16px' }}>Type</th>
                      <th style={{ padding: '14px 16px' }}>Chunks</th>
                      <th style={{ padding: '14px 16px' }}>Classification</th>
                      <th style={{ padding: '14px 16px' }}>Status</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                          {doc.title}
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
                            Ref: {doc.sourceReference || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>{doc.sourceType}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                            {doc.chunkCount || 1} chunks
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', textTransform: 'capitalize' }}>
                            {doc.accessClassification}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>✔ Indexed</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleReindex(doc.id)}
                            style={{ backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px', fontSize: '12px' }}
                            title="Re-run embedding pipeline"
                          >
                            Re-index
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, doc.title)}
                            style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            title="Remove from knowledge base"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ADMISSION ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ color: '#1A4A95', margin: 0 }}>Prospective Student Enquiries</h2>
              <button
                onClick={loadData}
                style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Refresh
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: 0 }}>
              Direct submissions received through the website admission inquiry portal.
            </p>

            {enquiries.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No enquiries submitted yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#334155' }}>
                      <th style={{ padding: '12px 14px' }}>Applicant</th>
                      <th style={{ padding: '12px 14px' }}>Contact</th>
                      <th style={{ padding: '12px 14px' }}>Program / Branch</th>
                      <th style={{ padding: '12px 14px' }}>Message / Queries</th>
                      <th style={{ padding: '12px 14px' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((enq) => (
                      <tr key={enq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b' }}>{enq.name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div><a href={`mailto:${enq.email}`} style={{ color: '#2563eb' }}>{enq.email}</a></div>
                          <div style={{ color: '#64748b', fontSize: '13px' }}>📞 {enq.phone}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                            {enq.courseInterest}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569', maxWidth: '300px' }}>
                          {enq.message || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None</span>}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>
                          {new Date(enq.createdAt).toLocaleDateString()} {new Date(enq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: UNANSWERED QUERIES */}
        {activeTab === 'unanswered' && (
          <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ color: '#1A4A95', margin: 0 }}>Unanswered Query Insights</h2>
              <button
                onClick={loadData}
                style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Refresh
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: 0 }}>
              Visitor questions that triggered the chatbot fallback mechanism. Review these to discover knowledge base gaps and ingest new institutional documents.
            </p>

            {unanswered.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px', color: '#10b981' }}>
                🎉 Great job! No unanswered questions logged.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#334155' }}>
                      <th style={{ padding: '12px 14px' }}>#</th>
                      <th style={{ padding: '12px 14px' }}>Visitor Query</th>
                      <th style={{ padding: '12px 14px' }}>Timestamp</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Suggested Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unanswered.map((un, idx) => (
                      <tr key={un.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#b91c1c' }}>"{un.query}"</td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>
                          {new Date(un.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setNewTitle(`Notice regarding: ${un.query.slice(0, 30)}`);
                              setShowUploadModal(true);
                            }}
                            style={{ backgroundColor: '#2563eb', color: 'white', border: 0, padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            + Ingest Knowledge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUDITED COURSE SPREADSHEETS */}
        {activeTab === 'spreadsheets' && (
          <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ color: '#1A4A95', marginTop: 0 }}>Audited Course Spreadsheet Verification</h2>
            <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '15px' }}>
              In compliance with SRS Security requirements (FR-12 &amp; NFR-18), raw student spreadsheets are strictly protected from public visitor endpoints. Authorized staff can look up course PINs below to retrieve and open authorized course records.
            </p>

            <form onSubmit={handlePinLookup} style={{ maxWidth: '450px', marginTop: '20px' }}>
              <div className="form-group">
                <label htmlFor="coursePin">Enter Course PIN / Identifier:</label>
                <input
                  id="coursePin"
                  type="text"
                  placeholder="e.g., 22124-cs-160, 22124-cs-131, 22124-cs-134, 22124-cs-179"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLookingUp}
                style={{
                  background: 'linear-gradient(to bottom right, #2E56DD, #58c1F8)',
                  color: 'white',
                  border: 0,
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginTop: '10px',
                }}
              >
                {isLookingUp ? 'Verifying PIN...' : 'Open Course Spreadsheet'}
              </button>
            </form>

            {lookupResult && (
              <div
                style={{
                  marginTop: '25px',
                  padding: '15px',
                  borderRadius: '6px',
                  backgroundColor: lookupResult.success ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${lookupResult.success ? '#6ee7b7' : '#fca5a5'}`,
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', color: lookupResult.success ? '#065f46' : '#991b1b' }}>
                  {lookupResult.success ? '✔ Course Record Verified' : '❌ PIN Verification Failed'}
                </h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{lookupResult.message}</p>
                {lookupResult.spreadsheetUrl && (
                  <a
                    href={lookupResult.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#2E56DD',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    Open Authorized OneDrive Spreadsheet &rarr;
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upload Modal with File Support */}
        {showUploadModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                width: '100%',
                maxWidth: '650px',
                padding: '30px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <h2 style={{ color: '#1A4A95', marginTop: 0 }}>Add Knowledge Document to Vector Store</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: 0 }}>
                The document text will be automatically segmented into chunks and indexed with vector embeddings for public chatbot retrieval.
              </p>

              <form onSubmit={handleUploadSubmit}>
                <div className="form-group">
                  <label>Document Title:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Examination Schedule & Fee Notice 2025"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Upload Document File (.txt, .md, .json) - Optional:</label>
                  <input
                    type="file"
                    accept=".txt,.md,.json,.csv"
                    onChange={handleFileUpload}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', background: '#f8fafc' }}
                  />
                </div>

                <div className="form-group">
                  <label>Source Type:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '15px' }}
                  >
                    <option value="circular_notice">Official Circular / Notice</option>
                    <option value="admission_brochure">Admission Brochure</option>
                    <option value="policy_document">Policy Document</option>
                    <option value="fee_structure">Fee Schedule</option>
                    <option value="academic_calendar">Academic Calendar</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Source Reference / Department:</label>
                  <input
                    type="text"
                    placeholder="e.g., Office of the Principal, Circular Ref #TRRM-2025-01"
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Document Content / Text:</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Paste or upload the official document text here..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    style={{ background: 'linear-gradient(to bottom right, #2E56DD, #58c1F8)', color: 'white', border: 0, padding: '10px 22px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {isUploading ? 'Chunking & Indexing...' : 'Index Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
};
