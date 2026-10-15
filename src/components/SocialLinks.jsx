import useContent from '../hooks/useContent';
import { safeExternalUrl } from '../utils/urls';

export default function SocialLinks({ compact = false }) {
  const { content: socialLinks } = useContent('socialLinks');
  return <div className={`social-links d-flex ${compact ? 'gap-2' : 'gap-3'} align-items-center`}>
    {socialLinks.map((social) => safeExternalUrl(social.url)
      ? <a key={social.id} href={safeExternalUrl(social.url)} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={`${social.name} on ${social.id} (opens in a new tab)`}><i className={`bi ${social.icon}`} aria-hidden="true" /></a>
      : <span key={social.id} className="social-link social-link-muted" title={`${social.id} profile URL is not configured`} role="img" aria-label={`${social.id} profile URL not configured`}><i className={`bi ${social.icon}`} aria-hidden="true" /></span>)}
  </div>;
}
