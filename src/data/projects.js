const projects = [
  {
    id: 'bakery-shop', number: '01', title: 'Bakery Shop', status: 'Coming Soon', comingSoon: true,
    description: 'A warm, modern bakery e-commerce concept for fresh bread, cakes, pastries, cookies, and everyday celebrations.',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85',
    technologies: ['React', 'Bootstrap', 'E-commerce'], route: '/bakery',
  },
  {
    id: 'apex-hardware', number: '02', title: 'APEX Hardware', status: 'Live concept',
    description: 'A professional Kenyan hardware storefront with searchable products, category browsing, product details, and a persistent cart.',
    image: 'https://images.unsplash.com/photo-1581147036324-c17ac41d7b4a?auto=format&fit=crop&w=900&q=85',
    technologies: ['React', 'Router', 'Shopping cart'], route: '/hardware',
  },
];

export default projects;
