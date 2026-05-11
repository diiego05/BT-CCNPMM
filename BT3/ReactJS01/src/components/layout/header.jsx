import { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';

/* ── SVG Icons (Lucide-style, inline) ── */
const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const LogOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const LoginIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
  </svg>
);

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, setAuth } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setAuth({ isAuthenticated: false, user: { email: '', name: '' } });
    setDropdownOpen(false);
    navigate('/');
  };

  const getInitial = (email) => email ? email.charAt(0).toUpperCase() : '?';

  return (
    <nav className="ute-navbar">
      {/* Brand */}
      <Link to="/" className="ute-navbar__brand">
        <div className="ute-navbar__brand-icon">
          <ShieldIcon />
        </div>
        JWT Auth
      </Link>

      {/* Nav Links */}
      <ul className="ute-navbar__links">
        <li>
          <Link to="/" className={`ute-navbar__link ${isActive('/') ? 'active' : ''}`}>
            <HomeIcon />
            Trang chủ
          </Link>
        </li>
        {auth.isAuthenticated && (
          <li>
            <Link to="/user" className={`ute-navbar__link ${isActive('/user') ? 'active' : ''}`}>
              <UsersIcon />
              Users
            </Link>
          </li>
        )}
      </ul>

      {/* Actions */}
      <div className="ute-navbar__actions">
        {auth.isAuthenticated ? (
          <div className="dropdown" ref={dropdownRef}>
            <button
              className="btn btn-ghost"
              style={{ gap: 8, paddingInline: 12 }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="avatar">{getInitial(auth.user.email)}</div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>
                {auth.user.email}
              </span>
              <ChevronDownIcon />
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-user">
                  <div className="dropdown-user-email">{auth.user.email}</div>
                  <div className="dropdown-user-role">{auth.user.name || 'User'}</div>
                </div>
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <LogOutIcon />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
              Đăng nhập
            </Link>
            <Link to="/register" className="btn btn-primary">
              <LoginIcon />
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header;