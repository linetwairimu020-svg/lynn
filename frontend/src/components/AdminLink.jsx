import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { apiService } from '../services/apiService';

export default function AdminLink({ className = '', onClick, role }) {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const [authorizedUserId, setAuthorizedUserId] = useState('');

  useEffect(() => {
    setAuthorizedUserId('');
    if (!user || user.role !== 'admin') return undefined;

    let active = true;
    apiService.admin.authorize()
      .then(() => {
        if (active) setAuthorizedUserId(user.id);
      })
      .catch(() => {
        if (active) setAuthorizedUserId('');
      });

    return () => { active = false; };
  }, [user]);

  if (!user || user.role !== 'admin' || authorizedUserId !== user.id) return null;

  const isActive = pathname === '/' && new URLSearchParams(search).get('view') === 'admin';
  return <Link className={`${className}${isActive ? ' active' : ''}`} to="/?view=admin" aria-current={isActive ? 'page' : undefined} onClick={onClick} role={role}><i className="bi bi-speedometer2" aria-hidden="true" />Admin dashboard</Link>;
}
