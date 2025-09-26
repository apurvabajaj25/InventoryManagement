import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import './Products.css'

export default function Products() {

    useEffect(() => {
        getProducts();
    }, [])

    const [productData, setProductData] = useState([]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('auth-token');
        return {
            "Content-Type": "application/json",
            "auth-token": token
        };
    };

    const getProducts = async (e) => {

        try {
            const res = await fetch("http://localhost:3001/products", {
                method: "GET",
                headers: getAuthHeaders()
            });

            const data = await res.json();

            if (res.status === 201) {
                console.log("Data Retrieved.");
                setProductData(data);
            }
            else {
                console.log("Something went wrong. Please try again.");
            }
        } catch (err) {
            console.log(err);
        }
    }

    const deleteProduct = async (id) => {

        const response = await fetch(`http://localhost:3001/deleteproduct/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        const deletedata = await response.json();
        console.log(deletedata);

        if (response.status === 422 || !deletedata) {
            console.log("Error");
        } else {
            console.log("Product deleted");
            getProducts();
        }

    }

    const initializeStock = async () => {
        try {
            const response = await fetch("http://localhost:3001/initialize-stock", {
                method: "POST",
                headers: getAuthHeaders()
            });

            const data = await response.json();
            
            if (response.status === 200) {
                console.log("Stock initialized:", data);
                alert(`Stock initialized for ${data.updatedCount} products!`);
                getProducts(); // Refresh the product list
            } else {
                console.log("Failed to initialize stock");
                alert("Failed to initialize stock. Please try again.");
            }
        } catch (err) {
            console.log(err);
            alert("Error initializing stock. Please try again.");
        }
    };

    const initializeLocations = async () => {
        try {
            const response = await fetch("http://localhost:3001/initialize-locations", {
                method: "POST",
                headers: getAuthHeaders()
            });

            const data = await response.json();
            
            if (response.status === 200) {
                console.log("Locations initialized:", data);
                alert(`${data.message}`);
            } else {
                console.log("Failed to initialize locations");
                alert("Failed to initialize locations. Please try again.");
            }
        } catch (err) {
            console.log(err);
            alert("Error initializing locations. Please try again.");
        }
    };

    const getStockStatusBadge = (product) => {
        const totalStock = product.totalStock || 0;
        if (totalStock === 0) {
            return <span className="stock-badge out-of-stock">Out of Stock</span>;
        } else if (product.isLowStock) {
            return <span className="stock-badge low-stock">Low Stock</span>;
        } else {
            return <span className="stock-badge in-stock">In Stock</span>;
        }
    };

    return (
        <>
            <div className='container-fluid p-5'>
                <div className="products-header">
                    <h1>Products Inventory</h1>
                    <div className="header-actions">
                        <button 
                            onClick={initializeLocations} 
                            className='btn btn-success me-2'
                            title="Initialize default locations (warehouse, store, outlet)"
                        >
                            🏪 Setup Locations
                        </button>
                        <button 
                            onClick={initializeStock} 
                            className='btn btn-warning me-2'
                            title="Initialize stock for existing products"
                        >
                            🔄 Initialize Stock
                        </button>
                        <NavLink to="/stock-dashboard" className='btn btn-info me-3'>
                            📊 Stock Dashboard
                        </NavLink>
                        <NavLink to="/insertproduct" className='btn btn-primary'>
                            + Add New Product
                        </NavLink>
                    </div>
                </div>
                
                <div className="overflow-auto mt-3" style={{ maxHeight: "38rem" }}>
                    <table className="table table-striped table-hover mt-3 fs-5">
                        <thead>
                            <tr className="tr_color">
                                <th scope="col">#</th>
                                <th scope="col">Product Name</th>
                                <th scope="col">Price</th>
                                <th scope="col">Barcode</th>
                                <th scope="col">Stock Status</th>
                                <th scope="col">Total Stock</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                productData.map((element, id) => {
                                    return (
                                        <tr key={element._id}>
                                            <th scope="row">{id + 1}</th>
                                            <td>{element.ProductName}</td>
                                            <td>${element.ProductPrice}</td>
                                            <td>{element.ProductBarcode}</td>
                                            <td>{getStockStatusBadge(element)}</td>
                                            <td>
                                                <span className="total-stock">
                                                    {element.totalStock || 0} units
                                                </span>
                                                {element.isLowStock && (
                                                    <div className="low-stock-warning">
                                                        ⚠️ Needs Restocking
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <NavLink 
                                                        to={`/stock-management/${element._id}`} 
                                                        className="btn btn-success btn-sm me-2"
                                                        title="Manage Stock"
                                                    >
                                                        📦
                                                    </NavLink>
                                                    <NavLink 
                                                        to={`/updateproduct/${element._id}`} 
                                                        className="btn btn-primary btn-sm me-2"
                                                        title="Edit Product"
                                                    >
                                                        <i className="fa-solid fa-pen-to-square"></i>
                                                    </NavLink>
                                                    <button 
                                                        className="btn btn-danger btn-sm" 
                                                        onClick={() => deleteProduct(element._id)}
                                                        title="Delete Product"
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
