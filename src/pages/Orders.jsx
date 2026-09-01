import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { getOrders, updateOrderStatus } from '../services/orderService'
import { getProducts } from '../services/productService'
import { startConversation } from '../services/messageService'

export default function Orders({ role }) {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [farmerProductIds, setFarmerProductIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const showToast = msg => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  useEffect(() => {
    Promise.all([getOrders(), getProducts()])
      .then(([allOrders, allProducts]) => {
        if (!user) {
          setList([])
          return
        }
        if (user.role === 'ADMIN') {
          setList(allOrders || [])
          return
        }

        const userName = (user.name || '').trim().toLowerCase()
        const userEmail = (user.email || '').trim().toLowerCase()

        if (role === 'farmer' || user.role === 'FARMER') {
          // Identify farmer's own products
          const myProducts = (allProducts || []).filter(p => {
            const pName = (p.farmerName || '').trim().toLowerCase()
            const pEmail = (p.farmerEmail || '').trim().toLowerCase()
            return (
              (pEmail && pEmail === userEmail) ||
              (pName && pName === userName) ||
              (pName && userName && (pName.includes(userName) || userName.includes(pName)))
            )
          })
          const pIds = myProducts.map(p => String(p.id))
          setFarmerProductIds(pIds)

          // Filter orders for this farmer
          const myFarmerOrders = (allOrders || []).filter(o => {
            const fName = (o.farmerName || '').trim().toLowerCase()
            const fEmail = (o.farmerEmail || '').trim().toLowerCase()
            const matchesProductId = o.productId && pIds.includes(String(o.productId))
            const matchesEmail = fEmail && fEmail === userEmail
            const matchesName =
              (fName && fName === userName) ||
              (fName && userName && (fName.includes(userName) || userName.includes(fName)))

            return matchesProductId || matchesEmail || matchesName
          })
          setList(myFarmerOrders)
        } else {
          // Filter orders placed by this consumer
          const myConsumerOrders = (allOrders || []).filter(o => {
            const cName = (o.consumer || '').trim().toLowerCase()
            const cEmail = (o.consumerEmail || '').trim().toLowerCase()
            const matchesEmail = cEmail && cEmail === userEmail
            const matchesName =
              (cName && cName === userName) ||
              (cName && userName && (cName.includes(userName) || userName.includes(cName)))

            return matchesEmail || matchesName
          })
          setList(myConsumerOrders)
        }
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [user, role])

  const checkIsFarmer = order => {
    if (!user) return false
    if (role === 'farmer' || user.role === 'FARMER') return true
    const uName = (user.name || '').trim().toLowerCase()
    const uEmail = (user.email || '').trim().toLowerCase()
    const fName = (order?.farmerName || '').trim().toLowerCase()
    const fEmail = (order?.farmerEmail || '').trim().toLowerCase()
    if (fEmail && fEmail === uEmail) return true
    if (fName && fName === uName) return true
    if (order?.productId && farmerProductIds.includes(String(order.productId))) return true
    return false
  }

  const update = async (id, status) => {
    await updateOrderStatus(id, status)
    setList(current =>
      current.map(x => (x.id === id ? { ...x, status } : x))
    )
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder(prev => (prev ? { ...prev, status } : null))
    }
    showToast(
      status === 'Accepted'
        ? `Order #${id} has been accepted! Crop is ready for dispatch.`
        : status === 'Rejected'
        ? `Order #${id} has been declined.`
        : status === 'Completed'
        ? `Order #${id} marked as completed & delivered!`
        : `Order #${id} updated to ${status}.`
    )
  }

  const handleOrderMessage = async order => {
    if (!order) return
    const conv = await startConversation({
      productId: order.productId || '',
      productName: order.productName,
      farmerName: order.farmerName || 'Farmer',
      farmerEmail: order.farmerEmail || '',
      consumerName: order.consumer || 'Customer',
      consumerEmail: order.consumerEmail || '',
      initialMessage: `Hi, regarding order ${order.id} for ${order.productName} (${order.quantity} units).`
    })
    setSelectedOrder(null)
    const targetRoute = user?.role === 'FARMER' ? '/farmer/messages' : '/consumer/messages'
    navigate(targetRoute, { state: { conversationId: conv.id } })
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

  const filteredList = list.filter(o => {
    const matchesTab = filterStatus === 'All' || o.status === filterStatus
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      !term ||
      o.id?.toLowerCase().includes(term) ||
      o.productName?.toLowerCase().includes(term) ||
      o.consumer?.toLowerCase().includes(term) ||
      o.farmerName?.toLowerCase().includes(term)
    return matchesTab && matchesSearch
  })

  const totalCount = list.length
  const pendingCount = list.filter(o => o.status === 'Pending').length
  const acceptedCount = list.filter(o => o.status === 'Accepted').length
  const completedCount = list.filter(o => o.status === 'Completed').length

  const isFarmerView = role === 'farmer' || user?.role === 'FARMER'

  return (
    <section className="container py-5">
      <p className="section-label">Order fulfillment & tracking</p>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h2 mb-0">
          {isFarmerView ? 'Manage Incoming Orders' : 'My Orders & Requests'}
        </h1>
        {isFarmerView && (
          <Link className="btn btn-outline-success btn-sm" to="/farmer/products">
            <i className="bi bi-box-seam me-1" />
            My Crop Listings
          </Link>
        )}
      </div>

      {toastMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2 fs-5" />
          <div className="flex-grow-1">{toastMessage}</div>
          <button type="button" className="btn-close" onClick={() => setToastMessage('')} />
        </div>
      )}

      {/* Metric summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div
            className={`card p-3 h-100 cursor-pointer border ${filterStatus === 'All' ? 'border-success shadow-sm bg-light' : ''}`}
            onClick={() => setFilterStatus('All')}
            style={{ cursor: 'pointer' }}
          >
            <div className="text-muted small">Total Orders</div>
            <div className="fs-3 fw-bold mt-1">{totalCount}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className={`card p-3 h-100 cursor-pointer border ${filterStatus === 'Pending' ? 'border-warning shadow-sm bg-light' : ''}`}
            onClick={() => setFilterStatus('Pending')}
            style={{ cursor: 'pointer' }}
          >
            <div className="text-warning fw-semibold small">
              <i className="bi bi-clock-history me-1" />
              Pending Action
            </div>
            <div className="fs-3 fw-bold mt-1 text-warning-emphasis">{pendingCount}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className={`card p-3 h-100 cursor-pointer border ${filterStatus === 'Accepted' ? 'border-primary shadow-sm bg-light' : ''}`}
            onClick={() => setFilterStatus('Accepted')}
            style={{ cursor: 'pointer' }}
          >
            <div className="text-primary fw-semibold small">
              <i className="bi bi-truck me-1" />
              Confirmed / In Dispatch
            </div>
            <div className="fs-3 fw-bold mt-1 text-primary">{acceptedCount}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className={`card p-3 h-100 cursor-pointer border ${filterStatus === 'Completed' ? 'border-success shadow-sm bg-light' : ''}`}
            onClick={() => setFilterStatus('Completed')}
            style={{ cursor: 'pointer' }}
          >
            <div className="text-success fw-semibold small">
              <i className="bi bi-check2-all me-1" />
              Completed
            </div>
            <div className="fs-3 fw-bold mt-1 text-success">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* Control bar: Tabs & Search */}
      <div className="card shadow-sm border mb-4">
        <div className="p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <ul className="nav nav-pills flex-wrap">
            {['All', 'Pending', 'Accepted', 'Completed', 'Rejected'].map(tab => (
              <li className="nav-item" key={tab}>
                <button
                  className={`nav-link py-1 px-3 small ${filterStatus === tab ? 'active bg-success' : 'text-dark'}`}
                  onClick={() => setFilterStatus(tab)}
                >
                  {tab}
                  {tab === 'Pending' && pendingCount > 0 && (
                    <span className="badge text-bg-warning text-dark ms-1 rounded-pill">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div className="input-group" style={{ maxWidth: '320px' }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search by ID, crop, or name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary border-start-0"
                onClick={() => setSearchTerm('')}
              >
                <i className="bi bi-x" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" />
            <p className="mt-2 text-muted">Loading orders…</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox fs-1 text-muted" />
            <h4 className="mt-3">No orders found</h4>
            <p className="text-muted mb-3">
              {searchTerm || filterStatus !== 'All'
                ? 'Try changing your search keywords or filter tab.'
                : isFarmerView
                ? 'When customers place order requests for your listed crops, they will appear here.'
                : 'You have not placed any order requests yet.'}
            </p>
            {!isFarmerView && (
              <Link className="btn btn-success btn-sm align-self-center" to="/marketplace">
                <i className="bi bi-shop me-1" />
                Browse Fresh Marketplace
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>{isFarmerView ? 'Customer Details' : 'Farmer Details'}</th>
                  <th>Quantity</th>
                  <th>Total Amount</th>
                  <th>Order Date</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(o => {
                  const isSellerOfOrder = checkIsFarmer(o)

                  return (
                    <tr key={o.id}>
                      <td>
                        <span className="fw-bold font-monospace small text-muted">
                          {o.id}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {o.imageUrl && (
                            <img
                              src={o.imageUrl}
                              alt=""
                              width="40"
                              height="40"
                              className="rounded object-fit-cover shadow-sm"
                            />
                          )}
                          <div>
                            <strong>{o.productName}</strong>
                            <div className="small text-muted">
                              ₹{o.price || Math.round(o.total / (o.quantity || 1))}/{o.unit || 'unit'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{isFarmerView ? o.consumer : o.farmerName || 'Farmer'}</strong>
                          <div className="small text-muted">
                            <i className="bi bi-geo-alt me-1 text-success" />
                            {isFarmerView
                              ? o.consumerLocation || 'Delivery requested'
                              : o.farmerLocation || 'Farm dispatch'}
                          </div>
                          {isFarmerView && o.consumerPhone && (
                            <div className="small text-muted font-monospace">
                              <i className="bi bi-telephone me-1" />
                              {o.consumerPhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="fw-semibold">
                          {o.quantity} {o.unit || 'kg'}
                        </span>
                      </td>
                      <td>
                        <strong className="text-success fs-6">₹{o.total}</strong>
                      </td>
                      <td>
                        <span className="small text-muted">{o.date}</span>
                      </td>
                      <td>
                        <span className={`badge ${getBadgeClass(o.status)} px-2 py-1`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex align-items-center gap-1">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setSelectedOrder(o)}
                            title="View full receipt & tracking"
                          >
                            <i className="bi bi-eye me-1" />
                            View
                          </button>

                          {/* Quick Actions for Farmer */}
                          {isSellerOfOrder && o.status === 'Pending' && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => update(o.id, 'Accepted')}
                                title="Accept customer's order"
                              >
                                <i className="bi bi-check-lg me-1" />
                                Accept
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => update(o.id, 'Rejected')}
                                title="Decline this order request"
                              >
                                <i className="bi bi-x-lg me-1" />
                                Reject
                              </button>
                            </>
                          )}

                          {isSellerOfOrder && o.status === 'Accepted' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => update(o.id, 'Completed')}
                              title="Mark order fulfilled & delivered"
                            >
                              <i className="bi bi-check2-circle me-1" />
                              Complete
                            </button>
                          )}

                          {/* Quick Action for Consumer */}
                          {!isSellerOfOrder && o.status === 'Pending' && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => update(o.id, 'Rejected')}
                              title="Cancel your order request"
                            >
                              <i className="bi bi-x me-1" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rich Custom Order Details Modal */}
      {selectedOrder && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            role="document"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-bottom bg-light">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <i className="bi bi-receipt-cutoff text-success fs-4" />
                  <span>Order Receipt & Tracking</span>
                  <span className="badge text-bg-secondary font-monospace ms-2">
                    #{selectedOrder.id}
                  </span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setSelectedOrder(null)}
                />
              </div>

              <div className="modal-body p-4">
                {/* Status Progress Stepper */}
                <div className="mb-4 p-3 bg-light rounded border">
                  <div className="d-flex justify-content-between align-items-center position-relative">
                    <div className="text-center flex-fill position-relative z-1">
                      <div className="badge rounded-circle p-2 bg-success text-white mb-1 shadow-sm">
                        <i className="bi bi-send-check fs-6" />
                      </div>
                      <div className="small fw-semibold">Requested</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{selectedOrder.date}</div>
                    </div>

                    <div className="text-center flex-fill position-relative z-1">
                      <div
                        className={`badge rounded-circle p-2 mb-1 shadow-sm ${
                          selectedOrder.status === 'Accepted' || selectedOrder.status === 'Completed'
                            ? 'bg-primary text-white'
                            : selectedOrder.status === 'Rejected'
                            ? 'bg-danger text-white'
                            : 'bg-secondary text-white'
                        }`}
                      >
                        <i
                          className={`bi ${
                            selectedOrder.status === 'Rejected'
                              ? 'bi-x-circle'
                              : 'bi-box-seam'
                          } fs-6`}
                        />
                      </div>
                      <div className="small fw-semibold">
                        {selectedOrder.status === 'Rejected' ? 'Declined' : 'Confirmed'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {selectedOrder.status === 'Pending' ? 'Awaiting farmer' : 'Ready'}
                      </div>
                    </div>

                    <div className="text-center flex-fill position-relative z-1">
                      <div
                        className={`badge rounded-circle p-2 mb-1 shadow-sm ${
                          selectedOrder.status === 'Completed'
                            ? 'bg-success text-white'
                            : 'bg-secondary text-white'
                        }`}
                      >
                        <i className="bi bi-check2-all fs-6" />
                      </div>
                      <div className="small fw-semibold">Delivered</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {selectedOrder.status === 'Completed' ? 'Completed' : 'Pending dispatch'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-4">
                  {/* Crop Summary */}
                  <div className="col-md-6">
                    <h6 className="text-muted text-uppercase fw-bold small mb-3">Crop Summary</h6>
                    <div className="card p-3 border h-100 bg-white">
                      <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                        {selectedOrder.imageUrl ? (
                          <img
                            src={selectedOrder.imageUrl}
                            alt=""
                            width="60"
                            height="60"
                            className="rounded object-fit-cover shadow-sm"
                          />
                        ) : (
                          <div className="p-3 bg-success-subtle text-success rounded">
                            <i className="bi bi-flower1 fs-3" />
                          </div>
                        )}
                        <div>
                          <h5 className="mb-0">{selectedOrder.productName}</h5>
                          <span className="badge text-bg-light border text-muted">
                            {selectedOrder.quantity} {selectedOrder.unit || 'units'} ordered
                          </span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Unit Rate:</span>
                        <strong>
                          ₹{selectedOrder.price || Math.round(selectedOrder.total / (selectedOrder.quantity || 1))} / {selectedOrder.unit || 'kg'}
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Quantity:</span>
                        <span>{selectedOrder.quantity} {selectedOrder.unit || 'kg'}</span>
                      </div>
                      <div className="d-flex justify-content-between pt-2 border-top">
                        <span className="fw-bold">Total Order Value:</span>
                        <strong className="text-success fs-5">₹{selectedOrder.total}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Parties & Logistics Information */}
                  <div className="col-md-6">
                    <h6 className="text-muted text-uppercase fw-bold small mb-3">Parties & Delivery</h6>
                    <div className="card p-3 border h-100 bg-white">
                      <div className="mb-3">
                        <small className="text-muted d-block">Buyer Information:</small>
                        <strong>{selectedOrder.consumer || 'Customer'}</strong>
                        {selectedOrder.consumerEmail && (
                          <div className="small text-muted">{selectedOrder.consumerEmail}</div>
                        )}
                        {selectedOrder.consumerPhone && (
                          <div className="small text-muted font-monospace">
                            <i className="bi bi-telephone me-1" />
                            {selectedOrder.consumerPhone}
                          </div>
                        )}
                        <div className="small text-muted mt-1">
                          <i className="bi bi-geo-alt me-1 text-success" />
                          {selectedOrder.consumerLocation || 'Delivery location not specified'}
                        </div>
                      </div>

                      <hr className="my-2" />

                      <div>
                        <small className="text-muted d-block">Farmer / Producer:</small>
                        <strong>{selectedOrder.farmerName || 'Farmer'}</strong>
                        <div className="small text-muted">
                          <i className="bi bi-geo-alt me-1 text-success" />
                          {selectedOrder.farmerLocation || 'Local Farm'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-light border mt-4 mb-0 small">
                  <i className="bi bi-info-circle text-success me-2" />
                  {selectedOrder.status === 'Pending' &&
                    'This order request is currently awaiting review and acceptance by the farmer.'}
                  {selectedOrder.status === 'Accepted' &&
                    'Order is confirmed! Produce is currently being packed for transit and delivery.'}
                  {selectedOrder.status === 'Completed' &&
                    'This order has been completed, delivered, and settled.'}
                  {selectedOrder.status === 'Rejected' &&
                    'This order request was declined.'}
                </div>
              </div>

              <div className="modal-footer border-top d-flex justify-content-between bg-light">
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={() => handleOrderMessage(selectedOrder)}
                >
                  <i className="bi bi-chat-dots me-1" />
                  Message {checkIsFarmer(selectedOrder) ? 'Buyer' : 'Farmer'}
                </button>

                <div className="d-flex gap-2">
                  {/* Farmer controls */}
                  {checkIsFarmer(selectedOrder) && selectedOrder.status === 'Pending' && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => update(selectedOrder.id, 'Accepted')}
                      >
                        <i className="bi bi-check-lg me-1" />
                        Accept Order
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => update(selectedOrder.id, 'Rejected')}
                      >
                        <i className="bi bi-x-lg me-1" />
                        Decline Order
                      </button>
                    </>
                  )}

                  {checkIsFarmer(selectedOrder) && selectedOrder.status === 'Accepted' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => update(selectedOrder.id, 'Completed')}
                    >
                      <i className="bi bi-check2-circle me-1" />
                      Mark as Delivered
                    </button>
                  )}

                  {/* Consumer cancel */}
                  {!checkIsFarmer(selectedOrder) && selectedOrder.status === 'Pending' && (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => update(selectedOrder.id, 'Rejected')}
                    >
                      <i className="bi bi-x me-1" />
                      Cancel Order Request
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
