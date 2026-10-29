import React from 'react';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';

export const ContactUsPage: React.FC = () => {
  return (
    <>
      <Header />
      <Navbar />

      <main>
        <img src="/pharm1.jpg" alt="TRR College Campus" id="imm" />
        <h1 id="h22"><b>CONTACT US</b></h1>

        <div className="lk">
          <div>
            <h3>ENGINEERING DEPARTMENT:</h3>
            <p>
              Numbers : 7396067291 <br />
              E-mail : info@trr.org.in
            </p>
          </div>

          <div>
            <h3>PHARMACY DEPARTMENT :</h3>
            <p>
              Phone Numbers : 91543 64310, 9154364306 <br />
              E-mail : pharmacy@trr.org.in
            </p>
          </div>

          <div>
            <h3>POLYTECHNIC DEPARTMENT :</h3>
            <p>
              Phone Numbers : 91543 64291, 91543 64299
            </p>
          </div>
        </div>

        <AiBanner />
      </main>

      <Footer />
    </>
  );
};
