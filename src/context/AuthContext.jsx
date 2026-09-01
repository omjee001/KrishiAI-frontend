import { createContext, useState } from 'react'
import * as auth from '../services/authService'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('krishi-user') || 'null'))

  const commit = u => {
    setUser(u)
    if (u) {
      localStorage.setItem('krishi-user', JSON.stringify(u))
    } else {
      localStorage.removeItem('krishi-user')
    }
  }

  const login = async d => {
    const r = await auth.login(d)
    commit(r.user)
    return r.user
  }

  const register = async d => {
    const r = await auth.register(d)
    commit(r.user)
    return r.user
  }

  const updateProfile = async d => {
    const r = await auth.updateProfile(d)
    commit(r.user)
    return r.user
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('krishi-user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

