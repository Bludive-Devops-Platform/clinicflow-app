export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('clinicflow_token');
}

export function setToken(token: string) {
  localStorage.setItem('clinicflow_token', token);
}

export function clearToken() {
  localStorage.removeItem('clinicflow_token');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('clinicflow_user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: any) {
  localStorage.setItem('clinicflow_user', JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem('clinicflow_user');
}
