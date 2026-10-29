export interface KnowledgeDocSeed {
  id: string;
  title: string;
  sourceType: string;
  sourceReference: string;
  accessClassification: 'public' | 'restricted';
  approvalStatus: 'approved' | 'pending';
  version: string;
  chunks: {
    content: string;
    section: string;
    pageNumber: number;
  }[];
}

export const initialKnowledgeData: KnowledgeDocSeed[] = [
  {
    id: 'doc-overview-establishment',
    title: 'TRR Institutional Overview and Accreditations',
    sourceType: 'official_overview',
    sourceReference: 'TRR College Handbook & AICTE/PCI/JNTUH Affiliation Records',
    accessClassification: 'public',
    approvalStatus: 'approved',
    version: '1.0',
    chunks: [
      {
        section: 'Establishment & Affiliations',
        pageNumber: 1,
        content: `TRR Group of Institutions is a premier educational group located in Meerpet, Hyderabad, Telangana, established in 2002.
The group includes TRR College of Technology (established in 2004), TRR College of Pharmacy (established in 2006), and TRR Engineering College.
TRR College of Technology is the first private Polytechnic college in Andhra Pradesh and Telangana, and it was accredited and certified by NBA in 2024.
All technical programs are approved by A.I.C.T.E. (All India Council for Technical Education) and affiliated to JNTUH (Jawaharlal Nehru Technological University, Hyderabad).
Pharmacy programs are approved by the Pharmacy Council of India (PCI) and affiliated to JNTUH.`,
      },
      {
        section: 'Institutional EAPCET & JNTUH Codes',
        pageNumber: 1,
        content: `Official Institutional Identification Codes:
- Engineering & Polytechnic JNTUH College Code: XZ
- Engineering & Polytechnic TS EAPCET Counseling Code: TRRM
- Pharmacy JNTUH College Code: AD
- Pharmacy TS EAPCET Counseling Codes: TRPM, TRPM1`,
      },
      {
        section: 'Vision and Mission',
        pageNumber: 2,
        content: `Vision of the Institute: TRR College of Technology aspires to be a beacon of excellence, providing quality education rooted in ethics, driving transformative research and nurturing industry-ready professionals, while empowering individuals to lead with integrity, innovation and a global perspective.
Missions:
Mission 1: To provide quality education and training using innovative pedagogical techniques.
Mission 2: To provide adaptable educational programs with partnerships tailored to meet the demands of the industry.
Mission 3: Enhance the pace of quality in learning, research and innovation.
Mission 4: To prepare students competent to continue their higher studies in the fields concerned.
Mission 5: Instilling a sense of moral and ethical values through education fostering social responsibility.`,
      },
    ],
  },
  {
    id: 'doc-leadership-governance',
    title: 'Leadership, Founders and College Administration',
    sourceType: 'administrative_profile',
    sourceReference: 'TRR Governance Directory 2024',
    accessClassification: 'public',
    approvalStatus: 'approved',
    version: '1.0',
    chunks: [
      {
        section: 'Founders & Management',
        pageNumber: 1,
        content: `Founder: The late Mr. Teegala Krupakar Reddy is the esteemed founder of Teegala Ram Reddy Educational Society. With a distinguished career spanning over two decades in teaching and industry, his astute leadership steered the institution towards academic excellence.
Chairman: Mr. Teegala Nitesh Reddy is the dynamic Chairman of Teegala Ram Reddy Educational Society. He pioneered Hyderabad's first private Polytechnic in 2004, established the B. Pharmacy college in 2006, and expanded the Engineering Technology College.
Secretary: Ms. Teegala Mona Reddy plays a pivotal role in executive management, dedicated to advancing pedagogical practices and modern educational technology. She is also the founder of the NGO 'Rakshitha', extending education to underprivileged children in rural Telangana.`,
      },
      {
        section: 'Principal & Vice Principal',
        pageNumber: 2,
        content: `College Leadership:
- Principal of TRR College of Technology: K. Vishal Khanna sir (Mr. Vishal Khanna).
- Vice Principal: Srinivas sir.
The principal oversees academic curriculum delivery, department coordinators, student counseling, and university examination compliance under JNTUH.`,
      },
    ],
  },
  {
    id: 'doc-timings-and-rules',
    title: 'College Timings, Rules and Campus Regulations',
    sourceType: 'handbook_circular',
    sourceReference: 'Academic Regulations & Student Conduct Guidelines',
    accessClassification: 'public',
    approvalStatus: 'approved',
    version: '1.0',
    chunks: [
      {
        section: 'College Daily Timings',
        pageNumber: 1,
        content: `College Timings:
TRR Group of Institutions operates from 9:00 AM to 3:20 PM, Monday through Saturday (excluding designated university holidays).
Students are expected to arrive before 8:50 AM. Class sessions commence promptly at 9:00 AM.`,
      },
      {
        section: 'Campus Code of Conduct and Discipline',
        pageNumber: 1,
        content: `Rules and Regulations of the College:
1. Mobile Phones: Mobile phone usage during classes, practical laboratories, and seminar sessions is strictly prohibited.
2. College Gates: For student security and discipline, campus entry gates are closed shortly after 9:00 AM. Unauthorized entry or exit during session hours is not permitted.
3. Class Attendance: Regular attendance is compulsory. Bunking classes is strictly forbidden, and students must maintain a minimum 75% attendance for JNTUH exam hall ticket issuance.
4. Anti-Ragging: Ragging in any form (physical, verbal, or mental) is strictly prohibited by law and subject to zero tolerance and immediate disciplinary expulsion.`,
      },
    ],
  },
  {
    id: 'doc-courses-departments-faculty',
    title: 'Courses Offered, Departments and Faculty Directory',
    sourceType: 'academic_catalogue',
    sourceReference: 'Academic Department Registry 2024-2025',
    accessClassification: 'public',
    approvalStatus: 'approved',
    version: '1.0',
    chunks: [
      {
        section: 'Courses Offered',
        pageNumber: 1,
        content: `Academic Programs and Courses Offered at TRR Group of Institutions:
1. Engineering (B.Tech):
   - Computer Science and Engineering (CSE)
   - Information Technology (INF)
   - Electronics and Communication Engineering (ECE)
   - Mechanical Engineering (ME)
   - Civil Engineering (CE)
2. Pharmacy:
   - Bachelor of Pharmacy (B.Pharm) - 4 Year undergraduate program
   - Master of Pharmacy (M.Pharm) - Postgraduate specialization
3. Polytechnic (Diploma):
   - Diploma in Computer Engineering
   - Diploma in Electronics and Communication Engineering (ECE)
   - Diploma in Electrical and Electronics Engineering (EEE)
   - Diploma in Mechanical Engineering
   - Diploma in Civil Engineering`,
      },
      {
        section: 'CSE Department Faculty',
        pageNumber: 2,
        content: `Faculty of the Computer Science and Engineering (CSE) Department:
- K. Vishal Khanna
- Patan Waheeda
- Devalla Suryanarayana
- Maithili Manchana
- Santhoshi Neela
- Ushashwini Beesu
- Lasya Chidurala
- Sri Lakshmi M
- Jadala Sravani
- Sumalatha Vandanapu
- Katravath Mahesh
- Vinoothna Dingari
- Madhagoni Priyanka`,
      },
    ],
  },
  {
    id: 'doc-admissions-and-documents',
    title: 'Admissions Process, Eligibility and Required Documents',
    sourceType: 'admission_brochure',
    sourceReference: 'TRR Admissions Notification 2024-2025',
    accessClassification: 'public',
    approvalStatus: 'approved',
    version: '1.0',
    chunks: [
      {
        section: 'Admission Requirements by Program',
        pageNumber: 1,
        content: `Admission Eligibility and Seat Allocation:
1. B.Tech Engineering:
   - Category A (70% Seats): Filled through TS EAPCET / TS-EAMCET convener counseling based on rank.
   - Category B (30% Seats): Filled through Management Quota based on Intermediate (+12 MPC) merit marks.
   - Eligibility: +12 / Intermediate (MPC) or Polytechnic Diploma for lateral entry.
   - Lateral Entry: 2nd Year B.Tech admissions through ECET rank.
   - Program Duration: 4 Years (3 Years for lateral entry).
2. B.Pharm Pharmacy:
   - Category A (70% Seats): Filled through TS EAPCET counseling rank.
   - Category B (30% Seats): Filled through Management Quota based on Intermediate marks.
   - Eligibility: +12 / Intermediate (BiPC or MPC).
   - Duration: 4 Years.
   - M.Pharm: Admission through GPAT or TS PGCET rank.
3. Polytechnic (Diploma):
   - Entrance Test: POLYCET.
   - Eligibility: 10th / SSC passed with Mathematics and Science or Intermediate.
   - Duration: 3 Years.`,
      },
      {
        section: 'Required Documents for Admission Process',
        pageNumber: 2,
        content: `Checklist of Required Documents to Submit for Admissions:
1. TS EAPCET / POLYCET / ECET Rank Card.
2. Official Counseling Allotment Order / Counseling Form.
3. SSC / 10th Class Marks Memo (Original and copies).
4. Intermediate (+2) / Polytechnic Diploma Marks Memo and Provisional Certificate.
5. Transfer Certificate (TC) from the last attended school/college.
6. Bonafide / Study Certificates (from 6th class to qualifying exam).
7. Three (3) Recent Passport Size Color Photographs.
8. Completed TRR Institutional Admission Application Form.
9. Caste Certificate, Income Certificate, and Aadhaar Card copy (if applying for government fee reimbursement/scholarship).`,
      },
    ],
  },
  {
    id: 'doc-fees-and-hostel',
    title: 'Fee Structure, Hostel Facilities and Health Care',
    sourceType: 'fee_facility_bulletin',
    sourceReference: 'Official TRR Fee Bulletin & Campus Amenities',
    accessClassification: 'public',
    approvalStatus: 'approved',
    version: '1.0',
    chunks: [
      {
        section: 'Fee Structure',
        pageNumber: 1,
        content: `Fee Structure Details:
- Polytechnic (Diploma): For government counseling students, the tuition fee is approximately Rs. 12,600 per year.
- Management Quota: Fee is determined as per government and university guidelines depending on branch and category.
- Engineering and Pharmacy Tuition Fees: Standard rates governed by the Telangana Admission and Fee Regulatory Committee (TAFRC) and JNTUH norms.
Eligible students may avail Telangana State government e-PASS post-matric fee reimbursement based on income and caste criteria.`,
      },
      {
        section: 'Hostel Facilities, Healthcare and Student Amenities',
        pageNumber: 2,
        content: `Campus Facilities & Student Services:
- Hostel Accommodation: Yes, campus hostel accommodation is available for students with security, study halls, and hygienic dining.
- Healthcare & Safety: TRR provides an on-campus healthcare support team, first aid dispensary, and student medical insurance assistance.
- Extracurriculars & Fests: The college organizes technical symposiums, cultural celebrations, and fests for every major festival, including National Space Day, Teachers Day, Orientation Day, International Yoga Day, Signature & Farewell Day, and Annual Plantation Day drives.
- Training & Placements: TRR College of Technology maintains an active Training and Placement Cell offering aptitude coaching, technical interview preparation, and placement drives with reputed companies.`,
      },
    ],
  },
  {
    id: 'doc-contact-and-location',
    title: 'Contact Information, Location and Directions',
    sourceType: 'contact_directory',
    sourceReference: 'Campus Communications Office',
    accessClassification: 'public',
    approvalStatus: 'approved',
    version: '1.0',
    chunks: [
      {
        section: 'Campus Address and Department Contacts',
        pageNumber: 1,
        content: `TRR Group of Institutions Campus Address & Contact Details:
Address: Pragathi Colony, Meerpet, Balapur Mandal, Hyderabad - 500097, Telangana, India.
Key Contact Phone Numbers:
- Engineering Department: 7396067291
- Polytechnic Department: 9154364291, 9154364299
- Pharmacy Department: 9154364310, 9154364306
- Help & Support Desk: 9154364306
Website: www.trr.org.in
Visitors can reach the campus via Meerpet-Badangpet road, easily accessible by TSRTC city buses from Koti, Dilsukhnagar, and LB Nagar.`,
      },
    ],
  },
];
