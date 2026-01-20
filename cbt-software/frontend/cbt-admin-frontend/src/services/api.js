const BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:5000'

// Helper to get the token from local storage
function getToken() {
  const auth = localStorage.getItem('auth');
  if (auth) {
    try {
      return JSON.parse(auth).token;
    } catch (e) {
      console.error('Failed to parse auth token from localStorage', e);
      return null;
    }
  }
  return null;
}

// Helper to create headers
function getHeaders() {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  return res.json();
}

async function get(path) {
  const res = await fetch(BASE + path, {
    headers: {
      ...getHeaders(),
      'Content-Type': undefined, // Let browser set content-type for GET
    }
  });
  return res.json();
}

async function postForm(path, formData) {
  const headers = getHeaders();
  // Don't set Content-Type for multipart/form-data, let the browser do it
  delete headers['Content-Type']; 

  const res = await fetch(BASE + path, {
    method: 'POST',
    headers,
    body: formData
  });
  return res.json();
}

async function put(path, body) {
  const res = await fetch(BASE + path, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  return res.json();
}

async function del(path) {
  const res = await fetch(BASE + path, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return res.json();
}

export default { post, get, postForm, put, delete: del }
