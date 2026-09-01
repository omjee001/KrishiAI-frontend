import api from './api'
import { products as initialProducts } from '../data/mockData'

const mock = import.meta.env.VITE_USE_MOCK_API !== 'false'
const STORAGE_KEY = 'krishi_products'
const pause = v => new Promise(r => setTimeout(() => r(v), 100))

// Synchronized in-memory cache for ultra-reliable instant reads
let activeProductsCache = null

const demoProductIds = ['1', '2', '3', '4']

const getStoredProducts = () => {
  if (activeProductsCache && Array.isArray(activeProductsCache)) {
    return activeProductsCache
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // Strip out any hardcoded demo products
        const realProducts = parsed.filter(p => !demoProductIds.includes(String(p.id)))
        activeProductsCache = realProducts
        localStorage.setItem(STORAGE_KEY, JSON.stringify(realProducts))
        return realProducts
      }
    }
  } catch (e) {
    console.warn('Unable to read products from localStorage:', e)
  }

  activeProductsCache = []
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  } catch (e) {
    console.warn('Unable to initialize products in localStorage:', e)
  }
  return activeProductsCache
}


const setStoredProducts = list => {
  activeProductsCache = [...list]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.warn('Unable to write products to localStorage (storage full/disabled):', e)
  }
}

export const getProducts = () => {
  if (mock) {
    return pause(getStoredProducts())
  }
  return api.get('/products').then(r => r.data)
}

export const getProduct = id => {
  if (mock) {
    const list = getStoredProducts()
    const found = list.find(p => String(p.id) === String(id))
    return pause(found)
  }
  return api.get(`/products/${id}`).then(r => r.data)
}

const defaultImages = {
  Vegetables: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=700&q=80',
  Grains: 'https://images.unsplash.com/photo-1586208958839-06c17cacdf08?auto=format&fit=crop&w=700&q=80',
  Fruits: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=700&q=80',
  Spices: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=700&q=80'
}

export const saveProduct = data => {
  if (mock) {
    const list = getStoredProducts()
    const fallbackImage = defaultImages[data.category] || defaultImages.Vegetables
    const imageUrl = data.imageUrl || fallbackImage

    if (data.id) {
      // Edit existing product
      const updatedList = list.map(item =>
        String(item.id) === String(data.id)
          ? { ...item, ...data, imageUrl: data.imageUrl || item.imageUrl || fallbackImage }
          : item
      )
      setStoredProducts(updatedList)
      return pause({ ...data, imageUrl })
    } else {
      // Create new product
      const newProduct = {
        id: Date.now().toString(),
        name: data.name || 'Fresh Produce',
        category: data.category || 'Vegetables',
        description: data.description || 'Freshly harvested produce directly from the farm.',
        quantity: Number(data.quantity) || 10,
        unit: data.unit || 'kg',
        price: Number(data.price) || 50,
        location: data.location || 'Local Farm, India',
        farmerName: data.farmerName || 'Farmer',
        farmerEmail: data.farmerEmail || '',
        rating: 5.0,
        status: 'Available',
        imageUrl
      }
      const updatedList = [newProduct, ...list]
      setStoredProducts(updatedList)
      return pause(newProduct)
    }

  }
  if (data.id) {
    return api.put(`/products/${data.id}`, data).then(r => r.data)
  }
  return api.post('/products', data).then(r => r.data)
}

export const deleteProduct = id => {
  if (mock) {
    const list = getStoredProducts()
    const updatedList = list.filter(item => String(item.id) !== String(id))
    setStoredProducts(updatedList)
    return pause({ success: true })
  }
  return api.delete(`/products/${id}`).then(r => r.data)
}


