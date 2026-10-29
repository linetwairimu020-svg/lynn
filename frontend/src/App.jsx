import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import AdminRoute from './routes/AdminRoute';
import AccountRoute from './routes/AccountRoute';
import useContent from './hooks/useContent';

const Home = lazy(() => import('./pages/Home'));
const BakeryShop = lazy(() => import('./pages/BakeryShop'));
const Haven = lazy(() => import('./pages/Haven'));
const NotFound = lazy(() => import('./pages/NotFound'));
const HardwareShop = lazy(() => import('./pages/HardwareShop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AccountDashboard = lazy(() => import('./pages/AccountDashboard'));
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));

function PageLoading() {
  return (
    <div className="d-flex min-vh-100 align-items-center justify-content-center" role="status">
      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      <span>Loading...</span>
    </div>
  );
}

function PageMetadata() {
  const { pathname, search } = useLocation();
  const { content: settings } = useContent('settings');

  useEffect(() => {
    const view = new URLSearchParams(search).get('view');
    const pages = {
      '/': [settings.siteTitle, 'Linet Wairimu is a developer and designer creating thoughtful digital experiences.'],
      '/login': ['Sign in | Linet Wairimu', 'Sign in to your Lynn portfolio account.'],
      '/forgot-password': ['Reset password | Linet Wairimu', 'Request an email link to reset your password.'],
      '/reset-password': ['Choose a new password | Linet Wairimu', 'Set a new password for your account.'],
      '/register': ['Create an account | Linet Wairimu', 'Create a Lynn portfolio account.'],
      '/account': ['My account | Linet Wairimu', 'Your account profile and workspace preferences.'],
      '/about': [settings.siteTitle, 'Learn about Linet Wairimu, an emerging developer and designer.'],
      '/contact': [settings.siteTitle, 'Contact Linet Wairimu about a project or collaboration.'],
      '/bakery': ['Hearth & Crumb | Coming Soon', 'A preview of Hearth & Crumb, a small-batch bakery concept coming soon to Nairobi.'],
      '/haven': ['Haven | Project Preview', 'A lifestyle concept currently in development by Linet Wairimu.'],
      '/hardware': ['APEX Hardware | Storefront Demo', 'Explore the APEX Hardware sample storefront. This frontend demo does not process orders or payments.'],
    };
    const [title, description] = view === 'admin'
          ? ['Admin dashboard | Linet Wairimu', 'Administrator dashboard for the Lynn portfolio.']
          : pages[pathname] || (pathname.startsWith('/hardware/product/')
      ? ['Product details | APEX Hardware Demo', 'Product details in the APEX Hardware frontend storefront demonstration.']
      : ['Page Not Found | Linet Wairimu', 'The requested page could not be found.']);
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [pathname, search, settings.siteTitle]);

  return null;
}

function SharedEntry() {
  const { search } = useLocation();
  const view = new URLSearchParams(search).get('view');
  if (view === 'login') return <LegacyViewRedirect view="login" />;
  if (view === 'register') return <LegacyViewRedirect view="register" />;
  if (view === 'admin') return <AdminRoute><AdminDashboard /></AdminRoute>;
  return <Home />;
}

function LegacyViewRedirect({ view }) {
  const location = useLocation();
  const search = new URLSearchParams();
  const next = new URLSearchParams(location.search).get('next');
  if (next) search.set('next', next);
  const query = search.toString();
  return <Navigate to={`/${view}${query ? `?${query}` : ''}`} replace />;
}

function LegacyAdminRedirect() {
  const { pathname } = useLocation();
  const section = pathname.replace(/^\/admin\/?/, '') || 'overview';
  return <Navigate to={`/?view=admin&section=${encodeURIComponent(section)}`} replace />;
}

function ContentStoreStatus() {
  const profile = useContent('profile');
  const projects = useContent('projects');
  const services = useContent('services');
  const skills = useContent('skills');
  const socialLinks = useContent('socialLinks');
  const errors = [...new Set([profile, projects, services, skills, socialLinks].map(({ error }) => error).filter(Boolean))];
  if (!errors.length) return null;
  return <div className="alert alert-warning m-0 rounded-0" role="alert">Some portfolio content could not be loaded from the API; available default content is shown. {errors.join(' ')}</div>;
}

function ContentStoreStatusGate() {
  const { pathname, search } = useLocation();
  const view = new URLSearchParams(search).get('view');
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/') || view === 'admin';
  const isAuthRoute = pathname === '/login' || pathname === '/register'
    || pathname === '/forgot-password' || pathname === '/reset-password';
  return isAdminRoute || isAuthRoute ? null : <ContentStoreStatus />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <PageMetadata />
      <ContentStoreStatusGate />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<SharedEntry />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<PasswordResetPage />} />
          <Route path="/reset-password" element={<PasswordResetPage reset />} />
          <Route path="/account" element={<AccountRoute><AccountDashboard /></AccountRoute>} />
          <Route path="/about" element={<Home />} />
          <Route path="/projects" element={<Navigate to="/#work" replace />} />
          <Route path="/contact" element={<Home />} />
          <Route path="/bakery" element={<BakeryShop />} />
          <Route path="/haven" element={<Haven />} />
          <Route path="/hardware" element={<HardwareShop />} />
          <Route path="/hardware/product/:id" element={<ProductDetails />} />
          <Route path="/admin/*" element={<LegacyAdminRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
