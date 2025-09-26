import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar(props) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div>
      <navBar className="navbar navbar-expand-lg bg-danger">
        <div className="container-fluid">
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link active text-white fs-4" aria-current="page" href="/">{props.title}</a>
              </li>
              <li className="nav-item">
                <a className="nav-link active text-white fs-4" aria-current="page" href="/products">Products</a>
              </li>
              <li className="nav-item">
                <a className="nav-link active text-white fs-4" aria-current="page" href="/stock-dashboard">Stock Dashboard</a>
              </li>
              <li className="nav-item">
                <a className="nav-link active text-white fs-4" aria-current="page" href="/about">About</a>
              </li>
            </ul>
            <div className="d-flex align-items-center">
              {user && (
                <>
                  <span className="text-white me-3">Welcome, {user.name}</span>
                  <button className="btn btn-outline-light" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </navBar>
    </div>
  )
}
