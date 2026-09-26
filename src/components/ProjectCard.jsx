import { Link } from 'react-router-dom';

export default function ProjectCard({ number, title, status, description, image, to, tags = [], comingSoon = false }) {
  return (
    <article className="project-card card h-100 border-0 shadow-sm overflow-hidden">
      <div className="project-image position-relative">
        <img src={image} alt="" className="card-img-top" />
        <span className={`badge position-absolute top-0 end-0 m-3 ${comingSoon ? 'text-bg-warning' : 'text-bg-dark'}`}>{status}</span>
      </div>
      <div className="card-body p-4 d-flex flex-column">
        <p className="eyebrow mb-2"><span /> {number} / {comingSoon ? 'Exploring' : 'Featured project'}</p>
        <h3 className="h2 serif-title">{title}</h3>
        <p className="text-secondary flex-grow-1">{description}</p>
        <div className="d-flex flex-wrap gap-2 mb-4">{tags.map((tag) => <span className="badge rounded-pill text-bg-light" key={tag}>{tag}</span>)}</div>
        {comingSoon ? <Link className="btn btn-outline-secondary align-self-start" to={to}><i className="bi bi-hourglass-split me-2" />Coming Soon</Link> : <Link className="btn btn-primary align-self-start" to={to}>View Project <i className="bi bi-arrow-up-right ms-2" /></Link>}
      </div>
    </article>
  );
}
