import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
  return <div className="portfolio-page"><Navbar links={[{ label: 'Home', href: '/' }, { label: 'Projects', href: '/#work' }]} /><main className="container py-6 text-center"><p className="eyebrow justify-content-center"><span /> 404</p><h1 className="display-3">This page took a wrong turn.</h1><p className="lead text-secondary mx-auto mw-copy my-4">The page you&apos;re looking for does not exist, but there are a couple of useful places to go next.</p><div className="d-flex flex-wrap justify-content-center gap-3"><Link className="btn btn-primary" to="/">Back to portfolio</Link><Link className="btn btn-outline-dark" to="/#work">View projects</Link></div></main><Footer /></div>;
}
