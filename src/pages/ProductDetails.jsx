import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import products from '../data/products';

const money = (value) => `KSh ${value.toLocaleString('en-KE')}`;

export default function ProductDetails() {
  const { id } = useParams();
  const product = products.find((item) => item.id === id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  if (!product) return <NotFoundProduct />;
  const addToCart = () => {
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('apex-cart') || '[]'); } catch { cart = []; }
    const existing = cart.find((item) => item.id === product.id);
    const nextCart = existing
      ? cart.map((item) => item.id === product.id ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) } : item)
      : [...cart, { ...product, quantity }];
    localStorage.setItem('apex-cart', JSON.stringify(nextCart));
    setAdded(true);
  };
  return <div className="hardware-page"><Navbar dark brand="APEX HARDWARE" links={[{ label: 'Shop', href: '/hardware#products' }, { label: 'Categories', href: '/hardware#categories' }, { label: 'About', href: '/hardware#about' }]} /><main><section className="py-6"><div className="container"><Link to="/hardware" className="btn btn-link px-0 mb-4"><i className="bi bi-arrow-left me-2" />Back to shop</Link><div className="row g-5 align-items-start"><div className="col-lg-6"><div className="details-image rounded-4 overflow-hidden"><img src={product.image} alt={product.name} /></div></div><div className="col-lg-5"><span className="badge text-bg-light mb-3">{product.category}</span><h1 className="display-5">{product.name}</h1><div className="text-warning mb-3">{'★'.repeat(Math.round(product.rating))} <span className="text-secondary">{product.rating} / 5</span></div><div className="d-flex align-items-center gap-3 mb-3"><strong className="display-6 product-price">{money(product.price)}</strong>{product.oldPrice && <del className="text-secondary">{money(product.oldPrice)}</del>}</div><p className="lead text-secondary">{product.description}</p><p className={product.stock > 0 ? 'text-success' : 'text-danger'}><i className="bi bi-check-circle me-2" />{product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</p><h2 className="h5 mt-4">Product features</h2><ul className="list-group list-group-flush mb-4">{product.features.map((feature) => <li className="list-group-item px-0 bg-transparent" key={feature}><i className="bi bi-check2 text-success me-2" />{feature}</li>)}</ul><div className="d-flex gap-2"><div className="input-group quantity-control"><button className="btn btn-outline-secondary" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button><span className="input-group-text">{quantity}</span><button className="btn btn-outline-secondary" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}>+</button></div><button className="btn btn-dark flex-grow-1" onClick={addToCart} disabled={!product.stock}><i className="bi bi-cart-plus me-2" />Add to cart</button></div>{added && <div className="alert alert-success mt-3">{quantity} item{quantity > 1 ? 's' : ''} added to your cart.</div>}</div></div></div></section><section className="py-5 bg-light"><div className="container"><h2 className="h3 mb-4">You may also need</h2><div className="row g-3">{products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4).map((item) => <div className="col-sm-6 col-lg-3" key={item.id}><Link to={`/hardware/product/${item.id}`} className="card related-card h-100 border-0 shadow-sm"><img src={item.image} className="card-img-top" alt={item.name} /><div className="card-body"><h3 className="h6">{item.name}</h3><strong>{money(item.price)}</strong></div></Link></div>)}</div></div></section></main><Footer /></div>;
}
+
+function NotFoundProduct() { return <div className="hardware-page"><Navbar dark brand="APEX HARDWARE" /><main className="container py-6"><h1>Product not found</h1><p className="text-secondary">That product is no longer in the catalogue.</p><Link className="btn btn-dark" to="/hardware">Return to shop</Link></main><Footer /></div>; }
