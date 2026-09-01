import { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function ProtectedRoute({ roles, children }) {
  const { user } = useContext(AuthContext)
  const location = useLocation()

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
          message: 'Please log in to access this page.'
        }}
        replace
      />
    )
  }

  return roles.includes(user.role) ? children : <Navigate to="/" replace />
}

