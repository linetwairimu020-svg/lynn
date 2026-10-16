import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AdminLink from './AdminLink';

export default function Navbar({ brand = 'LW', links = [], dark = false, cartCount, onCart, logoSrc }) {
  const activeLogoSrc = logoSrc || (brand === 'APEX HARDWARE' ? '/logo.png' : null);
  const { pathname, search } = useLocation();
  const [activeHref, setActiveHref] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    const targets = links.filter((link) => typeof link.href === 'string').map((link) => {
      const hashIndex = link.href.indexOf('#');
      return hashIndex < 0 ? null : { href: link.href, id: link.href.slice(hashIndex + 1) };
    }).filter((target) => target?.id)
      .map((target) => ({ ...target, element: document.getElementById(target.id) }))
      .filter((target) => target.element);

    if (!targets.length || !('IntersectionObserver' in window)) {
      const active = links.find((link) => link.href === pathname || link.to === `${pathname}${search}`);
      setActiveHref(active?.to || active?.href || '');
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
      if (visible) setActiveHref(targets.find((target) => target.element === visible.target)?.href || '');
    }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
    targets.forEach(({ element }) => observer.observe(element));
    return () => observer.disconnect();
  }, [links, pathname, search]);

  return (
    <nav className={`navbar navbar-expand-lg ${dark ? 'navbar-dark' : 'navbar-light'} py-3`}>
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/">
          {activeLogoSrc ? <img className="brand-image" src={activeLogoSrc} alt={`${brand} logo`} onError={(event) => { event.currentTarget.src = '/assets/favicon.svg'; }} /> : <span className="brand-mark">{brand === 'LW' ? 'LW' : <i className="bi bi-tools" />}</span>}
          <span>{brand === 'LW' ? 'Linet Wairimu' : brand}</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <div className="navbar-nav ms-auto align-items-lg-center gap-lg-3">
            {links.map((link) => (
              link.to
                ? <Link className={`nav-link ${activeHref === link.to ? 'active' : ''}`} to={link.to} key={link.label} aria-current={activeHref === link.to ? 'page' : undefined}>{link.label}</Link>
                : <a className={`nav-link ${activeHref === link.href ? 'active' : ''}`} href={link.href} key={link.label} aria-current={activeHref === link.href ? 'location' : undefined}>{link.label}</a>
            ))}
            {brand === 'LW' && (
              <div className="profile-menu" ref={profileMenuRef}>
                <button
                  className={`profile-menu-trigger ${profileMenuOpen ? 'active' : ''}`}
                  type="button"
                  aria-label="Open profile menu"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((open) => !open)}
                >
                  <i className="bi bi-person-circle" aria-hidden="true" />
                </button>
                {profileMenuOpen && (
                  <div className="profile-menu-items" role="menu" aria-label="Profile navigation">
                    <Link className={`profile-menu-item ${pathname === '/login' ? 'active' : ''}`} to="/login" role="menuitem" aria-current={pathname === '/login' ? 'page' : undefined} onClick={() => setProfileMenuOpen(false)}>Login</Link>
                    <Link className={`profile-menu-item ${pathname === '/register' ? 'active' : ''}`} to="/register" role="menuitem" aria-current={pathname === '/register' ? 'page' : undefined} onClick={() => setProfileMenuOpen(false)}>Register</Link>
                    <AdminLink className="profile-menu-item" role="menuitem" onClick={() => setProfileMenuOpen(false)} />
                  </div>
                )}
              </div>
            )}
            {cartCount !== undefined && (
              <button className="btn btn-light position-relative ms-lg-2" type="button" onClick={onCart} aria-label={`Open cart with ${cartCount} items`}>
                <i className="bi bi-cart3" />
                {cartCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{cartCount}</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
