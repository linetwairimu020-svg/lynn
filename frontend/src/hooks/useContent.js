import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/apiService';
import { getDefaultCollection } from '../services/contentDefaults';
import { subscribeToContentChanges } from '../services/contentEvents';

export default function useContent(name, { admin = false } = {}) {
  const defaults = useMemo(() => getDefaultCollection(name), [name]);
  const emptyValue = useMemo(() => (Array.isArray(defaults) ? [] : {}), [defaults]);
  const [content, setContent] = useState(admin ? emptyValue : defaults);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = admin
        ? await apiService.content.list(name)
        : await apiService.content.publicList(name);
      setContent(result.content);
      setError('');
      return result.content;
    } catch (readError) {
      setError(readError.message);
      if (!admin) setContent(defaults);
      throw readError;
    } finally {
      setLoading(false);
    }
  }, [admin, defaults, name]);

  useEffect(() => {
    setContent(admin ? emptyValue : defaults);
    refresh().catch(() => {});
    return subscribeToContentChanges(() => refresh().catch(() => {}));
  }, [admin, defaults, emptyValue, refresh]);

  return { content, error, loading, refresh };
}
