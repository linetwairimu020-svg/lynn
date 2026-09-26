import ProjectCard from './ProjectCard';
import projects from '../data/projects';

export default function Projects() {
  return <section id="work" className="py-6 project-section"><div className="container"><div className="row align-items-end g-4 mb-5"><div className="col-lg-7"><p className="eyebrow eyebrow-light"><span /> The next chapter</p><h2 className="display-4 serif-title">Projects in <em>progress.</em></h2></div><div className="col-lg-4 ms-auto"><p className="text-white-50 mb-0">Two storefront concepts, built to make ideas tangible and useful.</p></div></div><div className="row g-4">{projects.map((project) => <div className="col-lg-6" key={project.id}><ProjectCard number={project.number} title={project.title} status={project.status} description={project.description} image={project.image} tags={project.technologies} to={project.route} comingSoon={project.comingSoon} /></div>)}</div></div></section>;
}
