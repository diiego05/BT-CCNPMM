import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserApi } from '../util/api';

const UserPlusIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const EyeIcon = ({ show, onClick }) => (
  <button type="button" onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94A3B8' }}>
    {show ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    )}
  </button>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setError('');
    setSuccess('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    setLoading(true);
    const res = await createUserApi(form.name, form.email, form.password);
    setLoading(false);
    if (res && res.EC === 0) {
      setSuccess('Tạo tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setError(res?.EM ?? 'Đăng ký thất bại.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-logo">
            <UserPlusIcon />
          </div>
          <h1 className="auth-title">Tạo tài khoản</h1>
          <p className="auth-subtitle">Điền thông tin bên dưới để đăng ký.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <AlertIcon /><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            <CheckIcon /><span>{success}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">
              Họ tên <span className="required">*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14 }}><UserIcon /></span>
              <input
                id="reg-name"
                className="form-input"
                style={{ paddingLeft: 40 }}
                type="text"
                name="name"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Email <span className="required">*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14 }}><MailIcon /></span>
              <input
                id="reg-email"
                className="form-input"
                style={{ paddingLeft: 40 }}
                type="email"
                name="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Mật khẩu <span className="required">*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="reg-password"
                className="form-input"
                style={{ paddingRight: 44 }}
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <span style={{ position: 'absolute', right: 14 }}>
                <EyeIcon show={showPass} onClick={() => setShowPass(!showPass)} />
              </span>
            </div>
            <span className="form-hint">Mật khẩu phải có ít nhất 6 ký tự.</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', minHeight: 48, fontSize: '0.9375rem', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-link">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;