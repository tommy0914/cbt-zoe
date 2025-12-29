const BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:5000'

async function post(path, body, token) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  return res.json()
}

async function get(path, token) {
  const res = await fetch(BASE + path, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  return res.json()
}

async function postForm(path, formData, token) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  })
  return res.json()
}

async function put(path, body, token) {
  const res = await fetch(BASE + path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  return res.json()
}

async function del(path, token) {
  const res = await fetch(BASE + path, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  return res.json()
}

export default { post, get, postForm, put, delete: del }

