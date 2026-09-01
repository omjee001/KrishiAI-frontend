import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'; import Footer from './components/Footer'; import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'; import About from './pages/About'; import AuthPage from './pages/AuthPage'; import Products from './pages/Products'; import ProductDetails from './pages/ProductDetails'; import Dashboard from './pages/Dashboard'; import ProductForm from './pages/ProductForm'; import Orders from './pages/Orders'; import Messages from './pages/Messages'; import AITools from './pages/AITools'; import Management from './pages/Management'; import Profile from './pages/Profile'; import NotFound from './pages/NotFound'
const Secure=({roles,children})=><ProtectedRoute roles={roles}>{children}</ProtectedRoute>
export default function App(){return <AuthProvider><BrowserRouter><Navbar/><main className="min-vh-100"><Routes>
<Route path="/" element={<Home/>}/><Route path="/about" element={<About/>}/><Route path="/marketplace" element={<Products/>}/><Route path="/products/:id" element={<ProductDetails/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage register/>}/>
<Route path="/profile" element={<Secure roles={['FARMER', 'CONSUMER', 'ADMIN']}><Profile/></Secure>}/>
<Route path="/farmer/dashboard" element={<Secure roles={['FARMER']}><Dashboard role="farmer"/></Secure>}/>
<Route path="/farmer/products" element={<Secure roles={['FARMER', 'CONSUMER', 'ADMIN']}><Management type="products"/></Secure>}/>
<Route path="/farmer/products/new" element={<Secure roles={['FARMER', 'CONSUMER', 'ADMIN']}><ProductForm/></Secure>}/>
<Route path="/farmer/products/:id/edit" element={<Secure roles={['FARMER', 'CONSUMER', 'ADMIN']}><ProductForm/></Secure>}/>
<Route path="/farmer/orders" element={<Secure roles={['FARMER']}><Orders role="farmer"/></Secure>}/>
<Route path="/farmer/messages" element={<Secure roles={['FARMER', 'CONSUMER', 'ADMIN']}><Messages/></Secure>}/>
<Route path="/farmer/ai-tools" element={<Secure roles={['FARMER', 'CONSUMER', 'ADMIN']}><AITools/></Secure>}/>
<Route path="/farmer/analytics" element={<Secure roles={['FARMER']}><Dashboard role="analytics"/></Secure>}/>
<Route path="/consumer/dashboard" element={<Secure roles={['CONSUMER']}><Dashboard role="consumer"/></Secure>}/>
<Route path="/consumer/orders" element={<Secure roles={['CONSUMER']}><Orders role="consumer"/></Secure>}/>
<Route path="/consumer/messages" element={<Secure roles={['CONSUMER', 'FARMER', 'ADMIN']}><Messages/></Secure>}/>
<Route path="/admin/dashboard" element={<Secure roles={['ADMIN']}><Dashboard role="admin"/></Secure>}/><Route path="/admin/users" element={<Secure roles={['ADMIN']}><Management type="users"/></Secure>}/><Route path="/admin/products" element={<Secure roles={['ADMIN']}><Management type="products" admin/></Secure>}/><Route path="/admin/reports" element={<Secure roles={['ADMIN']}><Dashboard role="reports"/></Secure>}/><Route path="/dashboard" element={<Navigate to="/" replace/>}/><Route path="*" element={<NotFound/>}/>
</Routes></main><Footer/></BrowserRouter></AuthProvider>}

