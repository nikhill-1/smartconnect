import React from 'react';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';

export const AboutUsPage: React.FC = () => {
  return (
    <>
      <Header />
      <Navbar />

      <main>
        <img src="/aboutus.jpg" alt="About TRR Group of Institutions" id="imm" style={{ maxHeight: '400px' }} />

        <div className="ddd">
          <h1 id="h22">ACCREDITATIONS &amp; AFFILIATIONS</h1>
          <img src="/AICTELogo.jpg" alt="AICTE Approved" />
          <img src="/JNTUHyderabadlogo.jpg" alt="JNTU Hyderabad Affiliated" />
          <img src="/PharmacyCouncilofIndiaLogo.jpg" alt="Pharmacy Council of India Approved" />
        </div>

        <div className="kkk">
          <h1>ORIGINS</h1>
        </div>
        <div className="TKR">
          <img src="/TKR.jpg" alt="Late Mr. Teegala Krupakar Reddy" />
          <p>
            In loving memory of the late Mr. Teegala Krupakar Reddy, the esteemed founder of Teegala Ram Reddy Educational Society, whose legacy of self-reliance and educational enlightenment continues to inspire. With a distinguished career spanning over two decades in teaching and industry.
            <br /><br />
            His astute leadership steered the institution towards remarkable heights, fostering an ethos of academic excellence and holistic development. Through his enduring dedication, Mr. Teegala Krupakar Reddy's legacy lives on, shaping the TRR Group of Institutions as a beacon of transformative education and honorably empowering generations of students.
          </p>
        </div>

        <div className="kkk">
          <h1>CHAIRMAN</h1>
        </div>
        <div className="TNR">
          <p>
            In homage to the vibrant leadership of Mr. Teegala Nitesh Reddy, the dynamic Chairman of Teegala Ram Reddy Educational Society, whose fervor and vigilance have guided the institution since its inception in 2004. A visionary pioneer, he initiated Hyderabad's first private Polytechnic, laying the foundation for excellence. His tireless dedication expanded further with the establishment of the B. Pharmacy college in 2006 and the establishment of Engineering Technology College in 2023, fueled by a steadfast commitment to quality education. Today, as Chairman, his illustrious leadership continues to elevate the institution, fulfilling his vision of enlightenment and empowerment through education. His remarkable contributions adorn the TRR Educational Society with enduring pride and distinction.
            <br /><br />
            Under his visionary stewardship, TRR Group of Institutions has flourished into a beacon of educational excellence, enriching the lives of countless students. Mr. Nitesh Reddy's unwavering commitment to fostering a culture of academic rigor and holistic development has propelled the institution to new heights of success, solidifying its reputation as a hub of innovation and learning. His legacy as Chairman is not only one of remarkable achievement but also of profound impact, as he continues to inspire generations to strive for excellence and pursue their dreams.
          </p>
          <img src="/TNR.jpg" alt="Mr. Teegala Nitesh Reddy" />
        </div>

        <div className="kkk">
          <h1>SECRETARY</h1>
        </div>
        <div className="TKR">
          <img src="/TMR.jpg" alt="Ms. Teegala Mona Reddy" />
          <p>
            Ms. Teegala Mona Reddy plays a pivotal role as a key member of the management team, dedicated to fostering excellence in education at Teegala Ram Reddy Group of Institutions. Trained in Teaching Methods and Technology, her expertise underscores her commitment to advancing educational practices within the institution. With a keen focus on continuous improvement, Ms. Reddy endeavors to leverage her extensive experience to enhance the academic experience for both students and faculty alike.
            <br /><br />
            In addition to her contributions within the college, Ms. Reddy's philanthropic endeavors exemplify her dedication to broader community engagement. As the driving force behind the establishment of &quot;Rakshitha,&quot; an NGO aimed at extending educational opportunities to underprivileged children in rural Telangana, she demonstrates a deep-seated commitment to social impact. Her passion for improving educational standards is further evidenced by her efforts to create a conducive learning environment for pharmacy students, facilitating their pursuit of successful careers. Ms. Reddy's multifaceted contributions embody the ethos of TRR Group of Institutions, reflecting a steadfast dedication to educational excellence and societal welfare.
          </p>
        </div>

        <AiBanner />
      </main>

      <Footer />
    </>
  );
};
