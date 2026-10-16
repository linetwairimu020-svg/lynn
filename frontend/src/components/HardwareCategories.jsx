import categories from '../data/categories';

export default function HardwareCategories({ active, onSelect }) {
  return <section id="categories" className="py-5 bg-light"><div className="container"><div className="d-flex justify-content-between align-items-end mb-4"><div><p className="eyebrow mb-2"><span /> Shop by trade</p><h2 className="h1 mb-0">Find your next fix.</h2></div><span className="text-secondary small d-none d-md-block">16 specialist categories</span></div><div className="row g-2">{categories.map((category) => <div className="col-6 col-sm-4 col-lg-3 col-xl-2" key={category.name}><button className={`category-tile w-100 ${active === category.name ? 'active' : ''}`} onClick={() => onSelect(category.name)}><span className="category-icon"><i className={`bi ${category.icon}`} /></span><span>{category.name}</span></button></div>)}</div></div></section>;
}
