import api from './api'
import { orders as initialOrders } from '../data/mockData'

const mock = import.meta.env.VITE_USE_MOCK_API !== 'false'
const STORAGE_KEY = 'krishi_orders'
const pause = v => new Promise(r => setTimeout(() => r(v), 100))

let activeOrdersCache = null

const getStoredOrders = () => {
  if (activeOrdersCache && Array.isArray(activeOrdersCache) && activeOrdersCache.length > 0) {
    return activeOrdersCache
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        activeOrdersCache = parsed
        return parsed
      }
    }
  } catch (e) {
    console.warn('Unable to read orders from localStorage:', e)
  }

  activeOrdersCache = [...initialOrders]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialOrders))
  } catch (e) {
    console.warn('Unable to write initial orders to localStorage:', e)
  }
  return activeOrdersCache
}

const setStoredOrders = list => {
  activeOrdersCache = [...list]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.warn('Unable to write orders to localStorage:', e)
  }
}

export const getOrders = () => {
  if (mock) {
    return pause(getStoredOrders())
  }
  return api.get('/orders').then(r => r.data)
}

export const updateOrderStatus = (id, status) => {
  if (mock) {
    const list = getStoredOrders()
    const updatedList = list.map(item =>
      String(item.id) === String(id) ? { ...item, status } : item
    )
    setStoredOrders(updatedList)
    return pause({ id, status })
  }
  return api.patch(`/orders/${id}`, { status }).then(r => r.data)
}

export const createOrder = orderData => {
  if (mock) {
    const list = getStoredOrders()
    const newOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      productName: orderData.productName || 'Agricultural Produce',
      consumer: orderData.consumer || 'Customer',
      quantity: Number(orderData.quantity) || 1,
      total: Number(orderData.total) || 100,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      farmerName: orderData.farmerName || 'Farmer',
      ...orderData
    }
    const updatedList = [newOrder, ...list]
    setStoredOrders(updatedList)
    return pause(newOrder)
  }
  return api.post('/orders', orderData).then(r => r.data)
}
