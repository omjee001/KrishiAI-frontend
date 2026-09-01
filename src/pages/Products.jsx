import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { getProducts } from '../services/productService'
import { citiesFor, countries, stateName, statesFor } from '../data/locations'

const initialFilters = { search: '', category: '', country: '', state: '', city: '', maxPrice: '', sort: 'recommended' }

export default function Products() {
  const [all, setAll] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getProducts().then(setAll).catch(() => setError('Unable to load products. Please try again.')).finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => [...new Set(all.map(product => product.category))], [all])
  const shown = useMemo(() => {
    const search = appliedFilters.search.trim().toLowerCase()
    const result = all.filter(product => {
      const matchesSearch =
        !search ||
        [product.name, product.location, product.farmerName, product.category].some(
          value => value && value.toLowerCase().includes(search)
        )
      const matchesCategory = !appliedFilters.category || product.category === appliedFilters.category
      const selectedState = stateName(appliedFilters.country, appliedFilters.state)
      const matchesCountry = !appliedFilters.country || appliedFilters.country === 'IN'
      const matchesState =
        !selectedState || (product.location && product.location.toLowerCase().includes(selectedState.toLowerCase()))
      const matchesCity =
        !appliedFilters.city || (product.location && product.location.toLowerCase().includes(appliedFilters.city.toLowerCase()))
      const matchesPrice = !appliedFilters.maxPrice || Number(product.price) <= Number(appliedFilters.maxPrice)
      return matchesSearch && matchesCategory && matchesCountry && matchesState && matchesCity && matchesPrice
    })
    if (appliedFilters.sort === 'price-low') return result.sort((a, b) => a.price - b.price)
    if (appliedFilters.sort === 'price-high') return result.sort((a, b) => b.price - a.price)
    if (appliedFilters.sort === 'rating') return result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
  }, [all, appliedFilters])

  const change = event => setFilters(current => ({ ...current, [event.target.name]: event.target.value }))
  const changeCountry = event => setFilters(current => ({ ...current, country: event.target.value, state: '', city: '' }))
  const changeState = event => setFilters(current => ({ ...current, state: event.target.value, city: '' }))
  const apply = event => { event.preventDefault(); setAppliedFilters(filters) }
  const clear = () => { setFilters(initialFilters); setAppliedFilters(initialFilters) }

  return (
    <section className="container py-5">
      <p className="section-label">Marketplace</p>
      <h1>Fresh from farmers</h1>
      <p className="text-muted">Find directly sourced agricultural products near you.</p>

    <form className="card p-3 mb-4" onSubmit={apply}>
      <div className="d-flex flex-nowrap gap-2 align-items-center overflow-auto pb-1">
        <div className="flex-grow-1" style={{ minWidth: 260 }}><label className="visually-hidden" htmlFor="product-search">Search products</label><input id="product-search" name="search" className="form-control" value={filters.search} onChange={change} placeholder="Search products, farmers, or location" /></div>
        <div style={{ minWidth: 155 }}><label className="visually-hidden" htmlFor="category">Category</label><select id="category" name="category" className="form-select" value={filters.category} onChange={change}><option value="">All categories</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></div>
        <div style={{ minWidth: 130 }}><label className="visually-hidden" htmlFor="country">Country</label><select id="country" className="form-select" value={filters.country} onChange={changeCountry}><option value="">Country</option>{countries.map(country => <option key={country.isoCode} value={country.isoCode}>{country.name}</option>)}</select></div>
        <div style={{ minWidth: 155 }}><label className="visually-hidden" htmlFor="state">State</label><select id="state" className="form-select" value={filters.state} onChange={changeState} disabled={!filters.country}><option value="">State</option>{statesFor(filters.country).map(state => <option key={state.isoCode} value={state.isoCode}>{state.name}</option>)}</select></div>
        <div style={{ minWidth: 145 }}><label className="visually-hidden" htmlFor="city">City</label><select id="city" name="city" className="form-select" value={filters.city} onChange={change} disabled={!filters.state}><option value="">City</option>{citiesFor(filters.country, filters.state).map(city => <option key={`${city.name}-${city.latitude}-${city.longitude}`} value={city.name}>{city.name}</option>)}</select></div>
        <div style={{ minWidth: 135 }}><label className="visually-hidden" htmlFor="price">Maximum price</label><select id="price" name="maxPrice" className="form-select" value={filters.maxPrice} onChange={change}><option value="">Any price</option><option value="50">Up to ₹50</option><option value="100">Up to ₹100</option><option value="150">Up to ₹150</option><option value="250">Up to ₹250</option></select></div>
        <div style={{ minWidth: 160 }}><label className="visually-hidden" htmlFor="sort">Sort products</label><select id="sort" name="sort" className="form-select" value={filters.sort} onChange={change}><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Highest rated</option></select></div>
        <button className="btn btn-success text-nowrap"><i className="bi bi-funnel me-1"/>Apply</button><button className="btn btn-link text-success text-nowrap" type="button" onClick={clear}>Clear</button>
      </div>
    </form>
    {loading ? (
      <div className="text-center py-5">
        <div className="spinner-border text-success" />
        <p className="mt-2">Loading products…</p>
      </div>
    ) : error ? (
      <div className="alert alert-danger">{error}</div>
    ) : shown.length ? (
      <div className="row g-4">
        {shown.map(product => (
          <div className="col-sm-6 col-lg-4 col-xl-3" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    ) : (
      <div className="card text-center p-5">
        <i className="bi bi-basket fs-1 text-success" />
        <h4>No products found</h4>
        <p className="text-muted mb-0">Try clearing filters or choose a different search.</p>
      </div>
    )}
  </section>
  )
}

