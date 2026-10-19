import SocialLinks from './SocialLinks';
import useContent from '../hooks/useContent';
import portraitImage from '../../assets/Intense Braided Bun Studio Portrait.png';

export default function Hero() {
  const { content: profile } = useContent('profile');
  return (
    <section className="portfolio-hero py-5 py-lg-6">
      <div className="container py-5">
        <div className="row align-items-center g-5">
          <div className="col-lg-7">
            <p className="eyebrow"><span /> {profile.headline}</p>
            <h1 className="display-1 fw-semibold mb-4">Ideas, made <em>useful.</em></h1>
            <p className="lead text-secondary mb-4 mw-copy">{profile.summary}</p>
            <div className="d-flex flex-wrap gap-3 mb-4">
              <a className="btn btn-primary btn-lg px-4" href="#work">View my work <i className="bi bi-arrow-down ms-2" /></a>
              <a className="btn btn-outline-dark btn-lg px-4" href="#contact">Let&apos;s talk <i className="bi bi-arrow-up-right ms-2" /></a>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-4 small text-secondary"><span>Based in {profile.location}</span><span>•</span><span>Open to learning</span><SocialLinks compact /></div>
          </div>
          <div className="col-lg-5">
            <div className="hero-art shadow-lg" role="img" aria-label="Portrait of Linet Wairimu">
              <img className="hero-portrait" src={portraitImage} alt="" />
              <div className="art-ring ring-one" /><div className="art-ring ring-two" />
              <span className="art-note note-top">curious<br /><strong>by nature</strong></span>
              <span className="art-note note-bottom">design + code<br /><strong>in balance</strong></span>
              <span className="art-star">✳</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
