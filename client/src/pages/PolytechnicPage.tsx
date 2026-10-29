import React from 'react';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';

export const PolytechnicPage: React.FC = () => {
  return (
    <>
      <Header />
      <Navbar />

      <main>
        <img src="/polyt.jpg" alt="TRR Polytechnic College" id="imm" />
        
        <h1 id="h22">Vision of the Institute</h1>
        <p id="h23">
          TRR College of Polytechnic Technology aspires to be a beacon of excellence, providing quality education rooted in ethics, driving transformative research and nurturing industry-ready professionals, while empowering individuals to lead with integrity, innovation and a global perspective.
        </p>

        <h1 id="h24">Mission of the Institute</h1>
        <p style={{ textAlign: 'center' }} id="polytech">
          <b>Mission 1</b><br />
          To provide quality education and training using innovative pedagogical techniques.
          <br /><br />
          <b>Mission 2</b><br />
          To provide adaptable educational programs with partnerships tailored to meet the demands of the industry.
          <br /><br />
          <b>Mission 3</b><br />
          Enhance the pace of quality in learning, research &amp; innovation.
          <br /><br />
          <b>Mission 4</b><br />
          To prepare the students competent to continue their higher studies in the fields concerned.
          <br /><br />
          <b>Mission 5</b><br />
          Instilling a sense of moral and ethical values through education fosters social responsibility.
        </p>

        <AiBanner />
      </main>

      <Footer />
    </>
  );
};
