import { Link } from 'react-router-dom'

export default function About() {
  return <section className="container py-5">
    <div className="row justify-content-center">
      <div className="col-lg-9 text-center">
        <p className="section-label">About KrishiAI</p>
        <h1 className="display-5 fw-bold">Better connections for every harvest.</h1>
        <p className="lead text-muted mt-3">KrishiAI is a farmer-to-consumer marketplace designed to make local agricultural trade clearer, fairer, and more informed.</p>
      </div>
    </div>
    <div className="row g-4 mt-4">
      <div className="col-md-4"><article className="card h-100 p-4"><i className="bi bi-people fs-2 text-success"/><h2 className="h4 mt-3">Direct connection</h2><p className="text-muted mb-0">Farmers can show what they grow, while consumers discover fresh produce and connect with the people behind it.</p></article></div>
      <div className="col-md-4"><article className="card h-100 p-4"><i className="bi bi-lightbulb fs-2 text-success"/><h2 className="h4 mt-3">Useful intelligence</h2><p className="text-muted mb-0">Practical AI support helps farmers prepare listings, explore price trends, and understand crop-image predictions.</p></article></div>
      <div className="col-md-4"><article className="card h-100 p-4"><i className="bi bi-shield-check fs-2 text-success"/><h2 className="h4 mt-3">Transparent trade</h2><p className="text-muted mb-0">Clear product details, straightforward requests, and direct communication make every transaction easier to understand.</p></article></div>
    </div>
    <div className="card p-4 p-md-5 mt-5 text-center">
      <h2 className="h3">Our mission</h2>
      <p className="mb-4 text-muted">To help agricultural communities grow through fairer access to markets and approachable technology.</p>
      <div><Link className="btn btn-success me-2" to="/marketplace">Explore marketplace</Link><Link className="btn btn-outline-success" to="/register">Join KrishiAI</Link></div>
    </div>
  </section>
}
