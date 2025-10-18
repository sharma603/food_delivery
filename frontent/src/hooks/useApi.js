import { useState, useCallback } from 'react';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url) => makeRequest(url), [makeRequest]);
  const post = useCallback((url, data) => makeRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }), [makeRequest]);
  const put = useCallback((url, data) => makeRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  }), [makeRequest]);
  const del = useCallback((url) => makeRequest(url, {
    method: 'DELETE',
  }), [makeRequest]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
  };
};
