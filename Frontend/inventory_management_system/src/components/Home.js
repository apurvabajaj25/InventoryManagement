import React from 'react'

export default function Home() {
  return (
    <div className='container-fluid p-5'>
      <div className="row">
        <div className="col-12 text-center mb-5">
          <h1 className="display-4 text-primary">Welcome to Inventory Management System</h1>
          <p className="lead">Manage your products, track stock levels, and monitor inventory across multiple locations.</p>
        </div>
      </div>
      
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="fas fa-boxes fa-3x text-primary"></i>
              </div>
              <h5 className="card-title">Manage Products</h5>
              <p className="card-text">Add, update, and delete products in your inventory.</p>
              <a href="/products" className="btn btn-primary">View Products</a>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="fas fa-chart-bar fa-3x text-success"></i>
              </div>
              <h5 className="card-title">Stock Dashboard</h5>
              <p className="card-text">Monitor stock levels, alerts, and inventory movements in real-time.</p>
              <a href="/stock-dashboard" className="btn btn-success">View Dashboard</a>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="fas fa-plus-circle fa-3x text-info"></i>
              </div>
              <h5 className="card-title">Add New Product</h5>
              <p className="card-text">Quickly add new products to your inventory system.</p>
              <a href="/insertproduct" className="btn btn-info">Add Product</a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-5">
        <div className="col-12">
          <div className="card bg-light">
            <div className="card-body">
              <h5 className="card-title">Key Features</h5>
              <div className="row">
                <div className="col-md-3">
                  <ul className="list-unstyled">
                    <li><i className="fas fa-check text-success"></i> Real-time Stock Tracking</li>
                    <li><i className="fas fa-check text-success"></i> Low Stock Alerts</li>
                  </ul>
                </div>
                <div className="col-md-3">
                  <ul className="list-unstyled">
                    <li><i className="fas fa-check text-success"></i> Multi-location Support</li>
                    <li><i className="fas fa-check text-success"></i> Stock Movement History</li>
                  </ul>
                </div>
                <div className="col-md-3">
                  <ul className="list-unstyled">
                    <li><i className="fas fa-check text-success"></i> Damaged Item Tracking</li>
                    <li><i className="fas fa-check text-success"></i> Return Processing</li>
                  </ul>
                </div>
                <div className="col-md-3">
                  <ul className="list-unstyled">
                    <li><i className="fas fa-check text-success"></i> User Authentication</li>
                    <li><i className="fas fa-check text-success"></i> Secure Access</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
