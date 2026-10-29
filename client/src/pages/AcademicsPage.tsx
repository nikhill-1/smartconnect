import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';

export const AcademicsPage: React.FC = () => {
  return (
    <>
      <Header />
      <Navbar />

      <main>
        <h1 id="h22" style={{ marginTop: '35px' }}>Academic Programs &amp; Study Options</h1>
        <div className="hooh1">
          <div className="hh2">
            <img src="/engg.jpg" alt="Engineering" />
            <h3>ENGINEERING</h3>
            <Link to="/admissions">
              <button>Study options</button>
            </Link>
          </div>

          <div className="hh3">
            <img src="/pharm.jpg" alt="Pharmacy" />
            <h3>PHARMACY</h3>
            <Link to="/admissions">
              <button>Study options</button>
            </Link>
          </div>

          <div className="hh4">
            <img src="/poly.jpg" alt="Polytechnic" />
            <h3>POLYTECHNIC</h3>
            <Link to="/polytechnic">
              <button>Study options</button>
            </Link>
          </div>
        </div>

        <AiBanner />
      </main>

      <Footer />
    </>
  );
};
