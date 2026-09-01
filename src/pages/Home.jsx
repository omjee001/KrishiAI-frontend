import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { getProducts } from '../services/productService'

const Feature = ({ icon, title, children }) => (
  <div className="col-md-4">
    <div className="card h-100 p-4">
      <i className={`bi ${icon} fs-2 text-success`} />
      <h4 className="mt-3">{title}</h4>
      <p className="text-muted mb-0">{children}</p>
    </div>
  </div>
)

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])

  useEffect(() => {
    getProducts().then(all => {
      setFeaturedProducts(all.slice(0, 3))
    })
  }, [])

  return (
    <>
      <section className="hero text-white d-flex align-items-center">
        <div className="container py-5">
          <div className="col-lg-7">
            <p className="section-label text-white-50">Smarter agriculture, direct trade</p>
            <h1 className="display-3 fw-bold">
              Connect Directly.
              <br />
              Sell Smarter. Grow Better.
            </h1>
            <p className="lead my-4">
              KrishiAI brings farmers and consumers together, with practical AI tools for listings, pricing and crop health.
            </p>
            <Link className="btn btn-light btn-lg me-2" to="/marketplace">
              Explore marketplace
            </Link>
            <Link className="btn btn-outline-light btn-lg" to="/register">
              Join KrishiAI
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <p className="section-label">What makes it better</p>
        <h2 className="mb-4">Tools made for the farm and the market</h2>
        <div className="row g-4">
          <Feature icon="bi-magic" title="Smart Listing">
            Turn crop details into a clearer title, description, category and price suggestion—always editable before you publish.
          </Feature>
          <Feature icon="bi-graph-up-arrow" title="Price Prediction">
            Explore AI-based crop price forecasts with trend and confidence indicators.
          </Feature>
          <Feature icon="bi-virus" title="Disease Detection">
            Upload a crop image to receive an AI prediction and a careful next-step recommendation.
          </Feature>
        </div>
      </section>

      <section className="bg-white py-5">
        <div className="container">
          <p className="section-label">Fresh from farms</p>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Featured products</h2>
            <Link className="text-success" to="/marketplace">
              See all products <i className="bi bi-arrow-right" />
            </Link>
          </div>
          <div className="row g-4">
            {featuredProducts.length === 0 ? (
              <div className="col-12 text-center py-4 text-muted">
                <p className="mb-2">No crops listed yet. Be the first farmer to list your fresh harvest!</p>
                <Link className="btn btn-outline-success btn-sm" to="/marketplace">
                  Visit Marketplace
                </Link>
              </div>
            ) : (
              featuredProducts.map(p => (
                <div className="col-md-6 col-lg-4" key={p.id}>
                  <ProductCard product={p} />
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      <section id="about" className="container py-5">
        <div className="row g-5 align-items-center">
          <div className="col-lg-6">
            <p className="section-label">How it works</p>
            <h2>From harvest to home, with fewer barriers.</h2>
            <div className="d-flex gap-3 mt-4">
              {['1 Farmer creates listing', '2 AI assists', '3 Consumer discovers', '4 Connect & order'].map(x => (
                <span key={x} className="badge rounded-pill text-bg-success p-2">
                  {x}
                </span>
              ))}
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card p-4">
              <h4>For farmers</h4>
              <p className="mb-1">Direct market access · Better visibility · Market insights · Sales analytics</p>
              <hr />
              <h4>For consumers</h4>
              <p className="mb-0">Fresh produce · Direct connections · Transparent product information · Easy discovery</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

