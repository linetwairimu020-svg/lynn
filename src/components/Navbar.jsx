import { Link } from 'react-router-dom';

export default function Navbar({ brand = 'LW', links = [], dark = false, cartCount, onCart, logoSrc }) {
  const activeLogoSrc = logoSrc || (brand === 'APEX HARDWARE' ? '/logo.png' : null);

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
              <a className="nav-link" href={link.href} key={link.label}>{link.label}</a>
            ))}
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
