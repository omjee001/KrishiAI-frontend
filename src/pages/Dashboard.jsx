import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { getOrders } from '../services/orderService'
import { getProducts } from '../services/productService'



const stats = {
  farmer: [
    ['₹48,260', 'Total revenue', 'bi-currency-rupee'],
    ['24', 'Total orders', 'bi-bag-check'],
    ['12', 'Products listed', 'bi-grid'],
    ['4.8', 'Average rating', 'bi-star']
  ],
  consumer: [
    ['3', 'Active orders', 'bi-box-seam'],
    ['12', 'Saved products', 'bi-heart'],
    ['2', 'Unread messages', 'bi-chat-dots']
  ],
  admin: [
    ['1,284', 'Platform users', 'bi-people'],
    ['342', 'Live listings', 'bi-basket'],
    ['₹8.4L', 'Trade volume*', 'bi-graph-up']
  ],
  analytics: [
    ['₹48,260', 'Total revenue*', 'bi-currency-rupee'],
    ['186', 'Products sold*', 'bi-bar-chart'],
    ['Mangoes', 'Best selling crop*', 'bi-trophy']
  ],
  reports: [
    ['1,284', 'Users*', 'bi-people'],
    ['342', 'Listings*', 'bi-grid'],
    ['92%', 'Fulfillment*', 'bi-check2-circle']
  ]
}

const getBadgeClass = status => {
  switch (status) {
    case 'Accepted':
      return 'text-bg-primary'
    case 'Completed':
      return 'text-bg-success'
    case 'Rejected':
      return 'text-bg-danger'
    case 'Pending':
    default:
      return 'text-bg-warning text-dark'
  }
}

export default function Dashboard({ role }) {
  const { user } = useContext(AuthContext)
  const [productList, setProductList] = useState([])
  const [orderList, setOrderList] = useState([])

  useEffect(() => {
    getProducts().then(setProductList)
    getOrders().then(setOrderList)
  }, [])

  const userName = (user?.name || '').trim().toLowerCase()
  const userEmail = (user?.email || '').trim().toLowerCase()

  // Filter farmer's own products for farmer dashboard
  const myProducts =
    role === 'farmer' || user?.role === 'FARMER'
      ? productList.filter(p => {
          const fName = (p.farmerName || '').trim().toLowerCase()
          const fEmail = (p.farmerEmail || '').trim().toLowerCase()
          return (
            (fEmail && fEmail === userEmail) ||
            (fName && fName === userName) ||
            (fName && userName && (fName.includes(userName) || userName.includes(fName)))
          )
        })
      : productList

  const myProductIds = myProducts.map(p => String(p.id))

  // Filter orders by user identity
  const relevantOrders =
    role === 'farmer' || user?.role === 'FARMER'
      ? orderList.filter(o => {
          const fName = (o.farmerName || '').trim().toLowerCase()
          const fEmail = (o.farmerEmail || '').trim().toLowerCase()
          const matchesProductId = o.productId && myProductIds.includes(String(o.productId))
          const matchesEmail = fEmail && fEmail === userEmail
          const matchesName =
            (fName && fName === userName) ||
            (fName && userName && (fName.includes(userName) || userName.includes(fName)))

          return matchesProductId || matchesEmail || matchesName
        })
      : role === 'consumer' || user?.role === 'CONSUMER'
      ? orderList.filter(o => {
          const cName = (o.consumer || '').trim().toLowerCase()
          const cEmail = (o.consumerEmail || '').trim().toLowerCase()
          const matchesEmail = cEmail && cEmail === userEmail
          const matchesName =
            (cName && cName === userName) ||
            (cName && userName && (cName.includes(userName) || userName.includes(cName)))

          return matchesEmail || matchesName
        })
      : orderList


  const title =
    role === 'analytics'
      ? 'Sales analytics'
      : role === 'reports'
      ? 'Platform reports'
      : role === 'farmer'
      ? 'Farmer dashboard'
      : role === 'consumer'
      ? 'Consumer dashboard'
      : 'Admin dashboard'

  const ordersLink = role === 'farmer' ? '/farmer/orders' : '/consumer/orders'

  return (
    <section className="container py-5">
      <p className="section-label">
        {role === 'analytics' || role === 'reports' ? 'Mock reporting data' : 'Overview'}
      </p>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">{title}</h1>
        {role === 'farmer' && (
          <Link className="btn btn-success" to="/farmer/products/new">
            <i className="bi bi-plus-lg me-1" />
            Add product
          </Link>
        )}
      </div>

      <div className="row g-3 mb-5">
        {stats[role].map(([n, l, i]) => (
          <div className="col-sm-6 col-lg" key={l}>
            <div className="card p-3 metric h-100">
              <i className={`bi ${i} text-success`} />
              <strong className="fs-4 mt-2">
                {l === 'Products listed'
                  ? myProducts.length
                  : l === 'Total orders' && role === 'farmer'
                  ? relevantOrders.length
                  : l === 'Active orders' && role === 'consumer'
                  ? relevantOrders.filter(o => o.status !== 'Completed' && o.status !== 'Rejected').length
                  : n}
              </strong>
              <span className="small text-muted">{l}</span>
            </div>
          </div>
        ))}
      </div>

      {(role === 'farmer' || role === 'analytics') && (
        <div className="alert alert-light border">
          <i className="bi bi-info-circle text-success me-2" />
          Values marked * are mock data and will be replaced when your backend analytics endpoint is connected.
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Recent orders</h2>
              {(role === 'farmer' || role === 'consumer') && (
                <Link className="text-success small text-decoration-none fw-semibold" to={ordersLink}>
                  View all orders <i className="bi bi-arrow-right" />
                </Link>
              )}
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>{role === 'farmer' ? 'Customer' : 'Farmer'}</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {relevantOrders.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        No recent orders found
                      </td>
                    </tr>
                  ) : (
                    relevantOrders.slice(0, 5).map(o => (
                      <tr key={o.id}>
                        <td>{o.productName}</td>
                        <td>{role === 'farmer' ? o.consumer : o.farmerName || 'Farmer'}</td>
                        <td>₹{o.total}</td>
                        <td>
                          <span className={`badge ${getBadgeClass(o.status)}`}>{o.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">
                {role === 'consumer'
                  ? 'Recommended for you'
                  : role === 'farmer'
                  ? 'Your listed products'
                  : 'Platform products'}
              </h2>
              {role === 'consumer' ? (
                <Link className="text-success small text-decoration-none" to="/marketplace">
                  View marketplace
                </Link>
              ) : role === 'farmer' ? (
                <Link className="text-success small text-decoration-none" to="/farmer/products">
                  Manage products
                </Link>
              ) : null}
            </div>
            {(role === 'farmer' ? myProducts : productList).length === 0 ? (
              <p className="text-muted small py-3 mb-0 text-center">No products listed yet.</p>
            ) : (
              (role === 'farmer' ? myProducts : productList).slice(0, 3).map(p => (
                <Link
                  to={`/products/${p.id}`}
                  className="d-flex align-items-center gap-3 py-2 border-bottom text-decoration-none text-dark"
                  key={p.id}
                >
                  <img
                    src={p.imageUrl}
                    alt=""
                    width="45"
                    height="45"
                    className="rounded object-fit-cover"
                  />
                  <div className="flex-grow-1">
                    <strong>{p.name}</strong>
                    <div className="small text-success">
                      ₹{p.price}/{p.unit}
                    </div>
                  </div>
                  <i className="bi bi-chevron-right text-muted small" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}


