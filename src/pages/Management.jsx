import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { deleteProduct, getProducts } from '../services/productService'
import { getStoredUsers } from '../services/authService'

export default function Management({ type, admin }) {
  const { user } = useContext(AuthContext)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (type === 'products') {
      setLoading(true)
      getProducts()
        .then(allProducts => {
          if (admin) {
            setItems(allProducts || [])
          } else if (user) {
            const userName = (user.name || '').trim().toLowerCase()
            const userEmail = (user.email || '').trim().toLowerCase()
            const myProducts = (allProducts || []).filter(p => {
              const pFarmer = (p.farmerName || '').trim().toLowerCase()
              const pFarmerEmail = (p.farmerEmail || '').trim().toLowerCase()
              return (pFarmer && pFarmer === userName) || (pFarmerEmail && pFarmerEmail === userEmail)
            })
            setItems(myProducts)
          } else {
            setItems([])
          }
        })
        .finally(() => setLoading(false))
    } else {
      setItems(getStoredUsers() || [])
      setLoading(false)
    }
  }, [type, admin, user])



  const remove = async id => {
    if (confirm('Are you sure you want to remove this item?')) {
      if (type === 'products') {
        await deleteProduct(id)
      }
      setItems(items.filter(x => (x.id || x.email) !== id))
    }
  }

  return (
    <section className="container py-5">
      <p className="section-label">{admin ? 'Administration' : 'Farmer workspace'}</p>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">{type === 'users' ? 'Manage users' : 'My products'}</h1>
        {!admin && type === 'products' && (
          <Link className="btn btn-success" to="/farmer/products/new">
            <i className="bi bi-plus-lg me-1" />
            Add product
          </Link>
        )}
      </div>

      <div className="card p-3 mt-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" />
            <p className="mt-2 text-muted">Loading items…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox fs-1 text-muted" />
            <h4 className="mt-3">No products found</h4>
            <p className="text-muted">You haven't listed any crops yet.</p>
            {!admin && type === 'products' && (
              <Link className="btn btn-success btn-sm mt-2" to="/farmer/products/new">
                <i className="bi bi-plus-lg me-1" />
                Add your first product
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  {type === 'users' ? (
                    <>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                    </>
                  ) : (
                    <>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Farmer / Location</th>
                    </>
                  )}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(x => (
                  <tr key={x.id || x.email}>
                    {type === 'users' ? (
                      <>
                        <td><strong>{x.name}</strong></td>
                        <td>{x.email}</td>
                        <td>{x.phone || '—'}</td>
                        <td>
                          <span className="badge text-bg-light">{x.role}</span>
                        </td>
                      </>
                    ) : (

                      <>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={x.imageUrl}
                              alt=""
                              width="44"
                              height="44"
                              className="rounded object-fit-cover shadow-sm"
                            />
                            <div>
                              <strong>{x.name}</strong>
                              <small className="d-block text-muted">Rating: {x.rating || '5.0'} ★</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge text-bg-light text-success">{x.category}</span>
                        </td>
                        <td>{x.quantity} {x.unit}</td>
                        <td className="text-success fw-bold">₹{x.price} <small className="text-muted">/{x.unit}</small></td>
                        <td><small className="text-muted">{x.farmerName || 'Farmer'} · {x.location}</small></td>
                      </>
                    )}
                    <td>
                      <span className="badge text-bg-success">{x.status || 'Available'}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        {type === 'products' && (
                          <Link
                            className="btn btn-outline-secondary btn-sm"
                            to={`/products/${x.id}`}
                            title="View in Marketplace"
                          >
                            <i className="bi bi-eye" />
                          </Link>
                        )}
                        {!admin && type === 'products' && (
                          <Link
                            className="btn btn-outline-success btn-sm"
                            to={`/farmer/products/${x.id}/edit`}
                            title="Edit product"
                          >
                            <i className="bi bi-pencil" />
                          </Link>
                        )}
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => remove(x.id || x.email)}
                          title="Delete item"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

