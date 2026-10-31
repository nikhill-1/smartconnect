import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';
import { AdmissionEnquiryModal } from '../components/AdmissionEnquiryModal';

export const DepartmentsPage: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<'all' | 'engineering' | 'pharmacy' | 'polytechnic'>('all');
  const [modalCourse, setModalCourse] = useState<string | null>(null);

  const departments = [
    {
      category: 'engineering',
      code: 'B.Tech CSE',
      name: 'Computer Science and Engineering',
      intake: '180 Seats',
      hod: 'Prof. K. Vishal Khanna (M.Tech, Ph.D)',
      description:
        'Focuses on software engineering, cloud computing, artificial intelligence, and full-stack development with state-of-the-art computer laboratories.',
      labs: [
        'Advanced Computing Lab',
        'Data Structures & Algorithms Lab',
        'Cloud Computing & Networks Lab',
        'Database Management Systems Lab',
        'AI & Machine Learning Innovation Center',
      ],
      keyFaculty: ['K. Vishal Khanna', 'Patan Waheeda', 'Devalla Suryanarayana', 'Maithili Manchana'],
    },
    {
      category: 'engineering',
      code: 'B.Tech INF',
      name: 'Information Technology',
      intake: '60 Seats',
      hod: 'Dr. S. R. Murthy (Ph.D)',
      description:
        'Covers enterprise software systems, cybersecurity, network architectures, and mobile applications development.',
      labs: ['Web Technologies Lab', 'Software Engineering Lab', 'Network Security Lab'],
      keyFaculty: ['Santhoshi Neela', 'Ushashwini Beesu', 'Sri Lakshmi M'],
    },
    {
      category: 'engineering',
      code: 'B.Tech ECE',
      name: 'Electronics and Communication Engineering',
      intake: '60 Seats',
      hod: 'Prof. P. Ramana Rao (M.Tech)',
      description:
        'Provides rigorous training in VLSI design, embedded systems, IoT sensors, digital signal processing, and telecommunication systems.',
      labs: ['VLSI & Embedded Systems Lab', 'DSP & Microprocessors Lab', 'Analog & Digital Communications Lab'],
      keyFaculty: ['Jadala Sravani', 'Katravath Mahesh', 'Vinoothna Dingari'],
    },
    {
      category: 'engineering',
      code: 'B.Tech ME',
      name: 'Mechanical Engineering',
      intake: '60 Seats',
      hod: 'Prof. K. N. Chary (M.Tech)',
      description:
        'Equips students with principles of design, thermodynamics, manufacturing technology, robotics, and CAD/CAM.',
      labs: ['CAD/CAM Simulation Center', 'Thermodynamics & Heat Transfer Lab', 'Manufacturing Workshop & Foundry'],
      keyFaculty: ['Sumalatha Vandanapu', 'Madhagoni Priyanka'],
    },
    {
      category: 'engineering',
      code: 'B.Tech CE',
      name: 'Civil Engineering',
      intake: '60 Seats',
      hod: 'Prof. G. V. Reddy (M.Tech)',
      description:
        'Specializes in structural engineering, environmental engineering, geotechnical analysis, and modern surveying using Total Stations.',
      labs: ['Strength of Materials Lab', 'Surveying & Geoinformatics Lab', 'Concrete Technology & Soil Mechanics Lab'],
      keyFaculty: ['Devalla Suryanarayana', 'Lasya Chidurala'],
    },
    {
      category: 'pharmacy',
      code: 'B.Pharm',
      name: 'Bachelor of Pharmacy (B.Pharm - 4 Years)',
      intake: '100 Seats',
      hod: 'Dr. M. Srinivasa Rao (M.Pharm, Ph.D)',
      description:
        'PCI approved program preparing students for pharmaceutical research, pharmacology, drug regulatory affairs, hospital pharmacy, and formulations.',
      labs: [
        'Pharmaceutics Formulation Lab',
        'Pharmaceutical Chemistry Lab',
        'Pharmacology & Toxicology Lab',
        'Pharmacognosy & Phytochemistry Lab',
        'Central Instrumentation Facility (HPLC/UV)',
      ],
      keyFaculty: ['Dr. M. Srinivasa Rao', 'Ms. Teegala Mona Reddy (Advisory)', 'K. Sunitha'],
    },
    {
      category: 'pharmacy',
      code: 'M.Pharm',
      name: 'Master of Pharmacy (Pharmaceutics / Analysis)',
      intake: '30 Seats',
      hod: 'Dr. V. Lakshmi (Ph.D)',
      description:
        'Postgraduate research degree specializing in novel drug delivery systems, industrial pharmaceutical manufacturing, and quality control.',
      labs: ['Advanced Drug Delivery Systems Lab', 'Analytical Quality Assurance Lab'],
      keyFaculty: ['Dr. V. Lakshmi', 'P. Ramesh'],
    },
    {
      category: 'polytechnic',
      code: 'Diploma CSE',
      name: 'Polytechnic - Diploma in Computer Engineering',
      intake: '120 Seats',
      hod: 'Sri K. Srinivas (Principal In-charge)',
      description:
        'Practical 3-year foundational diploma accredited by NBA in 2024; provides extensive coding and hardware assembly skills.',
      labs: ['Computer Hardware & Assembly Lab', 'C/C++ & Java Programming Lab', 'Internet Technology Lab'],
      keyFaculty: ['K. Srinivas', 'B. Rajesh', 'M. Anusha'],
    },
    {
      category: 'polytechnic',
      code: 'Diploma ECE / EEE',
      name: 'Polytechnic - Diploma in ECE & EEE',
      intake: '120 Seats',
      hod: 'Sri Ch. Venkatesh (M.Tech)',
      description:
        'Focuses on industrial electronics, electrical wiring, power systems, transformer testing, and microcontrollers.',
      labs: ['Electrical Machines Lab', 'Electronic Devices & Circuits Lab', 'Power Electronics Lab'],
      keyFaculty: ['Ch. Venkatesh', 'K. Swetha'],
    },
  ];

  const filteredDepts =
    selectedDept === 'all' ? departments : departments.filter((d) => d.category === selectedDept);

  return (
    <>
      <Header />
      <Navbar />

      <main style={{ maxWidth: '1240px', margin: '20px auto 40px auto', padding: '0 20px' }}>
        <h1 id="h22" style={{ marginTop: '20px' }}>Our Academic Departments</h1>
        <p id="h23" style={{ maxWidth: '900px' }}>
          Explore programs, specialized laboratories, intake capacities, and department leadership across Engineering, Pharmacy, and Polytechnic streams.
        </p>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', margin: '30px 0', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Departments' },
            { id: 'engineering', label: 'Engineering (B.Tech)' },
            { id: 'pharmacy', label: 'Pharmacy (B.Pharm / M.Pharm)' },
            { id: 'polytechnic', label: 'Polytechnic (Diploma)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDept(tab.id as any)}
              style={{
                backgroundColor: selectedDept === tab.id ? '#267EB2' : 'white',
                color: selectedDept === tab.id ? 'white' : '#267EB2',
                border: '2px solid #267EB2',
                borderRadius: '25px',
                padding: '8px 20px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Departments Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
          {filteredDepts.map((d, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span
                    style={{
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {d.code}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Intake: {d.intake}</span>
                </div>

                <h3 style={{ color: '#1A4A95', margin: '0 0 8px 0', fontSize: '20px' }}>{d.name}</h3>
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                  <b>Head of Dept:</b> {d.hod}
                </div>
                <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', marginBottom: '16px' }}>
                  {d.description}
                </p>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Specialized Laboratories:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#475569' }}>
                    {d.labs.map((lab, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>
                        {lab}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', marginTop: '10px' }}>
                <button
                  onClick={() => setModalCourse(d.name)}
                  style={{
                    width: '100%',
                    backgroundColor: '#267EB2',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1A4A95')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#267EB2')}
                >
                  Apply for Admission &rarr;
                </button>
              </div>
            </div>
          ))}
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
