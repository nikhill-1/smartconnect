import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';

export const HomePage: React.FC = () => {
  return (
    <>
      <Header />
      <Navbar />

      <main>
        <img src="/main page.jpg" alt="University bust statue" id="imm" />
        
        <h1 id="h22">Welcome to TRR Group of Institutions</h1>
        <p id="h23">
          Welcome to TRR Group of Institutions, a pioneering educational hub established in 2002. Affiliated with JNTUH 
          University, we offer a spectrum of courses including Engineering, Pharmaceuticals, and Polytechnic studies. Our 
          commitment to academic excellence, coupled with state-of-the-art facilities and experienced faculty, ensures a 
          dynamic learning environment for our students. At TRR, we strive to foster innovation, critical thinking, and 
          holistic development, empowering our graduates to excel in their chosen fields and contribute positively to 
          society.
        </p>

        <h1 id="h24">Explore study</h1>
        <div className="hoo">
          <div className="explore-card">
            <Link to="/departments">
              <img src="/page.jpg" alt="Engineering" />
              <span>Engineering</span>
            </Link>
          </div>

          <div className="explore-card">
            <Link to="/departments">
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
