import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { generateListing } from '../services/aiService'
import { getProduct, saveProduct } from '../services/productService'

export default function ProductForm() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const go = useNavigate()

  const [data, setData] = useState({
    name: '',
    category: 'Vegetables',
    description: '',
    quantity: '',
    unit: 'kg',
    price: '',
    location: '',
    farmerName: '',
    imageUrl: ''
  })
  const [ai, setAi] = useState()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [imagePreview, setImagePreview] = useState('')

  // Prefill farmer name and location on new form or load product on edit
  useEffect(() => {
    if (id) {
      getProduct(id).then(found => {
        if (found) {
          setData(found)
          if (found.imageUrl) setImagePreview(found.imageUrl)
        }
      })
    } else {
      setData(prev => ({
        ...prev,
        farmerName: user?.name || 'Ravi Kumar',
        location: user?.location || 'Nashik, Maharashtra'
      }))
    }
  }, [id, user])

  const change = e => setData({ ...data, [e.target.name]: e.target.value })

  const handleImageChange = e => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = event => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxDim = 600
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', 0.75)
          setImagePreview(compressed)
          setData(prev => ({ ...prev, imageUrl: compressed }))
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }


  const generate = async () => {
    setBusy(true)
    setAi(undefined)
    try {
      const r = await generateListing({
        crop: data.name,
        location: data.location || 'Local Farm',
        quality: 'fresh'
      })
      setAi(r)
    } catch {
      setNote('AI service is temporarily unavailable. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const apply = () => {
    if (!ai) return
    setData(prev => ({
      ...prev,
      name: ai.title || prev.name,
      category: ai.category || prev.category,
      description: ai.description || prev.description,
      price: ai.suggestedPrice || prev.price
    }))
  }

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = {
        ...data,
        quantity: Number(data.quantity) || 1,
        price: Number(data.price) || 0,
        farmerName: data.farmerName || user?.name || 'Farmer',
        farmerEmail: user?.email || data.farmerEmail || '',
        location: data.location || user?.location || 'Nashik, Maharashtra'
      }
      if (id) {
        payload.id = id
      }

      const saved = await saveProduct(payload)
      setNote(
        `Product "${saved.name || data.name}" has been saved successfully and is now active in the marketplace!`
      )
      setTimeout(() => {
        go('/farmer/products')
      }, 1200)
    } catch {
      setNote('Unable to save product. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <p className="section-label">Farmer workspace</p>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h1 className="h2 mb-0">{id ? 'Edit product listing' : 'Create a product listing'}</h1>
            <div className="d-flex gap-2">
              <Link className="btn btn-outline-secondary btn-sm" to="/farmer/products">
                <i className="bi bi-grid me-1" />
                My products
              </Link>
              <Link className="btn btn-outline-success btn-sm" to="/marketplace">
                <i className="bi bi-shop me-1" />
                Marketplace
              </Link>
            </div>
          </div>
          <p className="text-muted">
            {id
              ? 'Update your crop details, pricing, and stock levels.'
              : 'Add freshly harvested crops to make them visible to all consumers across the marketplace.'}
          </p>

          {note && (
            <div className="alert alert-success mt-3 d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-check-circle-fill me-2" />
                <span>{note}</span>
              </div>
              <Link className="btn btn-success btn-sm ms-3" to="/marketplace">
                View in Marketplace
              </Link>
            </div>
          )}

          <div className="card p-4 mt-3">
            <form onSubmit={submit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Product / Crop name</label>
                <input
                  required
                  className="form-control"
                  name="name"
                  value={data.name}
                  onChange={change}
                  placeholder="e.g. Fresh Organic Tomatoes"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Category</label>
                <select className="form-select" name="category" value={data.category} onChange={change}>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Grains">Grains</option>
                  <option value="Spices">Spices</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  required
                  rows="3"
                  className="form-control"
                  name="description"
                  value={data.description}
                  onChange={change}
                  placeholder="Describe freshness, origin, harvest details, and quality..."
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Available quantity</label>
                <input
                  required
                  min="1"
                  type="number"
                  className="form-control"
                  name="quantity"
                  value={data.quantity}
                  onChange={change}
                  placeholder="100"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Unit</label>
                <input
                  required
                  className="form-control"
                  name="unit"
                  value={data.unit}
                  onChange={change}
                  placeholder="kg, dozen, quintal"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Price (₹)</label>
                <input
                  required
                  min="1"
                  type="number"
                  className="form-control"
                  name="price"
                  value={data.price}
                  onChange={change}
                  placeholder="₹ per unit"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Farm location</label>
                <input
                  required
                  className="form-control"
                  name="location"
                  value={data.location}
                  onChange={change}
                  placeholder="City, State"
                />
              </div>

              <div className="col-12">
                <label className="form-label">Product image</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <div className="form-text">
                  Upload an image from your farm or leave empty to use our high-quality category image.
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="rounded border"
                      style={{ maxHeight: 150, maxWidth: 220, objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>

              <div className="col-12 d-flex gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-outline-success"
                  disabled={busy}
                  onClick={generate}
                >
                  <i className="bi bi-magic me-1" />
                  Generate with AI
                </button>
                <button className="btn btn-success" disabled={busy}>
                  {busy ? 'Saving...' : id ? 'Update product' : 'Save product'}
                </button>
                <button
                  type="button"
                  className="btn btn-link text-muted"
                  onClick={() => go('/farmer/products')}
                >
                  Cancel
                </button>
              </div>
            </form>

            {ai && (
              <div className="alert alert-success mt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <strong>
                    <i className="bi bi-stars me-1" />
                    AI suggestions — review before publishing
                  </strong>
                  <button className="btn btn-success btn-sm" onClick={apply}>
                    Apply to form
                  </button>
                </div>
                <hr />
                <b>{ai.title}</b>
                <p className="mb-1">{ai.description}</p>
                <small>
                  Category: {ai.category} · Suggested price: ₹{ai.suggestedPrice}
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

