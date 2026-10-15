import useContent from '../hooks/useContent';

export default function About() {
  const { content: profile } = useContent('profile');
  return <section id="about" className="py-6 bg-blush"><div className="container"><div className="row g-5 align-items-start"><div className="col-lg-5"><p className="eyebrow"><span /> A little about me</p><h2 className="display-5 serif-title">Learning in public,<br /><em>creating with care.</em></h2></div><div className="col-lg-6 ms-auto"><p className="lead">I&apos;m building my path at the intersection of technology and visual storytelling.</p><p className="text-secondary">{profile.about}</p><p className="text-secondary">Right now, I&apos;m growing my skills one thoughtful project at a time, exploring the web from both sides: the logic underneath and the visual details people experience.</p><p className="signature">{profile.name.split(' ')[0]} <span>✳</span></p></div></div></div></section>;
}
