import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { getUserByEmail } from '../services/authService'
import { citiesFor, countries, countryName, stateName, statesFor } from '../data/locations'

export default function Profile() {
  const { user, updateProfile } = useContext(AuthContext)
  const navigate = useNavigate()

  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CONSUMER',
    location: '',
    country: 'IN',
    state: '',
    city: '',
    bio: '',
    farmName: '',
    farmSize: ''
  })
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) {
      const stored = getUserByEmail(user.email) || {}
      setData(prev => ({
        ...prev,
        name: user.name || stored.name || '',
        email: user.email || stored.email || '',
        phone: user.phone || stored.phone || '',
        role: user.role || stored.role || 'CONSUMER',
        location: user.location || stored.location || 'Nashik, Maharashtra, India',
        country: user.country || stored.country || 'IN',
        state: user.state || stored.state || '',
        city: user.city || stored.city || '',
        bio: user.bio || stored.bio || '',
        farmName: user.farmName || stored.farmName || '',
        farmSize: user.farmSize || stored.farmSize || ''
      }))
    }
  }, [user])


  const change = e => setData({ ...data, [e.target.name]: e.target.value })
  const changeCountry = e => setData({ ...data, country: e.target.value, state: '', city: '' })
  const changeState = e => setData({ ...data, state: e.target.value, city: '' })

  const submit = async e => {
    e.preventDefault()
    setNote('')
    setErr('')
    setBusy(true)

    try {
      let finalLocation = data.location
      if (data.city || data.state) {
        const parts = [
          data.city,
          stateName(data.country, data.state),
          countryName(data.country)
        ].filter(Boolean)
        if (parts.length > 0) {
          finalLocation = parts.join(', ')
        }
      }

      const updatedData = {
        ...user,
        ...data,
        location: finalLocation || user?.location || 'India'
      }

      await updateProfile(updatedData)
      setNote('Your profile has been updated successfully!')
      setTimeout(() => setNote(''), 4000)
    } catch {
      setErr('Unable to update profile right now. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!user) {
    return (
      <section className="container py-5 text-center">
        <p className="text-muted">Please log in to view and update your profile.</p>
        <Link className="btn btn-success" to="/login">
          Go to Login
        </Link>
      </section>
    )
  }

  const isFarmer = data.role === 'FARMER'

  return (
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <p className="section-label">Account settings</p>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2 mb-0">Profile & Preferences</h1>
            <span className="badge text-bg-success px-3 py-2 fs-6">
              <i className="bi bi-shield-check me-1" />
              {data.role} Account
            </span>
          </div>

          {note && (
            <div className="alert alert-success d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-2 fs-5" />
              <div>{note}</div>
            </div>
          )}

          {err && (
            <div className="alert alert-danger d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5" />
              <div>{err}</div>
            </div>
          )}

          <div className="card shadow-sm border p-4 p-md-5">
            <div className="d-flex align-items-center gap-3 pb-4 mb-4 border-bottom">
              <div
                className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold fs-2 shadow-sm"
                style={{ width: 70, height: 70 }}
              >
                {(data.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="h4 mb-0">{data.name || 'User'}</h3>
                <p className="text-muted mb-0">{data.email}</p>
                <small className="text-success fw-semibold">
                  <i className="bi bi-geo-alt me-1" />
                  {data.location || 'Location not specified'}
                </small>
              </div>
            </div>

            <form onSubmit={submit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Full Name</label>
                <input
                  required
                  className="form-control"
                  name="name"
                  value={data.name}
                  onChange={change}
                  placeholder="e.g. Ramesh Patil"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Email Address</label>
                <input
                  required
                  type="email"
                  className="form-control bg-light"
                  name="email"
                  value={data.email}
                  disabled
                  title="Email cannot be changed"
                />
                <div className="form-text">Your primary login email address.</div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  name="phone"
                  value={data.phone}
                  onChange={change}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Account Type</label>
                <select className="form-select" name="role" value={data.role} onChange={change}>
                  <option value="FARMER">Farmer (Sell produce, AI tools, Crop analytics)</option>
                  <option value="CONSUMER">Consumer (Browse marketplace, Request orders, Message farmers)</option>
                </select>
              </div>

              <div className="col-12 mt-4">
                <h5 className="border-bottom pb-2 mb-3 text-secondary">
                  <i className="bi bi-geo-alt-fill me-2 text-success" />
                  Location Details
                </h5>
                <p className="text-muted small">
                  Current location: <strong>{data.location}</strong>. You can update it below:
                </p>
              </div>

              <div className="col-md-4">
                <label className="form-label">Country</label>
                <select className="form-select" value={data.country} onChange={changeCountry}>
                  <option value="">Select country</option>
                  {countries.map(c => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">State / Province</label>
                <select
                  className="form-select"
                  value={data.state}
                  onChange={changeState}
                  disabled={!data.country}
                >
                  <option value="">Select state</option>
                  {statesFor(data.country).map(s => (
                    <option key={s.isoCode} value={s.isoCode}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">City / District</label>
                <select
                  className="form-select"
                  name="city"
                  value={data.city}
                  onChange={change}
                  disabled={!data.state}
                >
                  <option value="">Select city</option>
                  {citiesFor(data.country, data.state).map(city => (
                    <option
                      key={`${city.name}-${city.latitude}-${city.longitude}`}
                      value={city.name}
                    >
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              {isFarmer && (
                <>
                  <div className="col-12 mt-4">
                    <h5 className="border-bottom pb-2 mb-3 text-secondary">
                      <i className="bi bi-flower1 me-2 text-success" />
                      Farm Information (Optional)
                    </h5>
                  </div>

                  <div className="col-md-8">
                    <label className="form-label">Farm / Business Name</label>
                    <input
                      className="form-control"
                      name="farmName"
                      value={data.farmName}
                      onChange={change}
                      placeholder="e.g. Green Valley Organic Agro"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Farm Size / Acres</label>
                    <input
                      className="form-control"
                      name="farmSize"
                      value={data.farmSize}
                      onChange={change}
                      placeholder="e.g. 5 Acres"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">About your farm / Produce</label>
                    <textarea
                      rows="3"
                      className="form-control"
                      name="bio"
                      value={data.bio}
                      onChange={change}
                      placeholder="Tell buyers about your farming practices, organic certification, crops grown, and quality standards…"
                    />
                  </div>
                </>
              )}

              <div className="col-12 d-flex justify-content-between align-items-center pt-3 border-top mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate(-1)}
                >
                  Back
                </button>
                <button type="submit" className="btn btn-success px-4" disabled={busy}>
                  {busy ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving changes…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2 me-1" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
