import ProjectCard from './ProjectCard';
import useContent from '../hooks/useContent';

export default function Projects() {
  const { content: projects, error } = useContent('projects');
  const publishedProjects = projects.filter((project) => project.published !== false);
  return <section id="work" className="py-6 project-section"><div className="container"><div className="row align-items-end g-4 mb-5"><div className="col-lg-7"><p className="eyebrow eyebrow-light"><span /> Selected work</p><h2 className="display-4 serif-title">Projects & <em>experiments.</em></h2></div><div className="col-lg-4 ms-auto"><p className="text-white-50 mb-0">A mix of working frontend demos and concepts currently taking shape.</p></div></div>{error && <p className="alert alert-warning" role="status">The content API is unavailable. Showing the bundled project defaults.</p>}{publishedProjects.length ? <div className="row g-4">{publishedProjects.map((project) => <div className="col-md-6 col-xl-4" key={project.id}><ProjectCard {...project} tags={project.technologies} to={project.route} /></div>)}</div> : <p className="text-white-50">There are no published projects yet.</p>}</div></section>;
}
