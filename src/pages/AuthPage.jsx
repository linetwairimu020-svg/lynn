import { Link, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import Login from './Login';
import Register from './Register';

export default function AuthPage() {
  const { pathname } = useLocation();
  const isRegister = pathname === '/register';

  return <div className="portfolio-page auth-page">
    <Navbar links={[{ label: 'Home', href: '/' }]} />
    <main className="container py-6">
      <div className="auth-card mx-auto">
        <nav className="nav nav-pills nav-fill mb-4" aria-label="Account access">
          <Link className={`nav-link ${!isRegister ? 'active' : ''}`} to="/login" aria-current={!isRegister ? 'page' : undefined}>Login</Link>
          <Link className={`nav-link ${isRegister ? 'active' : ''}`} to="/register" aria-current={isRegister ? 'page' : undefined}>Register</Link>
        </nav>
        {isRegister ? <Register embedded /> : <Login embedded />}
      </div>
    </main>
    <Footer />
  </div>;
}
