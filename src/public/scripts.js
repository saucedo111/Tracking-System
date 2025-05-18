/*
 * These functions below are for various webpage functionalities
 * Each function serves to process data on the frontend:
 *      - Before sending requests to the backend
 *      - After receiving responses from the backend
 * 
 * To tailor them to your specific needs,
 * adjust or expand these functions to match both your 
 *   backend endpoints 
 * and 
 *   HTML structure.
 * 
 */

// This function checks the database connection and updates its status on the frontend.
async function checkDbConnection() {
    const statusElem = document.getElementById('dbStatus');
    const loadingGifElem = document.getElementById('loadingGif');

    const response = await fetch('/check-db-connection', {
        method: "GET"
    });

    // Hide the loading GIF once the response is received.
    loadingGifElem.style.display = 'none';
    // Display the statusElem's text in the placeholder.
    statusElem.style.display = 'inline';

    response.text()
    .then((text) => {
        statusElem.textContent = text;
    })
    .catch((error) => {
        statusElem.textContent = 'connection timed out';  // Adjust error handling if required.
    });
}

// Fetches data from the demotable and displays it.
async function fetchAndDisplayOrders(tablename) {
    const tableElement = document.getElementById(tablename);
    const tableBody = tableElement.querySelector('tbody');

    const response = await fetch('/demotable', {
        method: 'GET'
    });

    const responseData = await response.json();
    const demotableContent = responseData.data;

    // Always clear old, already fetched data before new fetching process.
    if (tableBody) {
        tableBody.innerHTML = '';
    }

    demotableContent.forEach(user => {
        const row = tableBody.insertRow();
        user.forEach((field, index) => {
            const cell = row.insertCell(index);
            cell.textContent = field;
        });
    });
}

// This function resets or initializes the demotable.
async function resetDemotable() {
    const response = await fetch("/initiate-demotable", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetResultMsg');
        messageElement.textContent = "database initiated successfully!";
        fetchTableData(`demotable`);
    } else {
        alert("Error initiating table!");
    }
}

// This function sanitizes the input by trimming whitespace.
function sanitizeTrim(input) {
    return input.trim();
}

let currentUserId = null;
let currentUserType = null;
let currentUserData = null; 

// Inserts new records into the order table.
async function insertOrder(event) {
    event.preventDefault();

    const numValue = sanitizeTrim(document.getElementById('insertNum').value);
    const dateValue = document.getElementById('insertDate').value;
    const totalCostValue = sanitizeTrim(document.getElementById('insertTotalCost').value);
    const customerIdValue = sanitizeTrim(document.getElementById('insertCustomerId').value);
    const supplierIdValue = sanitizeTrim(document.getElementById('insertSupplierId').value);

    const response = await fetch('/insert-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            num: numValue,
            date: dateValue,
            totalCost: totalCostValue,
            customerId: customerIdValue,
            supplierId: supplierIdValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('insertResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Order inserted successfully!";
        messageElement.style.color = 'green';
    } else {
        let userFriendlyError = "An error occurred while creating the order. Please check your input and try again.";
        const errorText = responseData.error || "";
        messageElement.style.color = 'red';

        if (errorText.includes("ORA-02291")) {
            if (errorText.toUpperCase().includes("CUSTOMERID")) {
                userFriendlyError = "Invalid Customer ID provided. Please ensure the customer exists.";
            } else if (errorText.toUpperCase().includes("SUPPLIERID")) {
                userFriendlyError = "Invalid Supplier ID provided. Please ensure the supplier exists.";
            } else {
                 userFriendlyError = "Invalid reference ID provided. Please check Customer and Supplier IDs.";
            }
        } else if (errorText.includes("ORA-00001")) {
             if (errorText.toUpperCase().includes("ORDERNUMBER") || errorText.toUpperCase().includes("PK_ORDERS")) {
                 userFriendlyError = "Order number already exists. Please use a different order number.";
             } else {
                 userFriendlyError = "This record already exists or violates a uniqueness rule.";
             }
        } else if (errorText.includes("ORA-01400")) {
             userFriendlyError = "Missing required information. Please fill out all mandatory fields (Order Number, Total Cost, Customer ID).";
        }

        messageElement.textContent = userFriendlyError;
    }
}


function showEditModal() {
    console.log('Showing modal');
    const modal = document.getElementById('editCustomerFormContainer');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    console.log('Current modal display:', modal.style.display);
    modal.style.display = 'block';
    
    // Pre-fill form with stored user data
    if (currentUserData) {
        document.getElementById('editCustomerId').value = currentUserId;
        document.getElementById('editCustomerName').value = currentUserData.name || '';
        document.getElementById('editCustomerContact').value = currentUserData.contactNumber || '';
        document.getElementById('editCustomerAddress').value = currentUserData.homeAddress || '';
    }
}


function hideEditModal() {
    console.log('Hiding modal');
    const modal = document.getElementById('editCustomerFormContainer');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    modal.style.display = 'none';
    // Clear form
    document.getElementById('editCustomerForm').reset();
    document.getElementById('editCustomerResultMsg').textContent = '';
}


window.onclick = function(event) {
    const modal = document.getElementById('editCustomerFormContainer');
    if (!modal) {
        console.error('Modal element not found in click handler');
        return;
    }
    if (event.target === modal) {
        console.log('Clicked outside modal');
        hideEditModal();
    }
}

// Handle the deletion of a shipment
async function deleteShipment(event) {
    event.preventDefault();

    const trackingNumber = sanitizeTrim(document.getElementById('trackingNumber').value);

    try {
        const response = await fetch('/delete-shipment', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ trackingNumber })
        });

        const responseData = await response.json();
        const messageElement = document.getElementById('deleteResult');

        if (responseData.success) {
            messageElement.textContent = "Shipment deleted successfully!";
            messageElement.style.color = 'green';
            if (typeof selectCol === 'function') {
                try { await selectCol({ preventDefault: () => {} }); } catch(e) { console.error("Error refreshing list after delete:", e); }
            }
        } else {
            messageElement.textContent = "Shipment with that tracking number not found?";
            messageElement.style.color = 'red';
        }
    } catch (error) {
        console.error("Fetch error:", error);
        const messageElement = document.getElementById('deleteResult');
        messageElement.textContent = "Error processing delete request: " + error.message;
        messageElement.style.color = 'red';
    }
}

// Search for orders based on various criteria
async function selectionOrders(event) {
    event.preventDefault();

    const filterRows = document.querySelectorAll('.filter-row');
    const conditions = [];
    let hasValidCondition = false;
    let hasValidLogicalOperator = true;

    filterRows.forEach((row, rowIndex) => {
        const logicalOperator = sanitizeTrim(row.querySelector('.logical-operator').value);
        const field = sanitizeTrim(row.querySelector('.filter-field').value);
        const comparisonOperator = sanitizeTrim(row.querySelector('.comparison-operator').value);
        const value = sanitizeTrim(row.querySelector('.filter-value').value.trim());

        if (!field || !comparisonOperator || !value) {
            return;
        }

        hasValidCondition = true;

        const condition = {
            field,
            comparisonOperator,
            value
        };

        if (rowIndex > 0 && logicalOperator !== 'NONE') {
            condition.logicalOperator = logicalOperator;
        } else if (rowIndex > 0) {
            hasValidLogicalOperator = false;
            return;
        }

        conditions.push(condition);
    });

    if (!hasValidCondition) {
        alert('Please set up at least one valid condition.');
        return;
    }

    if (!hasValidLogicalOperator) {
        alert('Please fill in the logical operator(s)');
        return;
    }

    try {
        const response = await fetch('/selection-orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conditions })
        });

        const responseData = await response.json();

        if (responseData.success) {
            displayTable(
                responseData.data,
                ['ORDERNUMBER', 'ORDERDATE', 'TOTALCOST', 'CUSTOMERID', 'SUPPLIERID'],
                'filterResults'
            );
        } else {
            alert('Filter failed: ' + (responseData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Filter error:', error);
        alert('Filter error: ' + error.message);
    }
}

async function joinQuery(event) {
    event.preventDefault();
    const orderNumber = sanitizeTrim(document.getElementById('orderNumber').value);

    try {
        const responseData = await fetch(`/join-query?orderNumber=${orderNumber}`);
        if (!responseData.ok) throw new Error('Network response was not OK');

        const result = await responseData.json();
        if (result.success) {
            displayTable(result.data, ['NAME', 'CONTACTNUMBER'], 'joinQueryResult');
        } else {
            alert('Search failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error during search: ' + error.message);
    }
}


// Selects a column from the shipment table.
async function selectCol(event) {
    event.preventDefault();

    const shipment = document.getElementById('shipment-section');
    const selectedColumn = shipment.querySelectorAll('input[type="checkbox"]:checked');
    const columnValue = Array.from(selectedColumn).map(checkbox => checkbox.value);

    // Check if at least one column is selected
    if (columnValue.length === 0) {
        alert("Please select at least one column.");
        return;
    }
    const fields = encodeURIComponent(columnValue.join(','));

    try {
        const response = await fetch(`/shipments?fields=${fields}`);
        const responseData = await response.json();

        if (response.ok) {
            displayTable(responseData.data, columnValue.map(column => column.toUpperCase()), "result");
        } else {
            alert("Error in selectCol: " + (responseData.error || "Unknown error"));
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Error in selectCol: " + error.message);
    }
}


// Aggregates carrier data based on area
async function aggregateCarrier(event) {
    event.preventDefault();

    const response = await fetch(`/aggregate-carrier`);

    const responseData = await response.json();

    if (responseData.success) {
        displayTable(responseData.data, ['NAME', 'SERVICEAREA', 'OVERALLRATING'], 'aggregateResult');
    } else {
        alert("Error in aggregateCarrier");
    }
}

// Aggregates customer data based on average order cost with a min order amount
async function aggregateCustomer(event) {
    event.preventDefault();

    const minOrderAmount = sanitizeTrim(document.getElementById('minOrder').value);

    if (minOrderAmount === '') {
        alert("Please enter a minimum order amount.");
        return;
    }

    const response = await fetch(`/aggregate-customer?minOrderAmount=${minOrderAmount}`);

    const responseData = await response.json();

    if (response.ok) {
        displayTable(responseData.data, ['CUSTOMERID', 'SPENDING'], 'averageResult');
    } else {
        alert("Error in aggregateCustomer");
    }
}

// Finds warehouses with storageCapacity larger than overall average storageCapacity of warehouses
async function shipmentsWithAboveAvgPackageSize() {
    try {
        const response = await fetch('/shipments-above-avg-package-size');
        const responseData = await response.json();

        if (responseData.success) {
            displayTable(responseData.data, ['SHIPMENTNUMBER', 'AVGPACKAGESIZE'], 'aboveAvgPackageSizeResult');
        } else {
            alert('Error fetching data: ' + responseData.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error fetching data: ' + error.message);
    }
}


// function to display all avail car models
async function displayModels() {
    const response = await fetch('/models');

    const responseData = await response.json();

    if (response.ok) {
        const container = document.getElementById('modelSelect');
        container.innerHTML = '';
        responseData.data.forEach((item) => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'models';
            checkbox.value = item.MODEL;

            const label = document.createElement('label');
            label.textContent = item.MODEL;

            container.appendChild(checkbox);
            container.appendChild(label);
            container.appendChild(document.createElement('br'));
        })
    } else {
        alert("Error in displaying models");
    }
}

async function divideModels() {
    const selectedModels = document.querySelectorAll('input[name="models"]:checked');
    const modelValues = Array.from(selectedModels).map(checkbox => checkbox.value);

    if (modelValues.length === 0) {
        alert("Please select at least one model.");
        return;
    }

    const models = encodeURIComponent(modelValues.join(','));

    try {
        const response = await fetch(`/divModels?models=${models}`);
        const responseData = await response.json();

        if (response.ok) {
            displayTable(responseData.data, ['CARRIERID','CARRIERNAME'], 'modelResult');
        } else {
            alert("Error in divideModels: " + (responseData.error || "Unknown error"));
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Error in divideModels: " + error.message);
    }
}

// function to display results in a table format in any div
function displayTable(data, columns, div) {
    // Clear previous results
    const resultDiv = document.getElementById(div);
    resultDiv.innerHTML = '';

    const table = document.createElement('table');
    table.border = '1';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Create header row
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);


    const tbody = document.createElement('tbody');

    // populate table with data
    data.forEach(rowObject => {
        const row = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = rowObject[col] !== undefined ? rowObject[col] : '';
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    resultDiv.appendChild(table);
}


async function handleLogin(event) {
    event.preventDefault();
    
    currentUserId = document.getElementById('userID').value; 
    const passwordValue = document.getElementById('password').value; 
    currentUserType = document.getElementById('userType').value; 

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
           
            body: JSON.stringify({ userId: currentUserId, password: passwordValue, userType: currentUserType }) 
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('loginSection').style.display = 'none';
            
            const dashboardSection = document.getElementById('dashboardSection');
            dashboardSection.style.display = 'block';
            
            currentUserData = data.user;
            
            document.getElementById('userName').textContent = data.user.name;
            document.getElementById('userTypeDisplay').textContent = currentUserType;
            document.getElementById('userIdDisplay').textContent = currentUserId; 
            
            document.querySelectorAll('.user-dashboard').forEach(dashboard => {
                dashboard.style.display = 'none';
            });

            const dashboardId = currentUserType + 'Dashboard';
            const userDashboard = document.getElementById(dashboardId);
            if (userDashboard) {
                userDashboard.style.display = 'block';
            }

            const editButton = document.getElementById('editInfoButton');
            if (editButton) {
                 if (currentUserType === 'customer') {
                    editButton.style.display = 'block';
                 } else {
                    editButton.style.display = 'none';
                 }
            }

            checkDbConnection();
        } else {
            alert('Login failed: Invalid user ID or type or password');
        }
    } catch (error) {
        alert('Login error: ' + error.message);
    }
}


function updateFilterValueInputType(filterRow) {
    const fieldSelect = filterRow.querySelector('.filter-field');
    const valueInput = filterRow.querySelector('.filter-value');

    if (!fieldSelect || !valueInput) return; 

    if (fieldSelect.value === 'orderDate') {
        valueInput.type = 'date';
        valueInput.placeholder = ''; 
    } else {
        valueInput.type = 'text';
        valueInput.placeholder = 'Value'; 
    }
}

// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = function() {
    checkDbConnection();

    // Login form listener
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Setup filter row input type listeners
    const filterForm = document.getElementById('filterOrdersForm');
    if (filterForm) {
        const filterRows = filterForm.querySelectorAll('.filter-row');
        filterRows.forEach(row => {
            const fieldSelect = row.querySelector('.filter-field');
            if (fieldSelect) {
                // Add change listener
                fieldSelect.addEventListener('change', () => updateFilterValueInputType(row));
                // Set initial state
                updateFilterValueInputType(row);
            }
            // Note: We are NOT adding the filter form submit listener here as requested.
        });
    }
    document.getElementById('aggregate-carrier').addEventListener('click', aggregateCarrier);
    document.getElementById('resetDemotable').addEventListener('click', resetDemotable);
    document.getElementById('insertDemotable').addEventListener('submit', insertOrder);
    document.getElementById('select-col').addEventListener('click', selectCol);
    document.getElementById('averageSubmit').addEventListener('click', aggregateCustomer);
    document.getElementById('deleteShipmentForm').addEventListener('submit', deleteShipment);
    document.getElementById('filterOrdersForm').addEventListener('submit', selectionOrders);
    document.getElementById('modelSelectButton').addEventListener('click', displayModels);
    document.getElementById('modelResultButton').addEventListener('click', divideModels);

    document.getElementById('editInfoButton').addEventListener('click', showEditModal);
    document.getElementById('cancelEditCustomer').addEventListener('click', hideEditModal);

    document.getElementById('joinQueryForm').addEventListener('submit', joinQuery);

    document.getElementById('fetchAboveAvgPackageSizeButton').addEventListener('click', shipmentsWithAboveAvgPackageSize);

    document.getElementById('editCustomerForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = {
            customerId: document.getElementById('editCustomerId').value,
            name: document.getElementById('editCustomerName').value,
            contactNumber: document.getElementById('editCustomerContact').value,
            homeAddress: document.getElementById('editCustomerAddress').value
        };

        try {
            const response = await fetch('/update-customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            const resultMsg = document.getElementById('editCustomerResultMsg');

            if (data.success) {
                resultMsg.textContent = "Information updated successfully!";
                document.getElementById('userName').textContent = formData.name;
                currentUserData = {
                    ...currentUserData,
                    name: formData.name,
                    contactNumber: formData.contactNumber,
                    homeAddress: formData.homeAddress
                };
                setTimeout(hideEditModal, 1500);
            } else {
                resultMsg.textContent = "Error updating information: " + (data.error || "Unknown error");
            }
        } catch (error) {
            document.getElementById('editCustomerResultMsg').textContent = 
                "Error updating information: " + error.message;
        }
    });
};

// General function to refresh the displayed table data. 
// You can invoke this after any table-modifying operation to keep consistency.
function fetchTableData(tableName) {
    fetchAndDisplayOrders(tableName);
}
