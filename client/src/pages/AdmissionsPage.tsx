import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';
import { AdmissionEnquiryModal } from '../components/AdmissionEnquiryModal';

export const AdmissionsPage: React.FC = () => {
  const [modalCourse, setModalCourse] = useState<string | null>(null);

  return (
    <>
      <Header />
      <Navbar />

      <main>
        <img src="/add.jpg" alt="TRR Admissions" id="imm" />
        <h1 id="h24">Admission Requirements &amp; Eligibility</h1>

        <div className="p55">
          <div className="h12">
            <div>
              <img src="/engg.jpg" alt="Engineering" />
              <h1>ENGINEERING</h1>
              <h4>
                BTECH CSE / INF / ECE / ME / CE: <br />
                - TS EAPCET: For 1st Year Admission<br />
                - ECET: For 2nd Year Lateral Entry Admission<br />
                70% Seats filled through EAPCET Convener Quota<br />
                30% Seats Filled through Management (Based on Intermediate Marks)<br /><br />
                CATEGORY A: (70% - Convener Seats)<br />
                - Entrance Test: TS-EAMCET / TS-EAPCET<br />
                - Eligibility: +12 / Intermediate (MPC) / Diploma<br />
                - Duration: 4 Years (3 Years Lateral)<br /><br />
                CATEGORY B: (30% - Management Seats)<br />
                - Eligibility: +12 / Intermediate (MPC) minimum 45% marks
              </h4>
            </div>
            <button onClick={() => setModalCourse('B.Tech Engineering')}>
              Apply Now
            </button>
          </div>

          <div className="h13">
            <div>
              <img src="/pharm.jpg" alt="Pharmacy" />
              <h1>PHARMACY</h1>
              <h4>
                B.PHARM (Bachelor of Pharmacy): <br />
                70% Seats filled through TS EAPCET Rank<br />
                30% Seats Filled through Management (Based on Inter Marks)<br /><br />
                CATEGORY A: (70% - Seats)<br />
                CATEGORY B: (30% - Seats)<br />
                - Entrance Test: TS-EAMCET / TS-EAPCET<br />
                - Eligibility: +12 / Intermediate (BiPC or MPC)<br />
                - Duration: 4 Years<br /><br />
                M.PHARM (Master of Pharmacy):<br />
                - Entrance Test: GPAT / TS PGCET<br />
                - Eligibility: B.Pharm degree recognized by PCI<br />
                - Duration: 2 Years
              </h4>
            </div>
            <button onClick={() => setModalCourse('Bachelor of Pharmacy (B.Pharm)')}>
              Apply Now
            </button>
          </div>

          <div className="h14">
            <div>
              <img src="/poly.jpg" alt="Polytechnic" />
              <h1>POLYTECHNIC</h1>
              <h4>
                DIPLOMA (3-Year Technical Engineering): <br />
                (Civil / Computer / ECE / EEE / Mechanical)<br /><br />
                - Entrance Test: POLYCET<br />
                - Eligibility: 10th Class / SSC Pass with Maths &amp; Science<br />
                - Duration: 3 Years<br />
                - Accreditation: NBA Certified in 2024<br />
                - Annual Tuition Fee: ~Rs. 12,600 / Year (Counseling Quota)<br />
                - Government Fee Reimbursement applicable for eligible students
              </h4>
            </div>
            <button onClick={() => setModalCourse('Polytechnic Diploma')}>
              Apply Now
            </button>
          </div>
        </div>

        <AiBanner />
      </main>

      {modalCourse && (
        <AdmissionEnquiryModal
          isOpen={true}
          defaultCourse={modalCourse}
          onClose={() => setModalCourse(null)}
        />
      )}

      <Footer />
    </>
  );
};
