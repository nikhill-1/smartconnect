import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { studentLogin } from '../services/api';

export const StudentLoginPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await studentLogin(pin.trim(), password);
      if (res.student?.mustChangePassword) {
        navigate('/student/dashboard?changePassword=1');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <Navbar />

      <main style={{ minHeight: '65vh' }}>
        <div className="login-card" style={{ maxWidth: '380px' }}>
          <div className="card-header">
            <div className="log" style={{ fontSize: '24px' }}>Student Portal Login</div>
            <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              Access your marks, attendance records, and personal academic assistant.
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '15px',
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="studentPin">Student PIN / Roll Number:</label>
              <input
                required
                id="studentPin"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="e.g. 22124-CS-160"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="studentPassword">Password:</label>
              <input
                required
                id="studentPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Initial password is PIN in capitals"
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ marginTop: '25px' }}>
              <input
                value={loading ? 'Authenticating...' : 'Sign In to Portal'}
                type="submit"
                disabled={loading}
              />
            </div>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 8px 0' }}>First time signing in? Your default password is your <b>PIN in CAPITAL letters</b>. You will be prompted to set a permanent password.</p>
            <p style={{ margin: 0 }}>Need help? Visit the College Exam Branch or call <b>9154364306</b>.</p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

