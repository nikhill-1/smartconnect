import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';

export const AdmissionsPage: React.FC = () => {
  return (
    <>
      <Header />
      <Navbar />

      <main>
        <img src="/add.jpg" alt="TRR Admissions" id="imm" />
        <h1 id="h24">Admission Requirment</h1>

        <div className="p55">
          <div className="h12">
            <div>
              <img src="/engg.jpg" alt="Engineering" />
              <h1>ENGINEERING</h1>
              <h4>
                BTECH CSE/INF : <br />
                - EAPCET : For 1st Year Admission<br />
                - ECET : For 2nd Year Admission<br />
                70% Seats filled through EAPCET Rank<br />
                30% Seats Filled through Management (Based on Inter Marks)<br />
                CATEGORY A : (70% - Seats)<br />
                CATEGORY B : (30% - Seats)<br />
                - Test : TS-EAMCET / TS -EMCETD<br />
                - Eligibility : +12 / Inter (MPC) / Polytechnic<br />
                - Duration : 4 Years<br />
                - Test : TS-CHE<br />
                - Eligibility : +12 / Inter (MPC)
              </h4>
            </div>
            <Link to="/contact">
              <button>Apply Now</button>
            </Link>
          </div>

          <div className="h13">
            <div>
              <img src="/pharm.jpg" alt="Pharmacy" />
              <h1>PHARMACY</h1>
              <h4>
                PHARMACY <br />
                B PHARM : <br />
                70% Seats filled through EAPCET Rank <br />
                30% Seats Filled through Management (Based on Inter Marks) <br />
                CATEGORY A : (70% - Seats) <br />
                CATEGORY B : (30% - Seats) <br />
                - Test : TS-EAMCET / TS -EMCETD <br />
                - Eligibility : +12 / Inter (BiPC) / Polytechnic <br />
                - Duration : 4 Years <br />
                - Test : TS-CHE <br />
                - Eligibility : +12 / Inter (BiPC) <br />
                - Duration : 4 Years <br />
                - EAPCET : For 1st Year Admission <br />
                - ECET : For 2nd Year Admission <br />
                M PHARM : <br />
                - GPAT / TS PGCET
              </h4>
            </div>
            <Link to="/contact">
              <button>Apply Now</button>
            </Link>
          </div>

          <div className="h14">
            <div>
              <img src="/poly.jpg" alt="Polytechnic" />
              <h1>POLYTECHNIC</h1>
              <h4>
                DIPLOMA <br />
                (Civil/ Computer/ Electronics &amp; Communication/ Electrical &amp; Electronics/ Mechanical) : <br /><br />
                - Test POLYCET <br />
                - Eligibility : +10 / Inter (MPC) <br />
                - Duration : 3 Years
              </h4>
            </div>
            <Link to="/polytechnic">
              <button>Apply Now</button>
            </Link>
          </div>
        </div>

        <AiBanner />
      </main>

      <Footer />
    </>
  );
};
