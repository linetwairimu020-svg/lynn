import { useEffect, useState } from 'react';
import { getCollection, getDefaultCollection, subscribeToCollection } from '../services/mockContentService';

export default function useContent(name) {
  const [initialState] = useState(() => {
    try {
      return { content: getCollection(name), error: '' };
    } catch (error) {
      return { content: getDefaultCollection(name), error: error.message };
    }
  });
  const [content, setContent] = useState(initialState.content);
  const [error, setError] = useState(initialState.error);

  useEffect(() => {
    const refresh = () => {
      try {
        setContent(getCollection(name));
        setError('');
      } catch (readError) {
        setError(readError.message);
      }
    };
    refresh();
    return subscribeToCollection(name, refresh);
  }, [name]);

  return { content, error };
}
