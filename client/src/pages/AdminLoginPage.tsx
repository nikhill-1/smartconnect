import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { adminLogin } from '../services/api';

export const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await adminLogin(username, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Incorrect username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <Navbar />

      <main style={{ minHeight: '65vh' }}>
        <div className="login-card">
          <div className="card-header">
            <div className="log">Admin Login</div>
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
              <label htmlFor="name">Username:</label>
              <input
                required
                id="name"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin ID"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                required
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ marginTop: '25px' }}>
              <input
                value={loading ? 'Authenticating...' : 'Login'}
                type="submit"
                disabled={loading}
              />
            </div>
          </form>

          <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
            <span>Default demo credentials: ID <b>12345</b> / Password <b>admin</b></span>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};
