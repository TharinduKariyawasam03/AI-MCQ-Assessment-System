import { useCallback, useEffect, useState } from 'react';
import { api } from './client.js';

// Loads `path` on mount and whenever it changes. Pass null to skip loading.
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: '', loading: Boolean(path) });

  const load = useCallback(async () => {
    if (!path) return;
    try {
      const data = await api(path);
      setState({ data, error: '', loading: false });
    } catch (err) {
      setState({ data: null, error: err.message, loading: false });
    }
  }, [path]);

  useEffect(() => {
    let active = true;
    if (!path) {
      setState({ data: null, error: '', loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    api(path)
      .then((data) => active && setState({ data, error: '', loading: false }))
      .catch((err) => active && setState({ data: null, error: err.message, loading: false }));
    return () => {
      active = false;
    };
  }, [path]);

  const setData = useCallback((data) => setState({ data, error: '', loading: false }), []);

  return { ...state, reload: load, setData };
}
