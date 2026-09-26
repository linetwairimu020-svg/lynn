import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Haven() {
  return (
    <div className="haven-page">
      <Navbar brand="Haven" links={[{ label: 'Home', href: '/' }, { label: 'Projects', href: '/#work' }]} />

      <main className="container py-6 text-center">
        <p className="eyebrow justify-content-center"><span /> In progress</p>
        <h1 className="display-4 serif-title">Haven</h1>
        <p className="lead text-secondary mx-auto mt-3 mb-4" style={{ maxWidth: '42rem' }}>
          This project is intentionally left blank for now while it is still being developed.
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-3">
          <Link className="btn btn-primary" to="/">Back to portfolio</Link>
          <Link className="btn btn-outline-dark" to="/#work">Browse projects</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
