const services = [
  ['bi-window-stack', 'Website Development', 'Clear, responsive websites designed around your audience and goals.'],
  ['bi-braces', 'React Development', 'Reusable interfaces and practical frontends built with modern React.'],
  ['bi-phone', 'Responsive Web Design', 'Layouts that remain useful and polished across phones, tablets, and desktops.'],
  ['bi-bag-check', 'E-commerce Development', 'Storefront experiences with product browsing, cart flows, and helpful details.'],
  ['bi-bezier2', 'UI Design', 'Thoughtful visual systems that make digital products feel easier to use.'],
  ['bi-paint-bucket', 'Graphic Design', 'Brand and visual design support for ideas that need a distinct voice.'],
];

export default function Services() {
  return <section id="services" className="py-6 bg-blush"><div className="container"><div className="row mb-5"><div className="col-lg-7"><p className="eyebrow"><span /> How I can help</p><h2 className="display-5 serif-title">Useful work, <em>well made.</em></h2></div></div><div className="row g-3">{services.map(([icon, title, description]) => <div className="col-md-6 col-lg-4" key={title}><article className="service-card h-100"><i className={`bi ${icon} service-icon`} /><h3 className="h5 mt-4">{title}</h3><p className="text-secondary small">{description}</p><a className="btn btn-sm btn-outline-dark mt-2" href="#contact">Learn more <i className="bi bi-arrow-up-right ms-1" /></a></article></div>)}</div></div></section>;
}
