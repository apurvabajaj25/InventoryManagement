const mongoose = require('mongoose');

// Stock movement schema for tracking all stock changes
const StockMovementSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['inbound', 'outbound', 'transfer', 'adjustment', 'damaged', 'returned'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    reason: String,
    reference: String, // Order ID, Transfer ID, etc.
    date: {
        type: Date,
        default: Date.now
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
});

// Location stock schema for multi-location tracking
const LocationStockSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    reservedQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    damagedQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    minStockLevel: {
        type: Number,
        default: 10
    },
    maxStockLevel: {
        type: Number,
        default: 1000
    }
});

const ProductSchema = new mongoose.Schema({
    ProductName: {
        type: String,
        required: true,
    },
    ProductPrice: {
        type: Number,
        required: true,
    },
    ProductBarcode: {
        type: Number,
        required: true,
        unique: true
    },
    ProductDescription: {
        type: String,
        default: ''
    },
    ProductCategory: {
        type: String,
        default: 'General'
    },
    ProductBrand: {
        type: String,
        default: ''
    },
    // Stock tracking fields
    totalStock: {
        type: Number,
        default: 0,
        min: 0
    },
    globalMinStock: {
        type: Number,
        default: 10
    },
    globalMaxStock: {
        type: Number,
        default: 1000
    },
    locationStock: [LocationStockSchema],
    stockMovements: [StockMovementSchema],
    // Status fields
    isActive: {
        type: Boolean,
        default: true
    },
    isLowStock: {
        type: Boolean,
        default: false
    },
    lastStockUpdate: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to calculate total stock and low stock status
ProductSchema.pre('save', function(next) {
    // Calculate total stock from all locations
    this.totalStock = this.locationStock.reduce((total, location) => {
        return total + location.quantity;
    }, 0);
    
    // Check if any location has low stock or if global stock is low
    this.isLowStock = this.totalStock <= this.globalMinStock || 
        this.locationStock.some(location => location.quantity <= location.minStockLevel);
    
    this.updatedAt = new Date();
    next();
});

// Instance methods
ProductSchema.methods.addStock = function(location, quantity, userId, reason = '', reference = '') {
    // Add stock movement
    this.stockMovements.push({
        type: 'inbound',
        quantity: quantity,
        location: location,
        reason: reason,
        reference: reference,
        performedBy: userId
    });
    
    // Update location stock
    let locationStock = this.locationStock.find(loc => loc.location === location);
    if (!locationStock) {
        locationStock = {
            location: location,
            quantity: quantity,
            reservedQuantity: 0,
            damagedQuantity: 0,
            minStockLevel: 10,
            maxStockLevel: 1000
        };
        this.locationStock.push(locationStock);
    } else {
        locationStock.quantity += quantity;
    }
    
    this.lastStockUpdate = new Date();
};

ProductSchema.methods.removeStock = function(location, quantity, userId, reason = '', reference = '') {
    let locationStock = this.locationStock.find(loc => loc.location === location);
    if (!locationStock || locationStock.quantity < quantity) {
        throw new Error('Insufficient stock at location: ' + location);
    }
    
    // Add stock movement
    this.stockMovements.push({
        type: 'outbound',
        quantity: quantity,
        location: location,
        reason: reason,
        reference: reference,
        performedBy: userId
    });
    
    // Update location stock
    locationStock.quantity -= quantity;
    this.lastStockUpdate = new Date();
};

ProductSchema.methods.markDamaged = function(location, quantity, userId, reason = '') {
    let locationStock = this.locationStock.find(loc => loc.location === location);
    if (!locationStock || locationStock.quantity < quantity) {
        throw new Error('Insufficient stock at location to mark as damaged: ' + location);
    }
    
    // Add stock movement
    this.stockMovements.push({
        type: 'damaged',
        quantity: quantity,
        location: location,
        reason: reason,
        performedBy: userId
    });
    
    // Update location stock
    locationStock.quantity -= quantity;
    locationStock.damagedQuantity += quantity;
    this.lastStockUpdate = new Date();
};

ProductSchema.methods.processReturn = function(location, quantity, userId, reason = '') {
    // Add stock movement
    this.stockMovements.push({
        type: 'returned',
        quantity: quantity,
        location: location,
        reason: reason,
        performedBy: userId
    });
    
    // Update location stock
    let locationStock = this.locationStock.find(loc => loc.location === location);
    if (!locationStock) {
        locationStock = {
            location: location,
            quantity: quantity,
            reservedQuantity: 0,
            damagedQuantity: 0,
            minStockLevel: 10,
            maxStockLevel: 1000
        };
        this.locationStock.push(locationStock);
    } else {
        locationStock.quantity += quantity;
    }
    
    this.lastStockUpdate = new Date();
};

// Calculate total stock across all locations
ProductSchema.methods.calculateTotalStock = function() {
    this.totalStock = this.locationStock.reduce((total, location) => {
        return total + location.quantity;
    }, 0);
    
    // Update low stock status
    this.isLowStock = this.totalStock <= this.globalMinStock;
    
    return this.totalStock;
};

const Products = mongoose.model("Products", ProductSchema);
module.exports = Products;
