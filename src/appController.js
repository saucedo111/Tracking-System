const express = require('express');
const appService = require('./appService');
const {withTimeout} = require("./appService");

const router = express.Router();

// idea taken from https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number
function isNumeric(num){
    return !isNaN(num)
}


// idea taken from https://stackoverflow.com/questions/1353684/how-to-check-if-a-date-is-valid-in-javascript
function isValidDate(d){
    return d instanceof Date && !isNaN(d);
}

// User login
router.post('/login', async (req, res) => {
    try {
        const { userId, password, userType } = req.body; 
        if (!userId || !password || !userType || !['customer', 'supplier', 'carrier'].includes(userType)) { 
            return res.status(400).json({ success: false, message: 'Invalid input: userId, password, and userType are required.' });
        }
        const result = await appService.validateLogin(userId, password, userType);
        
        if (result.success) {
            res.json({
                success: true,
                user: result.user
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// ----------------------------------------------------------
// API endpoints
// Modify or extend these routes based on your project's needs.
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
    }
});

router.get('/demotable', async (req, res) => {
    const tableContent = await appService.fetchDemotableFromDb();
    res.json({data: tableContent});
});

// Shipment projection
router.get('/shipments', async (req, res) => {
    const param = req.query.fields;
    const tableContent = await appService.selectFromShipment(param);
    res.json({data: tableContent});
});

// Min customer order
router.get('/aggregate-customer', async (req, res) => {
    try {
        const param = Number(req.query.minOrderAmount);
        if (!isNumeric(param)) {
            return res.status(400).json({success: false, message: 'minOrderAmount must be a valid number'});
        }
        const tableContent = await appService.aggregateCustomer(param);
        res.json({data: tableContent});
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error aggregating customer' });
    }
})

// Find models in db
router.get('/models', async (req, res) => {
    try {
        const tableContent = await appService.fetchModelsFromDb();
        res.json({data: tableContent});
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error fetching models' });
    }
})

// Divide models in db
router.get('/divModels', async (req, res) => {
    try {
        const param = req.query.models;
        const tableContent = await appService.divideModelsFromDb(param);
        res.json({data: tableContent});
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error generating models' });
    }
})
router.post("/initiate-demotable", async (req, res) => {
    try{
    const initiateResult = await withTimeout(appService.initiateDemotable(), 10000);
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }} catch (e) {
        res.status(500).json({ success: false, error: "Error initializing tables" });
    }
});

// Insert order
router.post("/insert-order", async (req, res) => {
    try {
        const {num, date, totalCost, customerId, supplierId} = req.body;
        if (!num || !date || !totalCost || !customerId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        if (!isNumeric(num) || !isNumeric(totalCost) || !isNumeric(customerId) || (supplierId && !isNumeric(supplierId))) {
            return res.status(400).json({ success: false, message: 'Numeric fields must be numbers' });
        }
        if (!isValidDate(new Date(date))) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }
        const insertResult = await appService.insertOrder(num, date, totalCost, customerId, supplierId);
        if (insertResult) {
            res.json({success: true});
        } else {
            res.status(500).json({success: false});
        }
    } catch (e) {
        res.status(500).json({success: false, error: e.message});
    }
});

// Delete Shipment
router.delete("/delete-shipment", async (req, res) => {
    try {
        const { trackingNumber } = req.body;
        if (!trackingNumber || !isNumeric(trackingNumber)) {
            return res.status(400).json({ success: false, message: 'trackingNumber must be provided and numeric' });
        }
        const deleteResult = await appService.deleteShipment(trackingNumber);
        if (deleteResult) {
            res.json({ success: true});
        } else {
            res.status(500).json({ success: false});
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});


router.post('/selection-orders', async (req, res) => {
    try {
        const { conditions } = req.body;
        if (!Array.isArray(conditions) || conditions.length === 0) {
            return res.status(500).json({ success: false, message: 'No conditions provided' });
        }

        const results = await appService.selectionOrders(conditions);
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error in filterOrders:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Join query
router.get('/join-query', async (req, res) => {
    try {
        const param = req.query.orderNumber;
        if (!param || !isNumeric(param)) {
            return res.status(400).json({ success: false, message: 'orderNumber must be provided and numeric' });
        }
        const result = await appService.joinQuery(param);
        if (result) {
            res.json({ success: true, data: result });
        } else {
            res.status(500).json({ success: false});
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// find best carrier
router.get("/aggregate-carrier", async (req, res) => {
    try {
        const rows = await appService.aggregateCarrier();
        if (rows) {
            res.json({ success: true, data: rows });
        } else {
            res.status(500).json({ success: false });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});


router.post("/update-name-demotable", async (req, res) => {
    const { oldName, newName } = req.body;
    const updateResult = await appService.updateNameDemotable(oldName, newName);
    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/count-demotable', async (req, res) => {
    const tableCount = await appService.countDemotable();
    if (tableCount >= 0) {
        res.json({ 
            success: true,  
            count: tableCount
        });
    } else {
        res.status(500).json({ 
            success: false, 
            count: tableCount
        });
    }
});

// Update customer
router.post('/update-customer', async (req, res) => {
    try {
        const { customerId, name, contactNumber, homeAddress } = req.body;
        if (!customerId || !name || !contactNumber || !homeAddress) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        if (!isNumeric(customerId) || !isNumeric(contactNumber)) {
            return res.status(400).json({ success: false, message: 'customerId and contactNumber must be numeric' });
        }
        const updateResult = await appService.updateCustomer(customerId, name, contactNumber, homeAddress);
        if (updateResult) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Get shipments with above average package size
router.get('/shipments-above-avg-package-size', async (req, res) => {
    try {
        const result = await appService.shipmentsWithAboveAvgPackageSize();
        if (result) {
            res.json({ success: true, data: result });
        } else {
            res.status(500).json({ success: false });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


module.exports = router;
