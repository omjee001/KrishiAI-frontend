import api from './api'

const mock = import.meta.env.VITE_USE_MOCK_API !== 'false'
const USERS_STORAGE_KEY = 'krishi_registered_users'

const defaultUsers = [
  {
    name: 'Ravi Kumar',
    email: 'ravi@farm.com',
    phone: '+91 98230 12345',
    role: 'FARMER',
    location: 'Nashik, Maharashtra, India',
    country: 'IN',
    state: 'MH',
    city: 'Nashik'
  },
  {
    name: 'Aman Singh',
    email: 'aman@farm.com',
    phone: '+91 98120 54321',
    role: 'FARMER',
    location: 'Karnal, Haryana, India',
    country: 'IN',
    state: 'HR',
    city: 'Karnal'
  },
  {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 98765 43210',
    role: 'CONSUMER',
    location: 'Pune, Maharashtra, India',
    country: 'IN',
    state: 'MH',
    city: 'Pune'
  },
  {
    name: 'Admin User',
    email: 'admin@krishiai.com',
    phone: '+91 99999 00000',
    role: 'ADMIN',
    location: 'Delhi, India',
    country: 'IN',
    state: 'DL',
    city: 'Delhi'
  }
]

export const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers))
  } catch {
    // ignore
  }
  return defaultUsers
}

export const saveUserToStorage = user => {
  const users = getStoredUsers()
  const existingIndex = users.findIndex(u => u.email?.toLowerCase() === user.email?.toLowerCase())
  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...user }
  } else {
    users.push(user)
  }
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  } catch {
    // ignore
  }
}

export const getUserByEmail = email => {
  if (!email) return null
  const users = getStoredUsers()
  return users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null
}

export const login = data => {
  if (mock) {
    const users = getStoredUsers()
    const found = users.find(u => u.email?.toLowerCase() === data.email?.toLowerCase())
    if (found) {
      if (data.role && data.role !== found.role) {
        found.role = data.role
        saveUserToStorage(found)
      }
      return Promise.resolve({ user: found })
    }

    const role = data.role
      ? data.role
      : data.email?.includes('admin')
      ? 'ADMIN'
      : data.email?.includes('farm') || data.email?.includes('farmer')
      ? 'FARMER'
      : 'CONSUMER'

    const newUser = {
      name: data.email ? data.email.split('@')[0] : 'User',
      email: data.email || 'user@example.com',
      phone: data.phone || '',
      role,
      location: 'Nashik, Maharashtra, India',
      country: 'IN',
      state: 'MH',
      city: 'Nashik'
    }
    saveUserToStorage(newUser)
    return Promise.resolve({ user: newUser })
  }
  return api.post('/auth/login', data).then(r => r.data)
}

export const register = data => {
  if (mock) {
    const user = {
      name: data.name || (data.email ? data.email.split('@')[0] : 'User'),
      email: data.email,
      phone: data.phone || '',
      location: data.location || 'Nashik, Maharashtra, India',
      country: data.country || 'IN',
      state: data.state || '',
      city: data.city || '',
      role: data.role || 'CONSUMER',
      farmName: data.farmName || '',
      farmSize: data.farmSize || '',
      bio: data.bio || ''
    }
    saveUserToStorage(user)
    return Promise.resolve({ user })
  }
  return api.post('/auth/register', data).then(r => r.data)
}

export const updateProfile = data => {
  if (mock) {
    saveUserToStorage(data)
    return Promise.resolve({ user: data })
  }
  return api.put('/auth/profile', data).then(r => r.data)
}



