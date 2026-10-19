import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Login from './Login';
import Register from './Register';

export default function AuthPage() {
  const { pathname } = useLocation();
  const isRegister = pathname === '/register';
  const [isDevelopmentMode] = useState(true);

  return <div className={`auth-page ${isRegister ? 'register-page' : 'login-page'}`}>
    <header className="register-header">
      <div className="register-header-inner">
        <Link className="register-logo" to="/" aria-label="Linet Wairimu home">LW</Link>
      </div>
    </header>
    <main className="register-main">
      <section className="auth-card register-card" aria-labelledby={isRegister ? 'register-heading' : 'login-heading'}>
        {isRegister && <p className="register-prototype-badge">Interactive Frontend Prototype</p>}
        {isRegister ? <Register isDevelopmentMode={isDevelopmentMode} /> : <Login embedded isDevelopmentMode={isDevelopmentMode} />}
      </section>
    </main>
  </div>;
}
