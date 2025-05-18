const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const envVariables = loadEnvFile('./.env');

const dbConfig = {
    user: isWindows ? process.env.ORACLE_USER : envVariables.ORACLE_USER,
    password: isWindows ? process.env.ORACLE_PASS : envVariables.ORACLE_PASS,
    connectString: isWindows
        ? `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_DBNAME}`
        : `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), ms)
        )
    ]);
}

// initialize connection pool
async function initializeConnectionPool() {
    try {
        if (isWindows) {
            oracledb.initOracleClient({libDir: process.env.ORACLE_DIR});
        } else {
            const ORACLE_HOME = envVariables.ORACLE_HOME || '/opt/oracle/instantclient_19_8';
            if (!process.env.LD_LIBRARY_PATH) {
                process.env.LD_LIBRARY_PATH = ORACLE_HOME;
            }
            oracledb.initOracleClient({libDir: ORACLE_HOME});
        }
        await oracledb.createPool(dbConfig);
        console.log('Connection pool started');
    } catch (err) {
        console.error('Initialization error: ' + err.message);
    }
}

async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
        await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
        console.log('Pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

initializeConnectionPool();

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);


// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Gets a connection from the default pool 
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}


// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
    return await withOracleDB(async (connection) => {
        return true;
    }).catch(() => {
        return false;
    });
}

async function fetchDemotableFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM DEMOTABLE');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// This function executes the SQL script to initialize all tables
async function initiateDemotable() {
    return await withOracleDB(async (connection) => {
        try {
            const sqlFilePath = path.join(__dirname, 'initialization.sql');
            const sqlScript = await fs.readFile(sqlFilePath, 'utf8');

            const sqlStatements = sqlScript.split(';').map(s => s.trim()).filter(s => s.length > 0);

            console.log(`Executing ${sqlStatements.length} statements from initialization.sql...`);
            for (const statement of sqlStatements) {
                try {

                    await connection.execute(statement);
                } catch (err) {

                    if (statement.toUpperCase().startsWith('DROP') && err.errorNum === 942) {
                        console.log(`Ignoring error for DROP statement (table likely doesn't exist): ${err.message}`);
                    } else {
                        console.error(`Error executing statement: ${statement}\n${err.message}`);
                        throw err;
                    }
                }
            }

            await commitWithTimeout(connection);
            console.log('Database initialization script executed successfully.');
            return true;
        } catch (err) {
            console.error('Failed to execute initialization script:', err);

            try {
                await connection.rollback();
                console.log('Rollback attempted.');
            } catch (rollbackErr) {
                console.error('Rollback failed:', rollbackErr);
            }
            return false;
        }
    }).catch((err) => {
        console.error('Failed to get database connection for initialization.', err);
        return false;
    });
}

// Query 1 (Insert)
async function insertOrder(num, date, totalCost, customerId, supplierId) {
    return withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO "Order" (ORDERNUMBER, ORDERDATE, TOTALCOST, CUSTOMERID, SUPPLIERID)
             VALUES (:1, TO_DATE(:2, 'YYYY-MM-DD'), :3, :4, :5)`, // Use TO_DATE to explicitly convert the string
            [num, date, totalCost, customerId, supplierId],
            {autoCommit: true}
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch((err) => {
        throw new Error(`Insert into "Order" failed: ${err.message}`);
    });
}

// Query 2 (Update)
async function updateCustomer(customerId, name, contactNumber, homeAddress) {
    return await withOracleDB(async (connection) => {
        try {
            const result = await connection.execute(
                `UPDATE Customer
                 SET name = :1, 
                contactNumber = :2, 
                homeAddress = :3
                 WHERE userId = :4`,
                [name, contactNumber, homeAddress, customerId],
                {autoCommit: true}
            );
            return result.rowsAffected && result.rowsAffected > 0;
        } catch (err) {
            console.error('Error updating customer:', err);
            throw err;
        }
    });
}

// Query 3 (Delete)
async function deleteShipment(trackingNumber) {
    return await withOracleDB(async (connection) => {
        try {
            const result = await connection.execute(
                `DELETE
                 FROM Shipment
                 WHERE trackingNumber = :trackingNumber`,
                [trackingNumber],
                {autoCommit: true}
            );
            return result.rowsAffected && result.rowsAffected > 0;
        } catch (err) {
            throw new Error(`Error deleting shipment: ${err.message}`);
        }
    });
}

function isValidDate(d){
    return d instanceof Date && !isNaN(d);
}

// Query 4 (Selection)
async function selectionOrders(conditions) {
    return await withOracleDB(async (connection) => {
        let query = 'SELECT * FROM "Order" WHERE 1=1 AND';
        let params = [];
        let paramIndex = 1;

        for (let i = 0; i < conditions.length; i++) {
            const condition = conditions[i];
            let clause = '';

            const allowedFields = ['orderNumber', 'orderDate', 'totalCost', 'customerID', 'supplierID'];
            const allowedOperators = ['=', '>', '<', '>=', '<=', 'LIKE'];

            if (!allowedFields.includes(condition.field)) {
                throw new Error(`Invalid field: ${condition.field}`);
            }
            if (!allowedOperators.includes(condition.comparisonOperator)) {
                throw new Error(`Invalid operator: ${condition.comparisonOperator}`);
            }

            let value = condition.value;
            if (condition.field === 'orderDate') {
                const date = new Date(value);
                date.setUTCHours(date.getUTCHours() + 7);
                value = date;
            }

            if (condition.comparisonOperator === 'LIKE' && !value.includes('%')) {
                value = `%${value}%`;
            }

            if (i > 0 && condition.logicalOperator) {
                clause += ` ${condition.logicalOperator} `;
            }

            clause += ` ${condition.field} ${condition.comparisonOperator} :${paramIndex}`;
            query += clause;
            params.push(value);
            paramIndex++;
        }

        const result = await connection.execute(
            query,
            params,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    }).catch((err) => {
        console.error('Error filtering orders:', err);
        throw err;
    });
}

// Query 5 (Projection)
async function selectFromShipment(fields) {
    return await withOracleDB(async (connection) => {
        const allowedFields = [
            'trackingNumber',
            'shipmentStatus',
            'shippingTime',
            'shipmentDate',
            'supplierID',
            'licensePlate',
            'carrierID'
        ];
        const sanitizedFields = fields.split(',').map(field => field.trim());
        for (const field of sanitizedFields) {
            if (!allowedFields.includes(field)) {
                throw new Error(`Invalid field: ${field}`);
            }
        }
        const result = await connection.execute(
            `SELECT ${fields}
             FROM SHIPMENT`,
            [],
            {outFormat: oracledb.OUT_FORMAT_OBJECT}
        );
        return result.rows;
    }).catch((e) => {
        throw new Error("Error selecting from shipment: " + e.message);
    });
}

// Query 6 (Join)
async function joinQuery(orderNumber) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT C.name AS NAME, C.contactNumber AS CONTACTNUMBER
             FROM Customer C, "Order" O
             WHERE C.userID = O.customerID
               AND O.orderNumber = :orderNumber`,
            {orderNumber},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    }).catch((err) => {
        console.error('Error executing join query:', err);
        throw err;
    });
}

// Query 7 (Aggregation with GROUP BY)
async function aggregateCarrier() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT MIN(name) AS NAME, serviceArea, MAX(overallRating) AS overallRating
             FROM Carrier
             GROUP BY serviceArea`,
            [],
            {outFormat: oracledb.OUT_FORMAT_OBJECT}
        );
        return result.rows;
    }).catch(() => {
        throw new Error("Error finding best carrier");
    });
}

// Query 8 (Aggregation with HAVING)
async function aggregateCustomer(numOrder) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT CUSTOMERID, AVG(TOTALCOST) AS SPENDING
             FROM "Order"
             GROUP BY CUSTOMERID
             HAVING COUNT(ORDERNUMBER) >= :numOrder`,
            {numOrder: numOrder},
            {outFormat: oracledb.OUT_FORMAT_OBJECT}
        );
        return result.rows;
    }).catch(() => {
        throw new Error("Error finding average spending per customer");
    });
}

// Query 9 (Nested aggregation with GROUP BY)
async function shipmentsWithAboveAvgPackageSize() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT shipmentNumber, AVG(package_size) AS avgPackageSize
             FROM Package
             GROUP BY shipmentNumber
             HAVING AVG(package_size) > (SELECT AVG(package_size) FROM Package)`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    }).catch((err) => {
        console.error('Error executing query:', err);
        throw err;
    });
}

async function fetchModelsFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT MODEL
             FROM VehicleModel`,
            [],
            {outFormat: oracledb.OUT_FORMAT_OBJECT}
        );
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Query 10 (Division)
async function divideModelsFromDb(models) {
    const sanitizeModel = model => model.replace(/'/g, "''");
    const modelList = models.split(',').map(sanitizeModel);
    const modelSubquery = modelList
        .map(model => `SELECT '${model}' AS model FROM dual`)
        .join(' UNION ALL ');

    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT C.userID AS CARRIERID, C.name AS CARRIERNAME
             FROM Carrier C
             WHERE NOT EXISTS (
                 ${modelSubquery}
                 MINUS
                 (SELECT V.model
                 FROM Vehicle V
                 WHERE V.carrierID = C.userID)
                       )`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    }).catch((e) => {
        throw new Error("Error dividing models: " + e.message);
    });
}

async function updateNameDemotable(oldName, newName) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE DEMOTABLE
             SET name=:newName
             where name = :oldName`,
            [newName, oldName],
            {autoCommit: true}
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function countDemotable() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT Count(*) FROM DEMOTABLE');
        return result.rows[0][0];
    }).catch(() => {
        return -1;
    });
}


async function commitWithTimeout(connection, timeout = 5000) {
    return await Promise.race([
        connection.commit(),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Commit timeout exceeded')), timeout)
        )
    ]);
}


async function validateLogin(userId, password, userType) {
    return await withOracleDB(async (connection) => {
        if (!['customer', 'supplier', 'carrier'].includes(userType)) {
            throw new Error('Invalid user type');
        }
        const tableName = userType.charAt(0).toUpperCase() + userType.slice(1);

        let query;
        let params = [userId, password];
        let selectFields = 'userID, name, password';

        if (userType === 'customer') {
            selectFields += ', contactNumber, homeAddress';
        } else if (userType === 'supplier') {
            selectFields += ', supplyType';
        } else if (userType === 'carrier') {
            selectFields += ', serviceArea, overallRating';
        }

        query = `SELECT ${selectFields} FROM ${tableName} WHERE userID = :1 AND password = :2`;

        const result = await connection.execute(
            query,
            params,
            { outFormat: oracledb.OUT_FORMAT_OBJECT } 
        );

        if (result.rows && result.rows.length > 0) {
            const userRecord = result.rows[0];
            
            let userDetails = {
                id: userRecord.USERID,
                name: userRecord.NAME,
            };
            if (userType === 'customer') {
                userDetails.contactNumber = userRecord.CONTACTNUMBER;
                userDetails.homeAddress = userRecord.HOMEADDRESS;
            } else if (userType === 'supplier') {
                userDetails.supplyType = userRecord.SUPPLYTYPE;
            } else if (userType === 'carrier') {
                userDetails.serviceArea = userRecord.SERVICEAREA;
                userDetails.overallRating = userRecord.OVERALLRATING;
            }

            return {
                success: true,
                user: userDetails
            };
        } else {
            
            return { success: false };
        }
    }).catch((err) => {
        console.error('Login validation error:', err);
        
        return { success: false, message: 'Login failed' };
    });
}


module.exports = {
    testOracleConnection,
    fetchDemotableFromDb,
    initiateDemotable,
    insertOrder,
    deleteShipment,
    selectFromShipment,
    updateNameDemotable,
    countDemotable,
    validateLogin,
    aggregateCarrier,
    aggregateCustomer,
    updateCustomer,
    fetchModelsFromDb,
    divideModelsFromDb,
    joinQuery,
    shipmentsWithAboveAvgPackageSize,
    withTimeout,
    selectionOrders
};
