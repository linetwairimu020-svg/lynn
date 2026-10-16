import useContent from '../hooks/useContent';
import { safeExternalUrl } from '../utils/urls';

export default function SocialDirectory() {
  const { content: socialLinks } = useContent('socialLinks');
  return <div className="social-directory d-flex flex-wrap gap-3">{socialLinks.filter((social) => social.enabled !== false).map((social) => <div className="social-directory-item" key={social.id}><i className={`bi ${social.icon}`} aria-hidden="true" /><span><small>{social.platform || social.id}</small>{social.name}{safeExternalUrl(social.url) ? <a href={safeExternalUrl(social.url)} target="_blank" rel="noopener noreferrer">Open profile</a> : <small className="social-unconfigured">Profile URL not configured</small>}</span></div>)}</div>;
}
