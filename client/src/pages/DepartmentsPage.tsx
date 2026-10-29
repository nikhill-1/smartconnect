import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';

export const DepartmentsPage: React.FC = () => {
  return (
    <>
      <Header />
      <Navbar />

      <main>
        <h1 id="h22" style={{ marginTop: '40px' }}>Our Academic Departments</h1>
        <div className="hoo">
          <div className="explore-card">
            <Link to="/academics">
              <img src="/page.jpg" alt="Engineering" />
              <span>Engineering</span>
            </Link>
          </div>

          <div className="explore-card">
            <Link to="/academics">
              <img src="/page2.jpg" alt="Pharmacy" />
              <span>Pharmacy</span>
            </Link>
          </div>

          <div className="explore-card">
            <Link to="/polytechnic">
              <img src="/page3.jpg" alt="Polytechnic" />
              <span>Polytechnic</span>
            </Link>
          </div>
        </div>

        <AiBanner />
      </main>

      <Footer />
    </>
  );
};
