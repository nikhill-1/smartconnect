import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);

  return (
    <>
      <footer>
        <div className="footer-content">
          <div className="mmk">
            <h3>HELP &amp; SUPPORT</h3>
            <h4>Phone: +91 9154364306 / 9849000000</h4>
            <address>
              Location: Pragathi Colony, Meerpet, Balapur Mandal, Hyderabad - 500097, Telangana, India
            </address>
            <h5>Affiliated to JNTUH &amp; Approved by AICTE, PCI</h5>
          </div>
          <button id="exp" onClick={() => navigate('/departments')}>
            Explore Departments
          </button>
        </div>
        
        <div className="footer-links-bar" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '15px' }}>
          <p style={{ color: '#E0F2FE', margin: '0', fontSize: '13px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', alignItems: 'center' }}>
            <span>&copy; {new Date().getFullYear()} TRR Group of Institutions. All rights reserved.</span>
            <span>|</span>
            <button 
              onClick={() => setShowPrivacyModal(true)} 
              style={{ background: 'none', border: 'none', color: '#ffffff', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '13px' }}
            >
              Privacy Policy
            </button>
            <span>|</span>
            <button 
              onClick={() => setShowCopyrightModal(true)} 
              style={{ background: 'none', border: 'none', color: '#ffffff', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '13px' }}
            >
              Copyright &amp; Terms
            </button>
            <span>|</span>
            <Link to="/contact" style={{ color: '#ffffff', textDecoration: 'underline' }}>
              Contact Us
            </Link>
          </p>
        </div>
      </footer>

      {showPrivacyModal && (
        <div className="modal-backdrop" onClick={() => setShowPrivacyModal(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="privacy-modal-card" onClick={e => e.stopPropagation()} style={{
            background: 'white', maxWidth: '600px', width: '100%', borderRadius: '10px',
            padding: '28px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            color: '#333'
          }}>
            <h2 style={{ color: '#1A4A95', marginTop: 0, borderBottom: '2px solid #5c9dd3', paddingBottom: '10px' }}>
              Institutional Privacy &amp; Data Protection Policy
            </h2>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
              <p><strong>1. Public Information Service:</strong> The SmartConnect AI Assistant and college website provide official, publicly approved information about TRR Group of Institutions, including academic programs, admissions criteria, fee guidelines, and campus facilities.</p>
              <p><strong>2. Student Record Confidentiality:</strong> In accordance with educational data protection regulations and institutional guidelines, student-identifying personal data, individual marks, and personal contact lists are strictly confidential and are not published or indexed for public AI retrieval.</p>
              <p><strong>3. Admission Enquiries:</strong> Information submitted through our online admission enquiry forms is used solely by the TRR Admissions Office to contact prospective candidates regarding counseling and eligibility.</p>
              <p><strong>4. Security Controls:</strong> Administrative interfaces and institutional management portals are protected by multi-layered authentication, brute-force safeguards, and cryptographic hashing.</p>
            </div>
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                style={{ background: '#267EB2', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCopyrightModal && (
        <div className="modal-backdrop" onClick={() => setShowCopyrightModal(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="copyright-modal-card" onClick={e => e.stopPropagation()} style={{
            background: 'white', maxWidth: '550px', width: '100%', borderRadius: '10px',
            padding: '28px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            color: '#333'
          }}>
            <h2 style={{ color: '#1A4A95', marginTop: 0, borderBottom: '2px solid #5c9dd3', paddingBottom: '10px' }}>
              Copyright &amp; Terms of Use
            </h2>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
              <p>&copy; {new Date().getFullYear()} Teegala Ram Reddy Educational Society. All rights reserved.</p>
              <p>All institutional logos, course brochures, campus photographs, and syllabus compilations are the intellectual property of TRR Group of Institutions or used with permission under affiliation with JNTU Hyderabad and approval by AICTE and PCI.</p>
              <p>Unauthorised reproduction, scraping, or redistribution of institutional materials without written permission is prohibited.</p>
            </div>
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button 
                onClick={() => setShowCopyrightModal(false)}
                style={{ background: '#267EB2', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
