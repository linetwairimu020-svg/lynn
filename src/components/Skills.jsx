import useContent from '../hooks/useContent';

export default function Skills() {
  const { content: skillGroups } = useContent('skills');
  return <section id="skills" className="py-6"><div className="container"><div className="row mb-5"><div className="col-lg-7"><p className="eyebrow"><span /> The toolkit</p><h2 className="display-5 serif-title">Things I&apos;m <em>growing.</em></h2></div><div className="col-lg-5"><p className="text-secondary">A practical, ever-evolving mix of code, design, and the tools that help ideas take shape. Skills are listed without unsupported proficiency ratings.</p></div></div><div className="row g-4">{skillGroups.filter((group) => group.published !== false).map(({ id, name, icon, skills }) => <div className="col-md-4" key={id}><div className="skill-card h-100"><i className={`bi ${icon} skill-icon`} aria-hidden="true" /><h3 className="h4 mt-4">{name}</h3><div className="d-flex flex-wrap gap-2">{skills.map((skill) => <span className="badge rounded-pill text-bg-light" key={skill}>{skill}</span>)}</div></div></div>)}</div></div></section>;
}
