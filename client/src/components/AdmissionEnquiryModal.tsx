import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultCourse?: string;
}

export const AdmissionEnquiryModal: React.FC<Props> = ({ isOpen, onClose, defaultCourse = 'Engineering (B.Tech CSE)' }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [courseInterested, setCourseInterested] = useState(defaultCourse);
  const [qualifications, setQualifications] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ id: string; msg: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          courseInterested,
          qualifications,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit enquiry.');
      }

      setConfirmation({ id: data.enquiryId, msg: data.message });
    } catch (err: any) {
      setError(err.message || 'Error submitting application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmation(null);
    setError(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '15px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '540px',
          padding: '28px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#64748b',
          }}
        >
          ✕
        </button>

        <h2 style={{ color: '#1A4A95', marginTop: 0, marginBottom: '6px' }}>Admission Enquiry &amp; Application</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: 0, marginBottom: '20px' }}>
          Fill in your details below and our admissions counseling team will contact you with fee structures, seat eligibility, and admission documents.
        </p>

        {confirmation ? (
          <div style={{ textAlign: 'center', padding: '25px 10px' }}>
            <div style={{ fontSize: '48px', color: '#10b981', marginBottom: '10px' }}>✔</div>
            <h3 style={{ color: '#065f46', margin: '0 0 10px 0' }}>Enquiry Received!</h3>
            <p style={{ color: '#334155', lineHeight: '1.6' }}>{confirmation.msg}</p>
            <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '6px', margin: '15px 0', fontSize: '13px', color: '#475569' }}>
              Reference ID: <b>{confirmation.id}</b>
            </div>
            <button
              onClick={handleClose}
              style={{
                backgroundColor: '#267EB2',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Full Name *
              </label>
              <input
                required
                type="text"
                placeholder="Student Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Phone Number *
                </label>
                <input
                  required
                  type="tel"
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="student@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Program / Course Interested In *
              </label>
              <select
                value={courseInterested}
                onChange={(e) => setCourseInterested(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option value="B.Tech Computer Science & Engineering (CSE)">B.Tech - Computer Science &amp; Engineering (CSE)</option>
                <option value="B.Tech Information Technology (INF)">B.Tech - Information Technology (INF)</option>
                <option value="B.Tech Electronics & Communication (ECE)">B.Tech - Electronics &amp; Communication (ECE)</option>
                <option value="B.Tech Mechanical Engineering">B.Tech - Mechanical Engineering</option>
                <option value="B.Tech Civil Engineering">B.Tech - Civil Engineering</option>
                <option value="Bachelor of Pharmacy (B.Pharm)">Bachelor of Pharmacy (B.Pharm)</option>
                <option value="Master of Pharmacy (M.Pharm)">Master of Pharmacy (M.Pharm)</option>
                <option value="Polytechnic Diploma in Computer Engineering">Polytechnic - Diploma in Computer Engineering</option>
                <option value="Polytechnic Diploma in ECE">Polytechnic - Diploma in ECE</option>
                <option value="Polytechnic Diploma in EEE">Polytechnic - Diploma in EEE</option>
                <option value="Polytechnic Diploma in Mechanical / Civil">Polytechnic - Diploma in Mechanical / Civil</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Current Qualification &amp; Marks / Rank
              </label>
              <input
                type="text"
                placeholder="e.g., Intermediate MPC 88% or EAPCET Rank 24000"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Any specific question or hostel requirement?
              </label>
              <textarea
                rows={2}
                placeholder="Optional questions about fee, hostel, or transport..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #2E56DD, #58c1F8)',
                color: 'white',
                border: 'none',
                padding: '13px',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Submitting Application...' : 'Submit Admission Enquiry'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

