// Every call from React to Express goes through this one function (Fetch API + JWT header)
import { API_BASE } from '../config/config';

export const getToken = () => sessionStorage.getItem('token');

async function request(method, url, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (getToken()) headers.Authorization = 'Bearer ' + getToken();
  let res;
  try {
    res = await fetch(API_BASE + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (res.status === 401 && !url.startsWith('/auth/login')) {
    sessionStorage.clear();
    window.location.href = '/login';
  }
  if (!res.ok) throw new Error((data && data.message) || 'Request failed');
  return data;
}

export const api = {
  get: (u) => request('GET', u),
  post: (u, b) => request('POST', u, b),
  put: (u, b) => request('PUT', u, b),
  del: (u) => request('DELETE', u),
};
