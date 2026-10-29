import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer>
      <div className="footer-content">
        <div className="mmk">
          <h3>HELP &amp; SUPPORT</h3>
          <h4>phone number : 9154364306</h4>
          <address>
            Location: Pragathi Colony, Meerpet, Hyderabad - 500097, Telangana
          </address>
          <h5>Explore Campus</h5>
        </div>
        <button id="exp" onClick={() => navigate('/departments')}>
          Explore Now
        </button>
      </div>
      <br />
      <p style={{ color: 'white', margin: '20px 0 0 0', fontSize: '14px' }}>
        TRR GROUP @ 2024 | Copyright | Privacy Policy | Contact Us
      </p>
    </footer>
  );
};
