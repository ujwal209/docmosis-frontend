const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('docmosiss_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // --- THE FIX ---
    // If the backend throws a 401 Unauthorized (expired or invalid token)
    if (response.status === 401) {
      localStorage.removeItem('docmosiss_token'); // Nuke the dead token
      window.location.href = '/login'; // Boot them straight to login
    }
    
    throw new Error(data.detail || data.message || 'Something went wrong');
  }

  return data;
}