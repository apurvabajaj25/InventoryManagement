const express = require('express');
const router = express.Router();
const products = require('../Models/Products');
const User = require('../Models/User');
const Location = require('../Models/Location');
const StockAlert = require('../Models/StockAlert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = 'your_jwt_secret_key_here'; // In production, use environment variables

// ROUTE 1: Create a User using: POST "/api/auth/createuser". No login required
router.post('/createuser', [
    body('name', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be at least 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    let success = false;
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }
    try {
        // Check whether the user with this email exists already
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ success, error: "Sorry a user with this email already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);

        // Create a new user
        user = await User.create({
            name: req.body.name,
            password: secPass,
            email: req.body.email,
        });
        const data = {
            user: {
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authtoken });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// ROUTE 2: Authenticate a User using: POST "/api/auth/login". No login required
router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
], async (req, res) => {
    let success = false;
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success, error: "Please try to login with correct credentials" });
        }

        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            return res.status(400).json({ success, error: "Please try to login with correct credentials" });
        }

        const data = {
            user: {
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authtoken });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// ROUTE 3: Get logged in User Details using: POST "/api/auth/getuser". Login required
router.post('/getuser', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        res.send(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

//Inserting(Creating) Data: (Protected Route)
router.post("/insertproduct", fetchuser, async (req, res) => {
    const { ProductName, ProductPrice, ProductBarcode } = req.body;

    try {
        const pre = await products.findOne({ ProductBarcode: ProductBarcode })
        console.log(pre);

        if (pre) {
            res.status(422).json("Product is already added.")
        }
        else {
            const addProduct = new products({ 
                ProductName, 
                ProductPrice, 
                ProductBarcode,
                totalStock: 50, // Initialize with some stock for demo
                globalMinStock: 10,
                globalMaxStock: 1000,
                locationStock: [{
                    location: 'Main Warehouse',
                    quantity: 50,
                    reservedQuantity: 0,
                    damagedQuantity: 0,
                    minStockLevel: 10,
                    maxStockLevel: 500
                }]
            });

            await addProduct.save();
            await addProduct.calculateTotalStock();
            await addProduct.save();
            
            res.status(201).json(addProduct)
            console.log(addProduct)
        }
    }
    catch (err) {
        console.log(err)
    }
})

//Getting(Reading) Data: (Protected Route)
router.get('/products', fetchuser, async (req, res) => {

    try {
        const getProducts = await products.find({});
        
        // Calculate stock data for each product
        const productsWithStock = await Promise.all(getProducts.map(async (product) => {
            await product.calculateTotalStock();
            await product.save();
            
            const totalStock = product.totalStock || 0;
            const isLowStock = totalStock <= product.globalMinStock;
            const isOutOfStock = totalStock === 0;
            
            return {
                ...product.toJSON(),
                totalStock,
                isLowStock,
                isOutOfStock,
                stockStatus: isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'
            };
        }));
        
        console.log('Products with stock data:', productsWithStock);
        res.status(201).json(productsWithStock);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
})

//Getting(Reading) individual Data: (Protected Route)
router.get('/products/:id', fetchuser, async (req, res) => {

    try {
        const getProduct = await products.findById(req.params.id);
        if (!getProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        await getProduct.calculateTotalStock();
        await getProduct.save();
        
        const totalStock = getProduct.totalStock || 0;
        const isLowStock = totalStock <= getProduct.globalMinStock;
        const isOutOfStock = totalStock === 0;
        
        const productWithStock = {
            ...getProduct.toJSON(),
            totalStock,
            isLowStock,
            isOutOfStock,
            stockStatus: isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'
        };
        
        console.log('Product with stock data:', productWithStock);
        res.status(201).json(productWithStock);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
})

//Editing(Updating) Data: (Protected Route)
router.put('/updateproduct/:id', fetchuser, async (req, res) => {
    const { ProductName, ProductPrice, ProductBarcode } = req.body;

    try {
        const updateProducts = await products.findByIdAndUpdate(req.params.id, { ProductName, ProductPrice, ProductBarcode }, { new: true });
        console.log("Data Updated");
        res.status(201).json(updateProducts);
    }
    catch (err) {
        console.log(err);
    }
})

//Deleting Data: (Protected Route)
router.delete('/deleteproduct/:id', fetchuser, async (req, res) => {

    try {
        const deleteProduct = await products.findByIdAndDelete(req.params.id);
        console.log("Data Deleted");
        res.status(201).json(deleteProduct);
    }
    catch (err) {
        console.log(err);
    }
})

// Initialize stock for existing products (for demo purposes)
router.post('/initialize-stock', fetchuser, async (req, res) => {
    try {
        const allProducts = await products.find({});
        let updatedCount = 0;
        
        for (let product of allProducts) {
            // Only initialize if the product doesn't have stock data
            if (!product.locationStock || product.locationStock.length === 0) {
                product.totalStock = Math.floor(Math.random() * 100) + 20; // Random stock between 20-120
                product.globalMinStock = 10;
                product.globalMaxStock = 1000;
                product.locationStock = [{
                    location: 'Main Warehouse',
                    quantity: product.totalStock,
                    reservedQuantity: 0,
                    damagedQuantity: 0,
                    minStockLevel: 10,
                    maxStockLevel: 500
                }];
                
                await product.calculateTotalStock();
                await product.save();
                updatedCount++;
            }
        }
        
        res.status(200).json({ 
            message: `Initialized stock for ${updatedCount} products`,
            updatedCount 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to initialize stock' });
    }
});

// ====== LOCATION MANAGEMENT ROUTES ======

// Initialize default locations (for demo purposes)
router.post('/initialize-locations', fetchuser, async (req, res) => {
    try {
        const existingLocations = await Location.find({});
        
        if (existingLocations.length === 0) {
            const defaultLocations = [
                {
                    locationId: 'main-warehouse',
                    locationName: 'Main Warehouse',
                    locationType: 'warehouse',
                    address: {
                        street: '123 Storage Drive',
                        city: 'New York',
                        state: 'NY',
                        zipCode: '10001',
                        country: 'USA'
                    },
                    contactInfo: {
                        phone: '+1-555-0001',
                        email: 'warehouse@company.com',
                        manager: 'John Smith'
                    },
                    maxCapacity: 10000,
                    currentCapacity: 0,
                    createdBy: req.user.id
                },
                {
                    locationId: 'downtown-store',
                    locationName: 'Downtown Store',
                    locationType: 'store',
                    address: {
                        street: '456 Main Street',
                        city: 'New York',
                        state: 'NY',
                        zipCode: '10002',
                        country: 'USA'
                    },
                    contactInfo: {
                        phone: '+1-555-0002',
                        email: 'downtown@company.com',
                        manager: 'Jane Doe'
                    },
                    maxCapacity: 2000,
                    currentCapacity: 0,
                    createdBy: req.user.id
                },
                {
                    locationId: 'mall-outlet',
                    locationName: 'Mall Outlet',
                    locationType: 'outlet',
                    address: {
                        street: '789 Shopping Center',
                        city: 'New York',
                        state: 'NY',
                        zipCode: '10003',
                        country: 'USA'
                    },
                    contactInfo: {
                        phone: '+1-555-0003',
                        email: 'mall@company.com',
                        manager: 'Bob Wilson'
                    },
                    maxCapacity: 1500,
                    currentCapacity: 0,
                    createdBy: req.user.id
                }
            ];

            await Location.insertMany(defaultLocations);
            res.status(200).json({ 
                message: 'Default locations initialized successfully',
                count: defaultLocations.length 
            });
        } else {
            res.status(200).json({ 
                message: 'Locations already exist',
                count: existingLocations.length 
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to initialize locations' });
    }
});

// Get all locations
router.get('/locations', fetchuser, async (req, res) => {
    try {
        const locations = await Location.find({ isActive: true });
        res.status(200).json(locations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

// Create new location
router.post('/locations', fetchuser, async (req, res) => {
    try {
        const { locationId, locationName, locationType, address, contactInfo, maxCapacity } = req.body;
        
        // Check if location ID already exists
        const existingLocation = await Location.findOne({ locationId });
        if (existingLocation) {
            return res.status(400).json({ error: 'Location ID already exists' });
        }

        const newLocation = new Location({
            locationId,
            locationName,
            locationType,
            address,
            contactInfo,
            maxCapacity,
            createdBy: req.user.id
        });

        await newLocation.save();
        res.status(201).json(newLocation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create location' });
    }
});

// ====== STOCK MANAGEMENT ROUTES ======

// Add stock to a product at a specific location
router.post('/stock/add/:productId', fetchuser, async (req, res) => {
    try {
        const { productId } = req.params;
        const { location, quantity, reason, reference } = req.body;

        if (!location || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Location and valid quantity are required' });
        }

        const product = await products.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.addStock(location, parseInt(quantity), req.user.id, reason, reference);
        await product.save();

        // Check for stock alerts after update
        await checkAndCreateStockAlerts(product);

        res.status(200).json({ 
            message: 'Stock added successfully', 
            product: product,
            newStockLevel: product.totalStock
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Remove stock from a product at a specific location
router.post('/stock/remove/:productId', fetchuser, async (req, res) => {
    try {
        const { productId } = req.params;
        const { location, quantity, reason, reference } = req.body;

        if (!location || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Location and valid quantity are required' });
        }

        const product = await products.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.removeStock(location, parseInt(quantity), req.user.id, reason, reference);
        await product.save();

        // Check for stock alerts after update
        await checkAndCreateStockAlerts(product);

        res.status(200).json({ 
            message: 'Stock removed successfully', 
            product: product,
            newStockLevel: product.totalStock
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Mark stock as damaged
router.post('/stock/damaged/:productId', fetchuser, async (req, res) => {
    try {
        const { productId } = req.params;
        const { location, quantity, reason } = req.body;

        if (!location || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Location and valid quantity are required' });
        }

        const product = await products.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.markDamaged(location, parseInt(quantity), req.user.id, reason);
        await product.save();

        // Create damaged items alert
        await createDamagedItemAlert(product, location, quantity);

        res.status(200).json({ 
            message: 'Stock marked as damaged successfully', 
            product: product
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Process returned stock
router.post('/stock/return/:productId', fetchuser, async (req, res) => {
    try {
        const { productId } = req.params;
        const { location, quantity, reason } = req.body;

        if (!location || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Location and valid quantity are required' });
        }

        const product = await products.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.processReturn(location, parseInt(quantity), req.user.id, reason);
        await product.save();

        res.status(200).json({ 
            message: 'Return processed successfully', 
            product: product,
            newStockLevel: product.totalStock
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Transfer stock between locations
router.post('/stock/transfer/:productId', fetchuser, async (req, res) => {
    try {
        const { productId } = req.params;
        const { fromLocation, toLocation, quantity, reason } = req.body;

        if (!fromLocation || !toLocation || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'From/To locations and valid quantity are required' });
        }

        const product = await products.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Remove from source location
        product.removeStock(fromLocation, parseInt(quantity), req.user.id, reason, 'Transfer Out');
        
        // Add to destination location
        product.addStock(toLocation, parseInt(quantity), req.user.id, reason, 'Transfer In');
        
        await product.save();

        res.status(200).json({ 
            message: 'Stock transferred successfully', 
            product: product
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get stock movements for a product
router.get('/stock/movements/:productId', fetchuser, async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        const product = await products.findById(productId)
            .populate('stockMovements.performedBy', 'name email');
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Sort movements by date (newest first) and apply pagination
        const movements = product.stockMovements
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(parseInt(skip), parseInt(skip) + parseInt(limit));

        res.status(200).json({
            movements,
            totalMovements: product.stockMovements.length,
            product: {
                _id: product._id,
                ProductName: product.ProductName,
                totalStock: product.totalStock,
                isLowStock: product.isLowStock
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stock movements' });
    }
});

// ====== STOCK ALERTS ROUTES ======

// Get all stock alerts
router.get('/alerts', fetchuser, async (req, res) => {
    try {
        const { unread, severity } = req.query;
        
        let filter = {};
        if (unread === 'true') filter.isRead = false;
        if (severity) filter.severity = severity;

        const alerts = await StockAlert.find(filter)
            .populate('product', 'ProductName ProductBarcode')
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json(alerts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// Mark alert as read
router.put('/alerts/:alertId/read', fetchuser, async (req, res) => {
    try {
        const alert = await StockAlert.findByIdAndUpdate(
            req.params.alertId,
            { isRead: true },
            { new: true }
        );
        
        res.status(200).json(alert);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to mark alert as read' });
    }
});

// Resolve alert
router.put('/alerts/:alertId/resolve', fetchuser, async (req, res) => {
    try {
        const { resolvedNote } = req.body;
        
        const alert = await StockAlert.findByIdAndUpdate(
            req.params.alertId,
            { 
                isResolved: true, 
                resolvedBy: req.user.id,
                resolvedAt: new Date(),
                resolvedNote: resolvedNote || ''
            },
            { new: true }
        );
        
        res.status(200).json(alert);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
});

// Get dashboard statistics
router.get('/dashboard/stats', fetchuser, async (req, res) => {
    try {
        const totalProducts = await products.countDocuments({ isActive: true });
        const lowStockProducts = await products.countDocuments({ isLowStock: true, isActive: true });
        const outOfStockProducts = await products.countDocuments({ totalStock: 0, isActive: true });
        const unreadAlerts = await StockAlert.countDocuments({ isRead: false });
        const locations = await Location.countDocuments({ isActive: true });
        
        // Get recent stock movements
        const recentMovements = await products.aggregate([
            { $unwind: '$stockMovements' },
            { $sort: { 'stockMovements.date': -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'stockMovements.performedBy',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $project: {
                    ProductName: 1,
                    ProductBarcode: 1,
                    movement: '$stockMovements',
                    user: { $arrayElemAt: ['$user.name', 0] }
                }
            }
        ]);

        res.status(200).json({
            totalProducts,
            lowStockProducts,
            outOfStockProducts,
            unreadAlerts,
            locations,
            recentMovements
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// ====== HELPER FUNCTIONS ======

// Function to check and create stock alerts
async function checkAndCreateStockAlerts(product) {
    try {
        // Check each location for low stock
        for (const locationStock of product.locationStock) {
            if (locationStock.quantity <= locationStock.minStockLevel) {
                // Check if alert already exists for this product-location combination
                const existingAlert = await StockAlert.findOne({
                    product: product._id,
                    location: locationStock.location,
                    alertType: locationStock.quantity === 0 ? 'out_of_stock' : 'low_stock',
                    isResolved: false
                });

                if (!existingAlert) {
                    const severity = locationStock.quantity === 0 ? 'critical' : 
                                   locationStock.quantity <= (locationStock.minStockLevel / 2) ? 'high' : 'medium';
                    
                    await StockAlert.create({
                        product: product._id,
                        alertType: locationStock.quantity === 0 ? 'out_of_stock' : 'low_stock',
                        location: locationStock.location,
                        currentQuantity: locationStock.quantity,
                        threshold: locationStock.minStockLevel,
                        severity: severity,
                        message: `${product.ProductName} is ${locationStock.quantity === 0 ? 'out of stock' : 'running low'} at ${locationStock.location}. Current: ${locationStock.quantity}, Minimum: ${locationStock.minStockLevel}`
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error creating stock alerts:', error);
    }
}

// Function to create damaged item alert
async function createDamagedItemAlert(product, location, quantity) {
    try {
        await StockAlert.create({
            product: product._id,
            alertType: 'damaged_items',
            location: location,
            currentQuantity: quantity,
            threshold: 0,
            severity: 'medium',
            message: `${quantity} units of ${product.ProductName} marked as damaged at ${location}`
        });
    } catch (error) {
        console.error('Error creating damaged item alert:', error);
    }
}

module.exports = router;