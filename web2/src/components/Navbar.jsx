import { Link, useLocation } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar glass-card">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <BookOpen className="brand-icon" />
          <span className="font-display">StudyBot</span>
        </Link>
        <ul className="nav-links">
          <li><Link to="/" className={isActive('/')}>Home</Link></li>
          <li><Link to="/chat" className={isActive('/chat')}>Chat</Link></li>
          <li><Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link></li>
        </ul>
      </div>
    </nav>
  );
}
