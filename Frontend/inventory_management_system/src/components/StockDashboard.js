import React, { useState, useEffect } from 'react';
import './StockDashboard.css';

const StockDashboard = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        unreadAlerts: 0,
        locations: 0,
        recentMovements: []
    });
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        fetchAlerts();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('auth-token');
            const response = await fetch('http://localhost:3001/dashboard/stats', {
                method: 'GET',
                headers: {
                    'auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem('auth-token');
            const response = await fetch('http://localhost:3001/alerts?unread=true', {
                method: 'GET',
                headers: {
                    'auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAlerts(data.slice(0, 5)); // Show only top 5 alerts
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    };

    const markAlertAsRead = async (alertId) => {
        try {
            const token = localStorage.getItem('auth-token');
            await fetch(`http://localhost:3001/alerts/${alertId}/read`, {
                method: 'PUT',
                headers: {
                    'auth-token': token,
                    'Content-Type': 'application/json'
                }
            });
            
            // Remove the alert from the list or mark it as read
            setAlerts(alerts.filter(alert => alert._id !== alertId));
        } catch (error) {
            console.error('Error marking alert as read:', error);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return '#dc3545';
            case 'high': return '#fd7e14';
            case 'medium': return '#ffc107';
            case 'low': return '#20c997';
            default: return '#6c757d';
        }
    };

    const getMovementIcon = (type) => {
        switch (type) {
            case 'inbound': return '📈';
            case 'outbound': return '📉';
            case 'transfer': return '🔄';
            case 'damaged': return '⚠️';
            case 'returned': return '↩️';
            case 'adjustment': return '⚖️';
            default: return '📦';
        }
    };

    if (loading) {
        return (
            <div className="stock-dashboard">
                <div className="loading-spinner">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="stock-dashboard">
            <div className="dashboard-header">
                <h1>Stock Management Dashboard</h1>
                <p>Real-time inventory overview and alerts</p>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card total-products">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                        <h3>{stats.totalProducts}</h3>
                        <p>Total Products</p>
                    </div>
                </div>

                <div className="stat-card low-stock">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <h3>{stats.lowStockProducts}</h3>
                        <p>Low Stock Items</p>
                    </div>
                </div>

                <div className="stat-card out-of-stock">
                    <div className="stat-icon">🚫</div>
                    <div className="stat-info">
                        <h3>{stats.outOfStockProducts}</h3>
                        <p>Out of Stock</p>
                    </div>
                </div>

                <div className="stat-card alerts">
                    <div className="stat-icon">🔔</div>
                    <div className="stat-info">
                        <h3>{stats.unreadAlerts}</h3>
                        <p>Unread Alerts</p>
                    </div>
                </div>

                <div className="stat-card locations">
                    <div className="stat-icon">🏢</div>
                    <div className="stat-info">
                        <h3>{stats.locations}</h3>
                        <p>Active Locations</p>
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <div className="alerts-section">
                    <h2>Recent Alerts</h2>
                    <div className="alerts-list">
                        {alerts.map(alert => (
                            <div key={alert._id} className={`alert-item severity-${alert.severity}`}>
                                <div className="alert-content">
                                    <div className="alert-header">
                                        <span className="alert-type">{alert.alertType.replace('_', ' ').toUpperCase()}</span>
                                        <span 
                                            className="severity-badge" 
                                            style={{ backgroundColor: getSeverityColor(alert.severity) }}
                                        >
                                            {alert.severity}
                                        </span>
                                    </div>
                                    <p className="alert-message">{alert.message}</p>
                                    <div className="alert-details">
                                        <span>Location: {alert.location}</span>
                                        <span>Current: {alert.currentQuantity}</span>
                                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button 
                                    className="mark-read-btn"
                                    onClick={() => markAlertAsRead(alert._id)}
                                >
                                    ✓
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Movements */}
            <div className="movements-section">
                <h2>Recent Stock Movements</h2>
                <div className="movements-list">
                    {stats.recentMovements.map((movement, index) => (
                        <div key={index} className="movement-item">
                            <div className="movement-icon">
                                {getMovementIcon(movement.movement.type)}
                            </div>
                            <div className="movement-details">
                                <div className="movement-header">
                                    <strong>{movement.ProductName}</strong>
                                    <span className={`movement-type ${movement.movement.type}`}>
                                        {movement.movement.type.toUpperCase()}
                                    </span>
                                </div>
                                <div className="movement-info">
                                    <span>Quantity: {movement.movement.quantity}</span>
                                    <span>Location: {movement.movement.location}</span>
                                    <span>By: {movement.user}</span>
                                    <span>{new Date(movement.movement.date).toLocaleDateString()}</span>
                                </div>
                                {movement.movement.reason && (
                                    <p className="movement-reason">Reason: {movement.movement.reason}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StockDashboard;