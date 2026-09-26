import socialLinks from '../data/socialLinks';

export default function SocialLinks({ compact = false }) {
  return <div className={`social-links d-flex ${compact ? 'gap-2' : 'gap-3'} align-items-center`}>
    {Object.entries(socialLinks).map(([key, social]) => social.url ? <a key={key} href={social.url} target="_blank" rel="noreferrer" className="social-link" aria-label={`${social.name} on ${key}`}><i className={`bi ${social.icon}`} /></a> : <span key={key} className="social-link social-link-muted" title={`${social.name} profile URL to be added`}><i className={`bi ${social.icon}`} /></span>)}
  </div>;
}
