import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import BakeryShop from './pages/BakeryShop';
import Haven from './pages/Haven';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<Home />} />
        <Route path="/projects" element={<Navigate to="/#work" replace />} />
        <Route path="/contact" element={<Home />} />
        <Route path="/bakery" element={<BakeryShop />} />
        <Route path="/haven" element={<Haven />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
