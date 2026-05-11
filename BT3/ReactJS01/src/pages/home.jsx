import { Link } from 'react-router-dom';

const LockIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="m21 2-9.6 9.6"/>
    <path d="m15.5 7.5 3 3L22 7l-3-3"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const features = [
  {
    icon: <ShieldCheckIcon />,
    title: 'JWT Authentication',
    desc: 'Xác thực stateless, bảo mật với access token có thời hạn.',
  },
  {
    icon: <KeyIcon />,
    title: 'Bcrypt Password',
    desc: 'Mật khẩu được mã hóa bằng bcrypt, không lưu plaintext.',
  },
  {
    icon: <UsersIcon />,
    title: 'User Management',
    desc: 'Đăng ký, đăng nhập, xem danh sách người dùng qua REST API.',
  },
];

const HomePage = () => {
  return (
    <div className="page-body">
      <div className="container">
        {/* Hero */}
        <section className="hero">
          <div className="hero-eyebrow">
            <ShieldCheckIcon />
            Node.js · React · JWT
          </div>

          <h1 className="hero-title">
            Xác thực người dùng<br />
            với <span>JSON Web Token</span>
          </h1>

          <p className="hero-desc">
            Hệ thống xác thực toàn diện sử dụng JWT, bcrypt và Express.js.
            Demo luồng đăng ký, đăng nhập và bảo vệ route.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary" style={{ paddingInline: 28, minHeight: 48 }}>
              Bắt đầu ngay
              <ArrowRightIcon />
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ paddingInline: 28, minHeight: 48 }}>
              Đăng nhập
            </Link>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="section">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {features.map((f) => (
              <div className="card" key={f.title}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(45, 50, 143, 0.08)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', marginBottom: 8 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack Row */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="stats-grid">
            {[
              { number: 'REST', label: 'API Architecture' },
              { number: 'JWT', label: 'Auth Standard' },
              { number: 'bcrypt', label: 'Password Hashing' },
              { number: 'MySQL', label: 'Database' },
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-number">{s.number}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;