import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="jkl">
      <nav>
        <ul id="jss">
          <li className={path === '/' ? 'active-nav' : ''}>
            <Link to="/">Home</Link>
          </li>
          <li className={path === '/aboutus' ? 'active-nav' : ''}>
            <Link to="/aboutus">About Us</Link>
          </li>
          <li className={path === '/departments' ? 'active-nav' : ''}>
            <Link to="/departments">Departments</Link>
          </li>
          <li className={path === '/academics' ? 'active-nav' : ''}>
            <Link to="/academics">Academics</Link>
          </li>
          <li className={path === '/facilities' ? 'active-nav' : ''}>
            <Link to="/facilities">Facilities</Link>
          </li>
          <li className={path === '/admissions' || path === '/placements' ? 'active-nav' : ''}>
            <Link to="/admissions">Admissions</Link>
          </li>
          <li className={path === '/contact' || path === '/ContactUs.html' ? 'active-nav' : ''}>
            <Link to="/contact">Contact Us</Link>
          </li>
          <li className="admin-nav-item">
            <Link to="/admin">admin login</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};
