import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const defaultItems = [
  { label: 'Home', to: '/', icon: 'bi-house-door' },
  { label: 'About', href: '/#about', icon: 'bi-person-circle' },
  { label: 'Skills', href: '/#skills', icon: 'bi-tools' },
  { label: 'Services', href: '/#services', icon: 'bi-briefcase' },
  { label: 'Projects', href: '/#work', icon: 'bi-briefcase-fill' },
  { label: 'Contact', href: '/#contact', icon: 'bi-telephone' },
];

function NavigationLink({ item, onClick }) {
  const content = <>
    <span className="mobile-nav-icon"><i className={`bi ${item.icon}`} aria-hidden="true" /></span>
    <span className="mobile-nav-label">{item.label}</span>
  </>;

  return item.to
    ? <Link className="mobile-nav-grid-item" to={item.to} onClick={onClick}>{content}</Link>
    : <a className="mobile-nav-grid-item" href={item.href} onClick={onClick}>{content}</a>;
}

export default function MobileNavigationDrawer({ items = defaultItems, className = '', showLogin = false }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return <>
    <div className={`mobile-nav-component ${className}`.trim()}>
      <button
        className="mobile-nav-trigger"
        type="button"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
        onClick={() => setIsOpen((open) => !open)}
      >
        <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'}`} aria-hidden="true" />
      </button>
      {isOpen && <div className="mobile-nav-overlay">
        <button className="mobile-nav-backdrop" type="button" aria-label="Close navigation menu" onClick={close} />
        <nav className="mobile-nav-drawer" id="mobile-navigation-drawer" aria-label="Mobile navigation">
          <p className="mobile-nav-demo-badge"><i className="bi bi-stars" aria-hidden="true" /> Interactive Frontend Prototype</p>
          <div className="mobile-nav-grid">
            {items.map((item) => <NavigationLink key={item.label} item={item} onClick={close} />)}
          </div>
          <div className="mobile-nav-actions">
            {showLogin && <Link className="mobile-nav-login" to="/login" onClick={close}>Log in</Link>}
            <Link className="mobile-nav-signup" to="/register" onClick={close}>Sign up <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
          </div>
        </nav>
      </div>}
    </div>
  </>;
}
