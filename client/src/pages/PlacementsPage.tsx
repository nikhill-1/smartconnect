import React from 'react';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AiBanner } from '../components/AiBanner';

export const PlacementsPage: React.FC = () => {
  const stats = [
    { label: 'Highest Package', value: '12 LPA', detail: 'Software & Technology' },
    { label: 'Average Package', value: '4.5 LPA', detail: 'Across all streams' },
    { label: 'Placement Percentage', value: '85%+', detail: 'Eligible students' },
    { label: 'Recruiting Companies', value: '60+', detail: 'MNCs & Core Industries' },
  ];

  const recruiters = [
    { name: 'Tata Consultancy Services (TCS)', category: 'IT & Software' },
    { name: 'Infosys', category: 'IT & Consulting' },
    { name: 'Wipro Technologies', category: 'Software Services' },
    { name: 'Cognizant (CTS)', category: 'Technology' },
    { name: 'Tech Mahindra', category: 'Telecom & Tech' },
    { name: 'Capgemini', category: 'Global Consulting' },
    { name: 'Dr. Reddy\'s Laboratories', category: 'Pharmaceuticals' },
    { name: 'Hetero Drugs', category: 'Pharma & Biotech' },
    { name: 'Aurobindo Pharma', category: 'Healthcare' },
    { name: 'L&T Infotech', category: 'Engineering & IT' },
    { name: 'Accenture', category: 'Strategy & Tech' },
    { name: 'Schneider Electric', category: 'Electrical & Automation' },
  ];

  const trainingModules = [
    {
      title: 'Aptitude & Logical Reasoning',
      desc: 'Regular classroom sessions covering quantitative aptitude, data interpretation, and verbal ability starting from the 2nd year.',
    },
    {
      title: 'Technical Coding Bootcamps',
      desc: 'Hands-on programming workshops in Python, Java, Data Structures, Web Development, and Cloud computing.',
    },
    {
      title: 'Soft Skills & Personality Development',
      desc: 'Professional communication, resume building, presentation skills, and corporate etiquette training.',
    },
    {
      title: 'Mock Interviews & Group Discussions',
      desc: 'Simulated interview rounds led by senior industry professionals and alumni mentors to build interview confidence.',
    },
  ];

  return (
    <>
      <Header />
      <Navbar />

      <main style={{ maxWidth: '1240px', margin: '20px auto 40px auto', padding: '0 20px' }}>
        <h1 id="h22" style={{ marginTop: '20px' }}>Training and Placement Cell</h1>
        <p id="h23" style={{ maxWidth: '950px' }}>
          At TRR Group of Institutions, our Training &amp; Placement Cell bridges the gap between academic learning and industry expectations. Through comprehensive Campus Recruitment Training (CRT) and strong corporate partnerships, we empower graduates to secure rewarding career opportunities across IT, Pharmaceutical, and Core Engineering sectors.
        </p>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', margin: '40px 0' }}>
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'white',
                padding: '25px 20px',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(38, 126, 178, 0.12)',
                borderTop: '4px solid #267EB2',
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#1A4A95', marginBottom: '8px' }}>{s.value}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{s.detail}</div>
            </div>
          ))}
        </div>

        {/* Top Recruiters */}
        <div style={{ margin: '50px 0' }}>
          <h2 style={{ color: '#267EB2', textAlign: 'center', fontSize: '28px', marginBottom: '10px' }}>Our Prominent Recruiting Partners</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px', fontSize: '15px' }}>
            Leading national and multinational corporations recruit talent from TRR campuses annually.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px' }}>
            {recruiters.map((r, i) => (
              <div
                key={i}
                style={{
                  background: 'white',
                  padding: '18px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#267EB2' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{r.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{r.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Training Programs */}
        <div style={{ margin: '60px 0' }}>
          <h2 style={{ color: '#267EB2', textAlign: 'center', fontSize: '28px', marginBottom: '30px' }}>Campus Recruitment Training (CRT)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {trainingModules.map((m, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '24px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <h3 style={{ color: '#1A4A95', margin: '0 0 10px 0', fontSize: '18px' }}>{m.title}</h3>
                <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Placement Cell Banner */}
        <div
          style={{
            background: 'linear-gradient(to right, #1A4A95, #267EB2)',
            color: 'white',
            borderRadius: '12px',
            padding: '35px 25px',
            textAlign: 'center',
            margin: '40px 0',
          }}
        >
          <h2 style={{ margin: '0 0 10px 0', color: 'white' }}>For Corporate Recruitment &amp; Placement Enquiries</h2>
          <p style={{ maxWidth: '700px', margin: '0 auto 20px auto', fontSize: '15px', opacity: 0.9 }}>
            Training &amp; Placement Officer, TRR Group of Institutions, Pragathi Colony, Meerpet, Hyderabad - 500097.
          </p>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            Phone: 9154364306 | Email: placements@trr.org.in
          </div>
        </div>

        <AiBanner />
      </main>

      <Footer />
    </>
  );
};

