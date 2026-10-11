const TOKEN_KEY = 'myteacher_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Calls the API. `body` is sent as JSON, `formData` as a multipart upload.
// Resolves with the parsed response, rejects with an Error carrying the server message.
export async function api(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearToken();
      window.location.assign('/login');
    }
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    throw error;
  }
  return data;
}
