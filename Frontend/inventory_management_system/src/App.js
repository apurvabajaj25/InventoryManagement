import './App.css';
import Home from './components/Home';
import Navbar from './components/Navbar';
import Products from './components/Products';
import InsertProduct from './components/InsertProduct'
import UpdateProduct from './components/UpdateProduct';
import About from './components/About';
import StockDashboard from './components/StockDashboard';
import StockManagement from './components/StockManagement';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <ProtectedRoute>
          <Navbar title="IMS" about="About"></Navbar>
          
          <Router>
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/insertproduct" element={<InsertProduct />} />
              <Route path="/updateproduct/:id" element={<UpdateProduct />} />
              <Route path="/stock-dashboard" element={<StockDashboard />} />
              <Route path="/stock-management/:productId" element={<StockManagement />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </Router>
        </ProtectedRoute>
      </div>
    </AuthProvider>
  );
}

export default App;
