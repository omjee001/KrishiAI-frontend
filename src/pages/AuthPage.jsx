import { useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { citiesFor, countryName, countries, stateName, statesFor } from '../data/locations'

export default function AuthPage({ register = false }) {
  const { login, register: signup } = useContext(AuthContext)
  const go = useNavigate()
  const location = useLocation()
  const from = location.state?.from
  const promptMessage = location.state?.message

  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    password: '',
    confirm: '',
    role: 'CONSUMER'
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const change = e => setData({ ...data, [e.target.name]: e.target.value })
  const changeCountry = e => setData({ ...data, country: e.target.value, state: '', city: '' })
  const changeState = e => setData({ ...data, state: e.target.value, city: '' })

  const submit = async e => {
    e.preventDefault()
    setErr('')
    if (register && data.password !== data.confirm) return setErr('Passwords do not match.')
    if (data.password.length < 6) return setErr('Password must be at least 6 characters.')
    setBusy(true)
    try {
      const registrationData = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        country: data.country || 'IN',
        state: data.state || '',
        city: data.city || '',
        location:
          [data.city, stateName(data.country, data.state), countryName(data.country)]
            .filter(Boolean)
            .join(', ') || 'India',
        role: data.role || 'CONSUMER'
      }
      const u = register ? await signup(registrationData) : await login(data)
      const destination = from || `/${u.role.toLowerCase()}/dashboard`
      go(destination, { replace: true })
    } catch {
      setErr('Unable to sign in right now. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card p-4 p-md-5">
            <p className="section-label">{register ? 'Create your account' : 'Welcome back'}</p>
            <h1 className="h2">{register ? 'Join KrishiAI' : 'Login to KrishiAI'}</h1>
            {promptMessage && (
              <div className="alert alert-info d-flex align-items-center mb-3">
                <i className="bi bi-info-circle-fill me-2" />
                <span>{promptMessage}</span>
              </div>
            )}
            {err && <div className="alert alert-danger">{err}</div>}
            <form onSubmit={submit} className="row g-3">
              {register && (
                <>
                  <div className="col-12">
                    <label className="form-label">Full name</label>
                    <input
                      required
                      name="name"
                      value={data.name}
                      className="form-control"
                      onChange={change}
                      placeholder="e.g. Ramesh Patil"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Phone number</label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={data.phone}
                      className="form-control"
                      onChange={change}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Country</label>
                    <select required className="form-select" value={data.country} onChange={changeCountry}>
                      <option value="">Select country</option>
                      {countries.map(country => (
                        <option key={country.isoCode} value={country.isoCode}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">State</label>
                    <select required className="form-select" value={data.state} onChange={changeState} disabled={!data.country}>
                      <option value="">Select state</option>
                      {statesFor(data.country).map(state => (
                        <option key={state.isoCode} value={state.isoCode}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">City</label>
                    <select required className="form-select" name="city" value={data.city} onChange={change} disabled={!data.state}>
                      <option value="">Select city</option>
                      {citiesFor(data.country, data.state).map(city => (
                        <option key={`${city.name}-${city.latitude}-${city.longitude}`} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="col-12">
                <label className="form-label">Email</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={data.email}
                  className="form-control"
                  onChange={change}
                  placeholder="name@example.com"
                />
              </div>
              <div className="col-12">
                <label className="form-label">Password</label>
                <input
                  required
                  minLength="6"
                  type="password"
                  name="password"
                  value={data.password}
                  className="form-control"
                  onChange={change}
                  placeholder="At least 6 characters"
                />
              </div>
              {register && (
                <>
                  <div className="col-12">
                    <label className="form-label">Confirm password</label>
                    <input
                      required
                      type="password"
                      name="confirm"
                      value={data.confirm}
                      className="form-control"
                      onChange={change}
                      placeholder="Re-enter password"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">I am joining as</label>
                    <select className="form-select" name="role" value={data.role} onChange={change}>
                      <option value="CONSUMER">Consumer (Buy produce, direct orders)</option>
                      <option value="FARMER">Farmer (Sell produce, AI crop tools)</option>
                    </select>
                  </div>
                </>
              )}

              {!register && (
                <div className="col-12 form-check">
                  <input className="form-check-input" id="remember" type="checkbox" />
                  <label className="form-check-label" htmlFor="remember">
                    Remember me
                  </label>
                </div>
              )}
              <div className="col-12">
                <button disabled={busy} className="btn btn-success w-100">
                  {busy ? 'Please wait…' : register ? 'Create account' : 'Login'}
                </button>
              </div>
            </form>
            <p className="text-center text-muted mt-3 mb-0">
              {register ? 'Already have an account?' : 'New to KrishiAI?'}{' '}
              <Link className="text-success" to={register ? '/login' : '/register'} state={location.state}>
                {register ? 'Login' : 'Register'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

