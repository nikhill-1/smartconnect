import React from 'react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header>
      <div className="par">
        <p id="para">
          Approved by A.I.C.T.E, PCI & Affiliated to JNTUH; Engineering &amp; Polytechnic Codes : JNTUH - XZ, TS EAPCET - TRRM : Pharmacy Codes : JNTUH - AD, TS EAPCET : TRPM, TRPM1
        </p>
      </div>
      <div className="heade">
        <div className="heade-brand">
          <Link to="/">
            <img src="/download.png" alt="trr.org.in" height="123" width="120" style={{ cursor: 'pointer' }} />
          </Link>
          <h2 id="hh1">
            TRR GROUP OF INSTITUTIONS
            <br />
            <small style={{ fontSize: '12px', color: '#1A4A95' }}>
              ENGINEERING - PHARMACY - POLYTECHNIC
            </small>
            <br />
            <small style={{ fontSize: '12px', color: '#1A4A95' }}>
              Hyderabad, Telangana
            </small>
          </h2>
        </div>
        <div className="mm">
          <Link to="/chatbot">
            <button id="lki">AI-CHATBOT</button>
          </Link>
        </div>
      </div>
    </header>
  );
};
