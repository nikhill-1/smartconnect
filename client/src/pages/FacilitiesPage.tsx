import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';

export const FacilitiesPage: React.FC = () => {
  return (
    <>
      <Header />
      <Navbar />

      <main>
        <h1 id="h22" style={{ marginTop: '35px' }}>Campus Facilities &amp; Infrastructure</h1>
        <div className="hoo">
          <div className="explore-card">
            <Link to="/academics">
              <img src="/page.jpg" alt="Engineering Facilities" />
              <span>Engineering</span>
            </Link>
          </div>

          <div className="explore-card">
            <Link to="/academics">
              <img src="/page2.jpg" alt="Pharmacy Facilities" />
              <span>Pharmacy</span>
            </Link>
          </div>

          <div className="explore-card">
            <Link to="/polytechnic">
              <img src="/page3.jpg" alt="Polytechnic Facilities" />
              <span>Polytechnic</span>
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: '1000px', margin: '20px auto 40px auto', padding: '0 20px', lineHeight: '1.8', fontSize: '18px', color: '#444' }}>
          <p>
            TRR Group of Institutions provides state-of-the-art infrastructure across its sprawling green campus in Meerpet, Hyderabad. Facilities include advanced computing centers, pharmaceutical research laboratories, digital central libraries with IEEE and national journal access, student hostel accommodations with hygienic dining, indoor/outdoor sports arenas, first aid medical dispensaries with student insurance, and high-speed campus-wide Wi-Fi connectivity.
          </p>
        </div>

        <AiBanner />
      </main>

      <Footer />
    </>
  );
};
