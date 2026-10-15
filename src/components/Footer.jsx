import { Link } from 'react-router-dom';
import AdminLink from './AdminLink';
import SocialLinks from './SocialLinks';
import useContent from '../hooks/useContent';

export default function Footer() {
  const { content: profile } = useContent('profile');
  const year = new Date().getFullYear();
  const phone = profile.phone || '';
  return <footer className="py-5 bg-ink text-white"><div className="container"><div className="row g-4"><div className="col-lg-4"><h2 className="h4 text-white">{profile.name}</h2><p className="small text-white-50">Developer and designer creating thoughtful, useful digital experiences.</p><SocialLinks /></div><div className="col-6 col-lg-2"><h3 className="h6">Explore</h3><div className="footer-links"><a href="/#about">About</a><a href="/#skills">Skills</a><a href="/#services">Services</a><a href="/#work">Projects</a></div></div><div className="col-6 col-lg-2"><h3 className="h6">Projects</h3><div className="footer-links"><Link to="/bakery">Bakery Shop</Link><Link to="/haven">Haven</Link><Link to="/hardware">APEX Hardware Demo</Link></div></div><div className="col-lg-4"><h3 className="h6">Account</h3><div className="footer-links"><Link to="/login">Login</Link><Link to="/register">Register</Link><AdminLink />{profile.email && <a href={`mailto:${profile.email}`}>{profile.email}</a>}{phone && <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>}</div></div></div><hr className="border-white border-opacity-25 my-4" /><p className="mb-0 small text-white-50">© {year} {profile.name}. All Rights Reserved.</p></div></footer>;
}
