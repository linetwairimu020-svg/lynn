import socialLinks from '../data/socialLinks';

export default function SocialDirectory() {
  return <div className="social-directory d-flex flex-wrap gap-3">{Object.entries(socialLinks).map(([key, social]) => <div className="social-directory-item" key={key}><i className={`bi ${social.icon}`} /><span><small>{key}</small>{social.name}</span></div>)}</div>;
}
