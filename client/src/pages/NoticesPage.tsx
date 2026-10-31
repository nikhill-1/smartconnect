import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';
import { fetchPublicCirculars, Circular } from '../services/api';

export const NoticesPage: React.FC = () => {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCircular, setSelectedCircular] = useState<Circular | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchPublicCirculars()
      .then((data) => {
        setCirculars(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = ['all', ...Array.from(new Set(circulars.map((c) => c.category)))];

  const filtered = filterCategory === 'all'
    ? circulars
    : circulars.filter((c) => c.category === filterCategory);

  return (
    <>
      <Header />
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', minHeight: '65vh' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h1 id="h22" style={{ margin: '10px 0' }}>OFFICIAL NOTICES &amp; CIRCULARS</h1>
          <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '700px', margin: '0 auto' }}>
            Official announcements, academic calendars, examination notifications, and administrative circulars for students, faculty, and prospective candidates.
          </p>
        </div>

        {/* Filter categories */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                backgroundColor: filterCategory === cat ? '#267EB2' : '#ffffff',
                color: filterCategory === cat ? '#ffffff' : '#334155',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading circulars...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: '40px' }}>📋</span>
            <h3 style={{ color: '#1A4A95', margin: '15px 0 5px 0' }}>No Active Circulars</h3>
            <p style={{ color: '#64748b', margin: 0 }}>Check back later or ask our AI assistant for recent college notices.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedCircular(item)}
                style={{
                  background: 'white',
                  borderRadius: '10px',
                  padding: '24px',
                  border: item.isPinned ? '2px solid #58c1F8' : '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(38, 126, 178, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                }}
              >
                {item.isPinned && (
                  <span style={{
                    position: 'absolute', top: '12px', right: '12px',
                    backgroundColor: '#e0f2fe', color: '#0369a1',
                    fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px',
                  }}>
                    📌 PINNED
                  </span>
                )}

                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{
                      backgroundColor: '#f1f5f9', color: '#475569',
                      fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize'
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(item.publishAt || item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ color: '#1A4A95', margin: '0 0 10px 0', fontSize: '18px', lineHeight: 1.4 }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                    {item.summary || (item.body ? item.body.slice(0, 120) + '...' : 'Click to view notice details.')}
                  </p>
                </div>

                <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#267EB2', fontWeight: 600, fontSize: '13px' }}>View Notice &rarr;</span>
                  {item.attachments && item.attachments.length > 0 && (
                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                      📎 {item.attachments.length} attachment{item.attachments.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Circular Modal */}
        {selectedCircular && (
          <div
            className="modal-backdrop"
            onClick={() => setSelectedCircular(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white', maxWidth: '680px', width: '100%',
                borderRadius: '12px', padding: '30px', maxHeight: '85vh',
                overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
                <div>
                  <span style={{
                    backgroundColor: '#e0f2fe', color: '#0369a1',
                    fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', textTransform: 'capitalize'
                  }}>
                    {selectedCircular.category}
                  </span>
                  <span style={{ marginLeft: '10px', fontSize: '13px', color: '#64748b' }}>
                    Published: {new Date(selectedCircular.publishAt || selectedCircular.createdAt).toLocaleDateString()}
                  </span>
                  <h2 style={{ color: '#1A4A95', margin: '10px 0 0 0', fontSize: '22px' }}>
                    {selectedCircular.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedCircular(null)}
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ margin: '20px 0', fontSize: '15px', lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-wrap' }}>
                {selectedCircular.body || selectedCircular.summary}
              </div>

              {selectedCircular.attachments && selectedCircular.attachments.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginTop: '20px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1A4A95' }}>Official Attachments:</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {selectedCircular.attachments.map((att) => (
                      <li key={att.id} style={{ margin: '6px 0' }}>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                        >
                          📄 {att.originalName} ({Math.round(att.sizeBytes / 1024)} KB) &rarr;
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ textAlign: 'right', marginTop: '25px' }}>
                <button
                  onClick={() => setSelectedCircular(null)}
                  style={{
                    backgroundColor: '#267EB2', color: 'white', border: 0,
                    padding: '10px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <AiBanner />
      </main>

      <Footer />
    </>
  );
};

