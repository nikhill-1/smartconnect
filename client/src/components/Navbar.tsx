import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { studentAuthStorage } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);
  const student = studentAuthStorage.getStudent();

  return (
    <div className="jkl">
      <nav>
        <button
          className="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        <ul id="jss" className={mobileMenuOpen ? 'nav-mobile-open' : ''}>
          <li className={path === '/' ? 'active-nav' : ''}>
            <Link to="/" onClick={closeMenu}>Home</Link>
          </li>
          <li className={path === '/aboutus' ? 'active-nav' : ''}>
            <Link to="/aboutus" onClick={closeMenu}>About Us</Link>
          </li>
          <li className={path === '/departments' ? 'active-nav' : ''}>
            <Link to="/departments" onClick={closeMenu}>Departments</Link>
          </li>
          <li className={path === '/academics' ? 'active-nav' : ''}>
            <Link to="/academics" onClick={closeMenu}>Academics</Link>
          </li>
          <li className={path === '/facilities' ? 'active-nav' : ''}>
            <Link to="/facilities" onClick={closeMenu}>Facilities</Link>
          </li>
          <li className={path === '/admissions' ? 'active-nav' : ''}>
            <Link to="/admissions" onClick={closeMenu}>Admissions</Link>
          </li>
          <li className={path === '/placements' ? 'active-nav' : ''}>
            <Link to="/placements" onClick={closeMenu}>Placements</Link>
          </li>
          <li className={path === '/notices' ? 'active-nav' : ''}>
            <Link to="/notices" onClick={closeMenu}>Notices</Link>
          </li>
          <li className={path === '/contact' || path === '/ContactUs.html' ? 'active-nav' : ''}>
            <Link to="/contact" onClick={closeMenu}>Contact</Link>
          </li>
          <li className={path.startsWith('/student') ? 'active-nav' : ''} style={{ backgroundColor: student ? '#059669' : '#0284c7' }}>
            <Link to={student ? '/student/dashboard' : '/student/login'} onClick={closeMenu} style={{ color: 'white' }}>
              {student ? `Student: ${student.pin}` : 'Student Portal'}
            </Link>
          </li>
          <li className="admin-nav-item">
            <Link to="/admin" onClick={closeMenu}>Admin Portal</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};
