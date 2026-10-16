const projects = [
  {
    id: 'bakery-shop', number: '01', title: 'Bakery Shop', status: 'Coming Soon', comingSoon: true,
    description: 'A warm, modern bakery e-commerce concept for fresh bread, cakes, pastries, cookies, and everyday celebrations.',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85',
    technologies: ['React', 'Bootstrap', 'E-commerce'], route: '/bakery', published: true,
  },
  {
    id: 'haven', number: '02', title: 'Haven', status: 'Coming soon', comingSoon: true,
    description: 'A quiet, elevated lifestyle concept for thoughtful living, warm interiors, and intentional home essentials.',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85',
    technologies: ['Brand storytelling', 'UX design', 'Lifestyle'], route: '/haven', published: true,
  },
  {
    id: 'apex-hardware', number: '03', title: 'APEX Hardware', status: 'Storefront demo', comingSoon: false,
    description: 'A Kenyan-focused hardware storefront prototype with product discovery, stock-aware cart controls, and a demo checkout flow.',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=85',
    technologies: ['React', 'Product filtering', 'Cart UI'], route: '/hardware', published: true,
  },
];

export default projects;
