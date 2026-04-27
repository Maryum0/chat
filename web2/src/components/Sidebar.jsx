import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  Clock, 
  Settings, 
  Trophy,
  PlusCircle,
  LogOut
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'chat', icon: MessageSquare, label: 'Study Chat' },
    { id: 'library', icon: BookOpen, label: 'My Library' },
    { id: 'history', icon: Clock, label: 'Past Sessions' },
    { id: 'progress', icon: Trophy, label: 'Achievements' },
  ];

  return (
    <div className="sidebar glass-card">
      <div className="logo-container">
        <div className="logo-icon gradient-bg">SB</div>
        <h2 className="logo-text font-display">StudyBuddy<span className="gradient-text">AI</span></h2>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item">
          <Settings size={20} />
          <span>Settings</span>
        </button>
        <div className="user-profile">
          <div className="avatar">JD</div>
          <div className="user-info">
            <span className="user-name">John Doe</span>
            <span className="user-status">Pro Student</span>
          </div>
          <LogOut size={16} className="logout-btn" />
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 260px;
          height: calc(100vh - 40px);
          margin: 20px;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          border-radius: 24px;
          flex-shrink: 0;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px 32px;
          border-bottom: 1px solid var(--glass-border);
          margin-bottom: 24px;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-family: var(--font-display);
          font-size: 14px;
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          color: var(--text-dim);
          font-weight: 500;
          width: 100%;
          transition: var(--transition-smooth);
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
          transform: translateX(4px);
        }

        .nav-item.active {
          background: var(--primary-glow);
          color: var(--text-main);
          border-left: 3px solid var(--primary);
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid var(--glass-border);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .user-name {
          font-size: 13px;
          font-weight: 600;
        }

        .user-status {
          font-size: 11px;
          color: var(--secondary);
        }

        .logout-btn {
          color: var(--text-muted);
          cursor: pointer;
        }
        
        .logout-btn:hover {
          color: var(--accent-rose);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
