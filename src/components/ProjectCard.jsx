import { Link } from 'react-router-dom';
import { safeExternalUrl } from '../utils/urls';

export default function ProjectCard({ number, title, status, description, image, to, route, tags = [], technologies, demoUrl, repositoryUrl, comingSoon = false }) {
  const projectRoute = to || route;
  const projectTags = tags.length ? tags : (technologies || []);
  return (
    <article className="project-card card h-100 border-0 shadow-sm overflow-hidden">
      <div className="project-image position-relative">
        <img src={image} alt={`${title} project preview`} className="card-img-top" loading="lazy" />
        <span className={`badge position-absolute top-0 end-0 m-3 ${comingSoon ? 'text-bg-warning' : 'text-bg-dark'}`}>{status}</span>
      </div>
      <div className="card-body p-4 d-flex flex-column">
        <p className="eyebrow mb-2"><span /> {number} / {comingSoon ? 'Exploring' : 'Featured project'}</p>
        <h3 className="h2 serif-title">{title}</h3>
        <p className="text-secondary flex-grow-1">{description}</p>
        <div className="d-flex flex-wrap gap-2 mb-4">{projectTags.map((tag) => <span className="badge rounded-pill text-bg-light" key={tag}>{tag}</span>)}</div>
        <div className="d-flex flex-wrap gap-2">
          {projectRoute && <Link className={`btn ${comingSoon ? 'btn-outline-secondary' : 'btn-primary'} align-self-start`} to={projectRoute}>{comingSoon ? <><i className="bi bi-hourglass-split me-2" />Preview concept</> : <>View project <i className="bi bi-arrow-up-right ms-2" /></>}</Link>}
          {safeExternalUrl(demoUrl) && <a className="btn btn-outline-dark align-self-start" href={safeExternalUrl(demoUrl)} target="_blank" rel="noopener noreferrer">Live demo <i className="bi bi-box-arrow-up-right ms-1" aria-hidden="true" /></a>}
          {safeExternalUrl(repositoryUrl) && <a className="btn btn-outline-dark align-self-start" href={safeExternalUrl(repositoryUrl)} target="_blank" rel="noopener noreferrer">Source code <i className="bi bi-box-arrow-up-right ms-1" aria-hidden="true" /></a>}
        </div>
      </div>
    </article>
  );
}
