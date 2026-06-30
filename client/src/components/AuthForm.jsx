import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Swords } from 'lucide-react';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { login, register, error } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    
    if (!username.trim() || !password) {
      setValidationError('All fields are required.');
      return;
    }

    if (username.trim().length < 3) {
      setValidationError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel auth-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ background: 'var(--glow-light)', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Swords style={{ width: '40px', height: '40px', stroke: 'var(--primary-neon)' }} />
        </div>
        <h2 className="title-gradient" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>Spell Chess</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {isLogin ? 'Log in to challenge your friends' : 'Create an account to track your matches'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => { setIsLogin(true); setValidationError(''); }}
          style={{
            flex: 1, background: 'transparent', border: 'none', padding: '12px',
            color: isLogin ? 'var(--primary-neon)' : 'var(--text-muted)',
            borderBottom: isLogin ? '2px solid var(--primary-neon)' : 'none',
            fontSize: '1rem'
          }}
        >
          Login
        </button>
        <button
          onClick={() => { setIsLogin(false); setValidationError(''); }}
          style={{
            flex: 1, background: 'transparent', border: 'none', padding: '12px',
            color: !isLogin ? 'var(--primary-neon)' : 'var(--text-muted)',
            borderBottom: !isLogin ? '2px solid var(--primary-neon)' : 'none',
            fontSize: '1rem'
          }}
        >
          Register
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Username</label>
          <input
            type="text"
            className="input-field"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </div>

        {validationError && (
          <p style={{ color: 'var(--accent-pink)', fontSize: '0.85rem', textAlign: 'center' }}>
            {validationError}
          </p>
        )}

        {error && (
          <p style={{ color: 'var(--accent-pink)', fontSize: '0.85rem', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
          {submitting ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;
