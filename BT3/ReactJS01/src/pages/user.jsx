import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserApi } from '../util/api';

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const UserPage = () => {
  const [users, setUsers]   = useState([]);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const res = await getUserApi();
      setLoading(false);
      if (Array.isArray(res)) {
        setUsers(res);
      } else {
        setError(res?.message ?? 'Không thể tải danh sách người dùng.');
        if (res?.message?.includes('Token')) {
          setTimeout(() => navigate('/login'), 2000);
        }
      }
    };
    fetchUsers();
  }, [navigate]);

  const getInitial = (email) => email?.charAt(0).toUpperCase() ?? '?';

  const roleColor = (role) => {
    if (role?.toLowerCase() === 'admin') return 'badge-red';
    return 'badge-blue';
  };

  return (
    <div className="page-body">
      <div className="container">
        <div className="section">
          <div className="section-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 className="section-title">Danh sách người dùng</h1>
              <p className="section-subtitle">
                {loading ? 'Đang tải...' : `Tổng cộng ${users.length} tài khoản`}
              </p>
            </div>
            {!loading && (
              <span className="badge badge-blue" style={{ padding: '6px 14px', fontSize: '0.875rem' }}>
                <UsersIcon />
                {users.length} users
              </span>
            )}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 24 }}>
              <AlertIcon /><span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="ute-table-wrapper">
              <table className="ute-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '48px 20px' }}>
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    users.map((user, idx) => (
                      <tr key={user.id}>
                        <td style={{ color: 'var(--color-muted)', fontSize: '0.875rem', width: 48 }}>
                          {idx + 1}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="avatar">{getInitial(user.email)}</div>
                            <span style={{ fontWeight: 500 }}>{user.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-muted)' }}>{user.email}</td>
                        <td>
                          <span className={`badge ${roleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPage;