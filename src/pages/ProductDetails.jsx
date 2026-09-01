import { useContext, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { getProduct } from '../services/productService'
import { createOrder } from '../services/orderService'
import { startConversation } from '../services/messageService'


export default function ProductDetails() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [product, setProduct] = useState()
  const [quantity, setQuantity] = useState(1)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    getProduct(id).then(setProduct)
  }, [id])

  const isOwner =
    user &&
    product &&
    (user.name?.toLowerCase() === product.farmerName?.toLowerCase() ||
      user.email?.toLowerCase() === product.farmerEmail?.toLowerCase() ||
      (user.role === 'FARMER' && user.name === product.farmerName))

  const requestOrder = async () => {
    if (!user) {
      navigate('/login', {
        state: {
          from: location.pathname,
          message: 'Please log in to place an order request.'
        }
      })
      return
    }
    await createOrder({
      productId: String(product.id),
      productName: product.name,
      consumer: user.name || user.email?.split('@')[0] || 'Customer',
      consumerEmail: user.email || '',
      consumerPhone: user.phone || '',
      consumerLocation: user.location || 'Local delivery',
      farmerName: product.farmerName || 'Farmer',
      farmerEmail: product.farmerEmail || '',
      farmerPhone: product.farmerPhone || '',
      farmerLocation: product.location || 'Farm location',
      quantity: Number(quantity) || 1,
      unit: product.unit || 'kg',
      price: Number(product.price) || 0,
      total: (Number(quantity) || 1) * Number(product.price),
      imageUrl: product.imageUrl || '',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Pending'
    })
    setSent(true)
  }


  const contactFarmer = async () => {
    if (!user) {
      navigate('/login', {
        state: {
          from: location.pathname,
          message: 'Please log in to contact the farmer.'
        }
      })
      return
    }
    const conv = await startConversation({
      productId: product.id,
      productName: product.name,
      farmerName: product.farmerName || 'Farmer',
      farmerEmail: product.farmerEmail || '',
      consumerName: user.name || user.email?.split('@')[0] || 'Customer',
      consumerEmail: user.email || '',
      initialMessage: `Hello ${product.farmerName || 'Farmer'}, I am interested in your ${product.name}. Is it available for order?`
    })

    const targetRoute = user.role === 'FARMER' ? '/farmer/messages' : '/consumer/messages'
    navigate(targetRoute, { state: { conversationId: conv.id } })
  }


  if (!product) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" />
      </div>
    )
  }

  return (
    <section className="container py-5">
      <div className="row g-5">
        <div className="col-lg-6">
          <img className="img-fluid rounded-4 shadow-sm w-100" src={product.imageUrl} alt={product.name} />
        </div>
        <div className="col-lg-6">
          <span className="badge text-bg-light text-success">{product.category}</span>
          <h1 className="mt-2">{product.name}</h1>
          <p className="text-warning">
            <i className="bi bi-star-fill" /> {product.rating} rating
          </p>
          <h2 className="text-success">
            ₹{product.price}
            <small className="fs-6 text-muted"> / {product.unit}</small>
          </h2>
          <p>{product.description}</p>
          <dl className="row">
            <dt className="col-5">Available quantity</dt>
            <dd className="col-7">{product.quantity} {product.unit}</dd>
            <dt className="col-5">Location</dt>
            <dd className="col-7">{product.location}</dd>
            <dt className="col-5">Farmer</dt>
            <dd className="col-7">{product.farmerName}</dd>
          </dl>

          {isOwner ? (
            <div className="card p-3 bg-light border-0">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <span className="badge text-bg-success mb-1">
                    <i className="bi bi-person-check me-1" /> Your Product Listing
                  </span>
                  <p className="small text-muted mb-0">
                    You are the seller of this product. You can update price, quantity, or details anytime.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <Link className="btn btn-success" to={`/farmer/products/${product.id}/edit`}>
                    <i className="bi bi-pencil me-1" />
                    Edit Listing
                  </Link>
                  <Link className="btn btn-outline-secondary" to="/farmer/products">
                    <i className="bi bi-grid me-1" />
                    My Products
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="d-flex gap-2">
                <input
                  aria-label="Quantity"
                  className="form-control"
                  style={{ maxWidth: 100 }}
                  type="number"
                  min="1"
                  max={product.quantity}
                  value={quantity}
                  onChange={event => setQuantity(event.target.value)}
                />
                <button className="btn btn-outline-success" onClick={contactFarmer}>
                  <i className="bi bi-chat-dots me-1" />
                  Contact farmer
                </button>
                <button className="btn btn-success" onClick={requestOrder}>
                  Request order
                </button>
              </div>
              {sent && (
                <div className="alert alert-success mt-3 mb-0">
                  Order request for {quantity} {product.unit} sent to {product.farmerName}. Payment is arranged directly with the farmer.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card p-4 mt-5">
        <h3 className="h5">Customer reviews</h3>
        <p className="mb-0 text-muted">
          <i className="bi bi-star-fill text-warning" /> “Fresh and exactly as described.” — Verified buyer
        </p>
      </div>
    </section>
  )
}
