import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  studentAuthStorage,
  fetchStudentAcademics,
  changeStudentPassword,
  AcademicRecord,
} from '../services/api';

export const StudentDashboardPage: React.FC = () => {
  const [data, setData] = useState<AcademicRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = studentAuthStorage.getToken();
    if (!token) {
      navigate('/student/login');
      return;
    }

    if (searchParams.get('changePassword') === '1') {
      setShowPasswordModal(true);
    }

    loadAcademics();
  }, [navigate, searchParams]);

  const loadAcademics = async () => {
    setLoading(true);
    try {
      const record = await fetchStudentAcademics();
      setData(record);
      if (record.student.mustChangePassword) {
        setShowPasswordModal(true);
      }
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('token')) {
        studentAuthStorage.removeToken();
        studentAuthStorage.removeStudent();
        navigate('/student/login');
      } else {
        setError(err.message || 'Failed to load academic records.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    studentAuthStorage.removeToken();
    studentAuthStorage.removeStudent();
    navigate('/');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg({ success: false, text: 'New password must be at least 8 characters long.' });
      return;
    }

    setIsChangingPass(true);
    setPasswordMsg(null);
    try {
      await changeStudentPassword(currentPassword, newPassword);
      setPasswordMsg({ success: true, text: 'Password changed successfully!' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        loadAcademics();
      }, 1500);
    } catch (err: any) {
      setPasswordMsg({ success: false, text: err.message || 'Failed to update password.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const student = data?.student || studentAuthStorage.getStudent();
  const attSummary = data?.attendanceSummary;

  return (
    <>
      <Header />
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', minHeight: '65vh' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
          <div>
            <h1 style={{ color: '#1A4A95', margin: 0, fontSize: '28px' }}>Student Academic Portal</h1>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
              Welcome, <b>{student?.name || 'Student'}</b> | PIN: <b>{student?.pin}</b>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={() => navigate('/chatbot')}
              style={{
                backgroundColor: '#267EB2', color: 'white', border: 0,
                padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
              }}
            >
              💬 Ask AI About My Records
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              style={{
                backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1',
                padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Change Password
            </button>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#ef4444', color: 'white', border: 0,
                padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', margin: '20px 0' }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Loading your academic profile...</p>
        ) : (
          <div style={{ marginTop: '25px' }}>
            {/* Student Info Card */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '25px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1A4A95', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                Student Profile Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', fontSize: '14px' }}>
                <div><span style={{ color: '#64748b' }}>Roll Number (PIN):</span> <b>{student?.pin}</b></div>
                <div><span style={{ color: '#64748b' }}>Full Name:</span> <b>{student?.name}</b></div>
                <div><span style={{ color: '#64748b' }}>Department:</span> <b>{student?.department || 'N/A'}</b></div>
                <div><span style={{ color: '#64748b' }}>Year &amp; Section:</span> <b>Year {student?.year || 1} - Sec {student?.section || 'A'}</b></div>
                <div><span style={{ color: '#64748b' }}>Institutional Email:</span> <b>{student?.email || 'N/A'}</b></div>
                <div><span style={{ color: '#64748b' }}>Registered Contact:</span> <b>{student?.phone || 'N/A'}</b></div>
              </div>
            </div>

            {/* Attendance Overview Card */}
            {attSummary && (
              <div style={{ background: 'white', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '25px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1A4A95', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  Attendance Summary (JNTUH Minimum Requirement: {attSummary.requirementPercent}%)
                </h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{
                    padding: '20px 30px', borderRadius: '12px',
                    backgroundColor: attSummary.overallPercentage >= attSummary.requirementPercent ? '#ecfdf5' : '#fef2f2',
                    border: `2px solid ${attSummary.overallPercentage >= attSummary.requirementPercent ? '#10b981' : '#ef4444'}`,
                    textAlign: 'center', minWidth: '160px'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: attSummary.overallPercentage >= attSummary.requirementPercent ? '#047857' : '#b91c1c' }}>
                      {attSummary.overallPercentage}%
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>Overall Attendance</div>
                  </div>

                  <div style={{ flex: 1, minWidth: '220px', fontSize: '14px', lineHeight: 1.8 }}>
                    <div>Classes Attended: <b>{attSummary.totalAttended} / {attSummary.totalHeld}</b></div>
                    <div>
                      Status: {attSummary.overallPercentage >= attSummary.requirementPercent ? (
                        <span style={{ color: '#10b981', fontWeight: 700 }}>✔ In Good Standing (Eligible for Exams)</span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠️ Attendance Shortage (Contact HOD Office)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject Attendance Table */}
                {data.attendance && data.attendance.length > 0 && (
                  <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 14px' }}>Semester</th>
                          <th style={{ padding: '10px 14px' }}>Subject</th>
                          <th style={{ padding: '10px 14px' }}>Classes Held</th>
                          <th style={{ padding: '10px 14px' }}>Classes Attended</th>
                          <th style={{ padding: '10px 14px' }}>Percentage</th>
                          <th style={{ padding: '10px 14px' }}>Eligibility</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.attendance.map((att) => (
                          <tr key={att.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px' }}>{att.semester}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{att.subject}</td>
                            <td style={{ padding: '10px 14px' }}>{att.classesHeld}</td>
                            <td style={{ padding: '10px 14px' }}>{att.classesAttended}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: att.isShortage ? '#b91c1c' : '#047857' }}>
                              {att.percentage}%
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                backgroundColor: att.isShortage ? '#fee2e2' : '#dcfce7',
                                color: att.isShortage ? '#b91c1c' : '#15803d',
                                padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600
                              }}>
                                {att.isShortage ? 'Shortage' : 'Clear'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Marks Records Card */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1A4A95', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                Academic Marks &amp; Examination Results
              </h3>
              {(!data?.marks || data.marks.length === 0) ? (
                <p style={{ color: '#64748b', margin: 0 }}>No marks entered yet. Results will appear here once published by the examination branch.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 14px' }}>Semester</th>
                        <th style={{ padding: '10px 14px' }}>Subject</th>
                        <th style={{ padding: '10px 14px' }}>Exam Type</th>
                        <th style={{ padding: '10px 14px' }}>Marks Obtained</th>
                        <th style={{ padding: '10px 14px' }}>Maximum Marks</th>
                        <th style={{ padding: '10px 14px' }}>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.marks.map((m) => {
                        const pct = Math.round((m.marksObtained / m.maxMarks) * 100);
                        return (
                          <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px' }}>{m.semester}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{m.subject}</td>
                            <td style={{ padding: '10px 14px', textTransform: 'capitalize' }}>{m.examType}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1A4A95' }}>{m.marksObtained}</td>
                            <td style={{ padding: '10px 14px' }}>{m.maxMarks}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div
            className="modal-backdrop"
            onClick={() => !student?.mustChangePassword && setShowPasswordModal(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 9999, padding: '20px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white', maxWidth: '440px', width: '100%',
                borderRadius: '10px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
            >
              <h3 style={{ color: '#1A4A95', marginTop: 0 }}>
                {student?.mustChangePassword ? 'Security Requirement: Set New Password' : 'Change Portal Password'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                {student?.mustChangePassword
                  ? 'For security reasons, your temporary default password must be changed before continuing.'
                  : 'Enter your current password and choose a secure new password.'}
              </p>

              {passwordMsg && (
                <div style={{
                  backgroundColor: passwordMsg.success ? '#ecfdf5' : '#fee2e2',
                  color: passwordMsg.success ? '#065f46' : '#b91c1c',
                  padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px',
                }}>
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label>Current Password:</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="form-group">
                  <label>New Password (min 8 characters):</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Choose a new password"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  {!student?.mustChangePassword && (
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    style={{
                      backgroundColor: '#267EB2', color: 'white', border: 0,
                      padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    {isChangingPass ? 'Updating...' : 'Save Password'}
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

