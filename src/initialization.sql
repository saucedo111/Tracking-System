DROP TABLE PicksUpFrom CASCADE CONSTRAINTS;
DROP TABLE Prepares CASCADE CONSTRAINTS;
DROP TABLE DeliveryFeedback CASCADE CONSTRAINTS;
DROP TABLE ShipmentFeedback CASCADE CONSTRAINTS;
DROP TABLE Package CASCADE CONSTRAINTS;
DROP TABLE Shipment CASCADE CONSTRAINTS;
DROP TABLE Vehicle CASCADE CONSTRAINTS;
DROP TABLE Invoice CASCADE CONSTRAINTS;
DROP TABLE OrderPayment CASCADE CONSTRAINTS;
DROP TABLE "Order" CASCADE CONSTRAINTS;
DROP TABLE Warehouse CASCADE CONSTRAINTS;
DROP TABLE Carrier CASCADE CONSTRAINTS;
DROP TABLE Supplier CASCADE CONSTRAINTS;
DROP TABLE Customer CASCADE CONSTRAINTS;
DROP TABLE FreightClass CASCADE CONSTRAINTS;
DROP TABLE VehicleModel CASCADE CONSTRAINTS;
DROP TABLE HandlingInstructions CASCADE CONSTRAINTS;
DROP TABLE AddressPostalCode CASCADE CONSTRAINTS;
DROP TABLE RatingDescription CASCADE CONSTRAINTS;

CREATE TABLE RatingDescription (
  overallRating INT PRIMARY KEY,
  ratingDescription VARCHAR(10)
);

CREATE TABLE AddressPostalCode (
  homeAddress VARCHAR(100) PRIMARY KEY,
  postalCode VARCHAR(10)
);

CREATE TABLE HandlingInstructions (
  hazards VARCHAR(100) PRIMARY KEY,
  handlingInstructions VARCHAR(100)
);

CREATE TABLE VehicleModel (
  model VARCHAR(100) PRIMARY KEY,
  vehicleType VARCHAR(10),
  vehicleCapacity INT
);

CREATE TABLE FreightClass (
  weight INT,
  package_size INT,
  freightClass INT,
  PRIMARY KEY (weight, package_size)
);

CREATE TABLE Customer (
  userID INT PRIMARY KEY,
  contactNumber VARCHAR(10),
  name VARCHAR(20),
  password VARCHAR(255), 
  homeAddress VARCHAR(100),
  FOREIGN KEY (homeAddress) REFERENCES AddressPostalCode(homeAddress) ON DELETE SET NULL
);

CREATE TABLE Supplier (
  userID INT PRIMARY KEY,
  contactNumber VARCHAR(10),
  name VARCHAR(20),
  password VARCHAR(255), 
  supplyType VARCHAR(100)
);

CREATE TABLE Carrier (
  userID INT PRIMARY KEY,
  contactNumber VARCHAR(10),
  name VARCHAR(20),
  password VARCHAR(255), 
  serviceArea VARCHAR(20),
  overallRating INT,
  FOREIGN KEY (overallRating) REFERENCES RatingDescription(overallRating) ON DELETE SET NULL
);

CREATE TABLE Warehouse (
  warehouseID INT PRIMARY KEY,
  address VARCHAR(100) NOT NULL,
  storageCapacity INT
);

CREATE TABLE "Order" (
  orderNumber INT PRIMARY KEY,
  orderDate DATE,
  totalCost DECIMAL(10,2),
  customerID INT NOT NULL,
  supplierID INT,
  FOREIGN KEY (customerID) REFERENCES Customer(userID),
  FOREIGN KEY (supplierID) REFERENCES Supplier(userID)
);

CREATE TABLE OrderPayment (
  orderNumber INT PRIMARY KEY,
  paymentStatus VARCHAR(20),
  FOREIGN KEY (orderNumber) REFERENCES "Order"(orderNumber) ON DELETE CASCADE
);

CREATE TABLE Invoice (
  invoiceNumber INT PRIMARY KEY,
  invoiceDate DATE,
  orderNumber INT NOT NULL,
  FOREIGN KEY (orderNumber) REFERENCES "Order"(orderNumber) ON DELETE CASCADE
);

CREATE TABLE Vehicle (
  licensePlate VARCHAR(10) PRIMARY KEY,
  carrierID INT,
  model VARCHAR(100),
  FOREIGN KEY (carrierID) REFERENCES Carrier(userID) ON DELETE CASCADE,
  FOREIGN KEY (model) REFERENCES VehicleModel(model) ON DELETE SET NULL
);

CREATE TABLE Shipment (
  trackingNumber INT PRIMARY KEY,
  shipmentStatus VARCHAR(10),
  shippingTime TIMESTAMP,
  shipmentDate DATE,
  supplierID INT,
  licensePlate VARCHAR(10),
  carrierID INT,
  FOREIGN KEY (supplierID) REFERENCES Supplier(userID),
  FOREIGN KEY (licensePlate) REFERENCES Vehicle(licensePlate),
  FOREIGN KEY (carrierID) REFERENCES Carrier(userID)
);

CREATE TABLE Package (
  packageNumber INT,
  shipmentNumber INT,
  weight INT,
  hazards VARCHAR(100),
  package_size INT,
  PRIMARY KEY (packageNumber, shipmentNumber),
  FOREIGN KEY (shipmentNumber) REFERENCES Shipment(trackingNumber) ON DELETE CASCADE,
  FOREIGN KEY (weight, package_size) REFERENCES FreightClass(weight, package_size),
  FOREIGN KEY (hazards) REFERENCES HandlingInstructions(hazards)
);

CREATE TABLE ShipmentFeedback (
  shipmentNumber INT PRIMARY KEY,
  rating INT,
  message VARCHAR(200),
  FOREIGN KEY (shipmentNumber) REFERENCES Shipment(trackingNumber) ON DELETE CASCADE
);

CREATE TABLE DeliveryFeedback (
  refNumber INT PRIMARY KEY,
  customerID INT NOT NULL,
  shipmentNumber INT NOT NULL UNIQUE,
  FOREIGN KEY (customerID) REFERENCES Customer(userID),
  FOREIGN KEY (shipmentNumber) REFERENCES Shipment(trackingNumber) ON DELETE CASCADE
);

CREATE TABLE Prepares (
  warehouseID INT,
  shipmentNumber INT,
  PRIMARY KEY (warehouseID, shipmentNumber),
  FOREIGN KEY (warehouseID) REFERENCES Warehouse(warehouseID),
  FOREIGN KEY (shipmentNumber) REFERENCES Shipment(trackingNumber) ON DELETE CASCADE
);

CREATE TABLE PicksUpFrom (
  warehouseID INT,
  carrierID INT,
  PRIMARY KEY (warehouseID, carrierID),
  FOREIGN KEY (warehouseID) REFERENCES Warehouse(warehouseID) ON DELETE CASCADE,
  FOREIGN KEY (carrierID) REFERENCES Carrier(userID) ON DELETE CASCADE
);

INSERT INTO RatingDescription (overallRating, ratingDescription) VALUES (5, 'Excellent');
INSERT INTO RatingDescription (overallRating, ratingDescription) VALUES (4, 'Good');
INSERT INTO RatingDescription (overallRating, ratingDescription) VALUES (3, 'Fair');
INSERT INTO RatingDescription (overallRating, ratingDescription) VALUES (2, 'Poor');
INSERT INTO RatingDescription (overallRating, ratingDescription) VALUES (1, 'Bad');

INSERT INTO AddressPostalCode (homeAddress, postalCode) VALUES ('123 Elm Street', 'A1A1A1');
INSERT INTO AddressPostalCode (homeAddress, postalCode) VALUES ('456 Oak Avenue', 'B2B2B2');
INSERT INTO AddressPostalCode (homeAddress, postalCode) VALUES ('789 Pine Road', 'C3C3C3');
INSERT INTO AddressPostalCode (homeAddress, postalCode) VALUES ('321 Maple Lane', 'D4D4D4');
INSERT INTO AddressPostalCode (homeAddress, postalCode) VALUES ('654 Cedar Blvd', 'E5E5E5');

INSERT INTO HandlingInstructions (hazards, handlingInstructions) VALUES ('None', 'No special handling');
INSERT INTO HandlingInstructions (hazards, handlingInstructions) VALUES ('Fragile', 'Handle with care');
INSERT INTO HandlingInstructions (hazards, handlingInstructions) VALUES ('Flammable', 'Keep away from heat');
INSERT INTO HandlingInstructions (hazards, handlingInstructions) VALUES ('Corrosive', 'Use protective gear');
INSERT INTO HandlingInstructions (hazards, handlingInstructions) VALUES ('Explosive', 'Keep away from shock or impact');


INSERT INTO VehicleModel (model, vehicleType, vehicleCapacity) VALUES ('ModelA', 'Truck', 100);
INSERT INTO VehicleModel (model, vehicleType, vehicleCapacity) VALUES ('ModelB', 'Van', 150);
INSERT INTO VehicleModel (model, vehicleType, vehicleCapacity) VALUES ('ModelC', 'Truck', 200);
INSERT INTO VehicleModel (model, vehicleType, vehicleCapacity) VALUES ('ModelD', 'Truck', 120);
INSERT INTO VehicleModel (model, vehicleType, vehicleCapacity) VALUES ('ModelE', 'Van', 130);

INSERT INTO FreightClass (weight, package_size, freightClass) VALUES (10,  5, 1);
INSERT INTO FreightClass (weight, package_size, freightClass) VALUES (20, 10, 2);
INSERT INTO FreightClass (weight, package_size, freightClass) VALUES (15, 15, 2);
INSERT INTO FreightClass (weight, package_size, freightClass) VALUES (25, 20, 3);
INSERT INTO FreightClass (weight, package_size, freightClass) VALUES (25, 100, 3);
INSERT INTO FreightClass (weight, package_size, freightClass) VALUES (30, 25, 4);
INSERT INTO FreightClass (weight, package_size, freightClass) VALUES (30, 75, 5);

INSERT INTO Customer (userID, contactNumber, name, password, homeAddress) VALUES (1, '1234567890', 'Alice Smith', 'customer1', '123 Elm Street');
INSERT INTO Customer (userID, contactNumber, name, password, homeAddress) VALUES (2, '2345678901', 'Bob Johnson', 'customer2', '456 Oak Avenue');
INSERT INTO Customer (userID, contactNumber, name, password, homeAddress) VALUES (3, '3456789012', 'Carol Davis', 'customer3', '789 Pine Road');
INSERT INTO Customer (userID, contactNumber, name, password, homeAddress) VALUES (4, '4567890123', 'David Brown', 'customer4', '321 Maple Lane');
INSERT INTO Customer (userID, contactNumber, name, password, homeAddress) VALUES (5, '5678901234', 'Eve Wilson', 'customer5', '654 Cedar Blvd');

INSERT INTO Supplier (userID, contactNumber, name, password, supplyType) VALUES (1, '1112223333', 'SupplyCo',   'supplier1', 'Electronics');
INSERT INTO Supplier (userID, contactNumber, name, password, supplyType) VALUES (2, '2223334444', 'FreshFarms', 'supplier2', 'Groceries');
INSERT INTO Supplier (userID, contactNumber, name, password, supplyType) VALUES (3, '3334445555', 'TechGear',   'supplier3', 'Hardware');
INSERT INTO Supplier (userID, contactNumber, name, password, supplyType) VALUES (4, '4445556666', 'FashionHub', 'supplier4', 'Clothing');
INSERT INTO Supplier (userID, contactNumber, name, password, supplyType) VALUES (5, '5556667777', 'BookWorld',  'supplier5', 'Books');

INSERT INTO Carrier (userID, contactNumber, name, password, serviceArea, overallRating) VALUES (1, '7778889999', 'FastTrans',   'carrier1', 'North',   5);
INSERT INTO Carrier (userID, contactNumber, name, password, serviceArea, overallRating) VALUES (2, '8889990000', 'QuickMove',   'carrier2', 'South',   4);
INSERT INTO Carrier (userID, contactNumber, name, password, serviceArea, overallRating) VALUES (3, '9990001111', 'SpeedyShip',  'carrier3', 'East',5);
INSERT INTO Carrier (userID, contactNumber, name, password, serviceArea, overallRating) VALUES (4, '0001112222', 'ExpressWay',  'carrier4', 'West',3);
INSERT INTO Carrier (userID, contactNumber, name, password, serviceArea, overallRating) VALUES (5, '1112223333', 'RapidLogistics',  'carrier5', 'Central', 2);

INSERT INTO Carrier (userID, contactNumber, name, password, serviceArea, overallRating) VALUES (6, '7778889991', 'FastTrans',   'carrier6', 'South',   5);
INSERT INTO Carrier (userID, contactNumber, name, password, serviceArea, overallRating) VALUES (7, '8889990001', 'QuickMove',   'carrier7', 'North',   1);
INSERT INTO Carrier (userID, contactNumber, name, password, serviceArea, overallRating) VALUES (8, '9990001112', 'SpeedyShip',  'carrier8', 'West',2);
INSERT INTO Carrier (userID, contactNumber, name, password, serviceArea, overallRating) VALUES (9, '0001112221', 'ExpressWay',  'carrier9', 'Central',3);
INSERT INTO Carrier (userID, contactNumber, name, password, serviceArea, overallRating) VALUES (10, '1112223331', 'RapidLogistics',  'carrier10', 'East', 3);

INSERT INTO Warehouse (warehouseID, address, storageCapacity) VALUES (1, '10 Warehouse Lane',  1000);
INSERT INTO Warehouse (warehouseID, address, storageCapacity) VALUES (2, '20 Depot Road',  1500);
INSERT INTO Warehouse (warehouseID, address, storageCapacity) VALUES (3, '30 Storage Blvd',1200);
INSERT INTO Warehouse (warehouseID, address, storageCapacity) VALUES (4, '40 Distribution Ave',2000);
INSERT INTO Warehouse (warehouseID, address, storageCapacity) VALUES (5, '50 Logistic St', 1800);

INSERT INTO "Order" (orderNumber, orderDate, totalCost, customerID, supplierID) VALUES (1001, DATE '2025-01-01', 250.00, 1, 1);
INSERT INTO "Order" (orderNumber, orderDate, totalCost, customerID, supplierID) VALUES (1002, DATE '2025-01-02', 150.00, 2, 2);
INSERT INTO "Order" (orderNumber, orderDate, totalCost, customerID, supplierID) VALUES (1003, DATE '2025-01-03', 350.00, 3, 3);
INSERT INTO "Order" (orderNumber, orderDate, totalCost, customerID, supplierID) VALUES (1004, DATE '2025-01-04', 450.00, 4, 4);
INSERT INTO "Order" (orderNumber, orderDate, totalCost, customerID, supplierID) VALUES (1005, DATE '2025-01-05', 550.00, 5, 5);

INSERT INTO "Order" (orderNumber, orderDate, totalCost, customerID, supplierID) VALUES (1006, DATE '2025-01-01', 99.00, 1, 1);
INSERT INTO "Order" (orderNumber, orderDate, totalCost, customerID, supplierID) VALUES (1007, DATE '2025-01-02', 50.00, 2, 2);
INSERT INTO "Order" (orderNumber, orderDate, totalCost, customerID, supplierID) VALUES (1008, DATE '2025-01-03', 750.00, 2, 3);
INSERT INTO "Order" (orderNumber, orderDate, totalCost, customerID, supplierID) VALUES (1009, DATE '2025-01-04', 150.00, 2, 4);
INSERT INTO "Order" (orderNumber, orderDate, totalCost, customerID, supplierID) VALUES (1010, DATE '2025-01-05', 80.00, 5, 5);

INSERT INTO OrderPayment (orderNumber, paymentStatus) VALUES (1001, 'Paid');
INSERT INTO OrderPayment (orderNumber, paymentStatus) VALUES (1002, 'Unpaid');
INSERT INTO OrderPayment (orderNumber, paymentStatus) VALUES (1003, 'Paid');
INSERT INTO OrderPayment (orderNumber, paymentStatus) VALUES (1004, 'Unpaid');
INSERT INTO OrderPayment (orderNumber, paymentStatus) VALUES (1005, 'Paid');

INSERT INTO OrderPayment (orderNumber, paymentStatus) VALUES (1006, 'Paid');
INSERT INTO OrderPayment (orderNumber, paymentStatus) VALUES (1007, 'Unpaid');
INSERT INTO OrderPayment (orderNumber, paymentStatus) VALUES (1008, 'Paid');
INSERT INTO OrderPayment (orderNumber, paymentStatus) VALUES (1009, 'Unpaid');
INSERT INTO OrderPayment (orderNumber, paymentStatus) VALUES (1010, 'Paid');

INSERT INTO Invoice (invoiceNumber, invoiceDate, orderNumber) VALUES (5001, DATE '2025-01-06', 1001);
INSERT INTO Invoice (invoiceNumber, invoiceDate, orderNumber) VALUES (5002, DATE '2025-01-07', 1002);
INSERT INTO Invoice (invoiceNumber, invoiceDate, orderNumber) VALUES (5003, DATE '2025-01-08', 1003);
INSERT INTO Invoice (invoiceNumber, invoiceDate, orderNumber) VALUES (5004, DATE '2025-01-09', 1004);
INSERT INTO Invoice (invoiceNumber, invoiceDate, orderNumber) VALUES (5005, DATE '2025-01-10', 1005);

INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('ABC123', 1, 'ModelA');
INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('ABC321', 1, 'ModelB');
INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('CBA321', 1, 'ModelC');

INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('DEF456', 2, 'ModelB');
INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('DEF654', 2, 'ModelC');
INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('FED654', 2, 'ModelD');

INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('GHI789', 3, 'ModelC');
INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('GHI987', 3, 'ModelD');
INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('IHG987', 3, 'ModelE');

INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('JKL012', 4, 'ModelD');
INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('JKL210', 4, 'ModelE');
INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('LKJ210', 4, 'ModelA');

INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('MNO345', 5, 'ModelE');
INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('MNO543', 5, 'ModelA');
INSERT INTO Vehicle (licensePlate, carrierID, model) VALUES ('ONM345', 5, 'ModelB');


INSERT INTO Shipment (trackingNumber, shipmentStatus, shippingTime, shipmentDate, supplierID, licensePlate, carrierID) VALUES (101, 'InTransit', TO_TIMESTAMP('2025-01-11 10:00:00', 'YYYY-MM-DD HH24:MI:SS'), DATE '2025-01-11', 1, 'ABC123', 1);
INSERT INTO Shipment (trackingNumber, shipmentStatus, shippingTime, shipmentDate, supplierID, licensePlate, carrierID) VALUES (102, 'Delivered', TO_TIMESTAMP('2025-01-12 11:00:00', 'YYYY-MM-DD HH24:MI:SS'), DATE '2025-01-12', 2, 'DEF456', 2);
INSERT INTO Shipment (trackingNumber, shipmentStatus, shippingTime, shipmentDate, supplierID, licensePlate, carrierID) VALUES (103, 'Pending',   TO_TIMESTAMP('2025-01-13 12:00:00', 'YYYY-MM-DD HH24:MI:SS'), DATE '2025-01-13', 3, 'GHI789', 3);
INSERT INTO Shipment (trackingNumber, shipmentStatus, shippingTime, shipmentDate, supplierID, licensePlate, carrierID) VALUES (104, 'Cancelled', TO_TIMESTAMP('2025-01-14 13:00:00', 'YYYY-MM-DD HH24:MI:SS'), DATE '2025-01-14', 4, 'JKL012', 4);
INSERT INTO Shipment (trackingNumber, shipmentStatus, shippingTime, shipmentDate, supplierID, licensePlate, carrierID) VALUES (105, 'InTransit', TO_TIMESTAMP('2025-01-15 14:00:00', 'YYYY-MM-DD HH24:MI:SS'), DATE '2025-01-15', 5, 'MNO345', 5);

INSERT INTO Package (packageNumber, shipmentNumber, weight, hazards, package_size) VALUES (1, 101, 10, 'None',  5);
INSERT INTO Package (packageNumber, shipmentNumber, weight, hazards, package_size) VALUES (2, 102, 20, 'Fragile',   10);
INSERT INTO Package (packageNumber, shipmentNumber, weight, hazards, package_size) VALUES (3, 103, 15, 'Flammable', 15);
INSERT INTO Package (packageNumber, shipmentNumber, weight, hazards, package_size) VALUES (4, 104, 25, 'None',  20);
INSERT INTO Package (packageNumber, shipmentNumber, weight, hazards, package_size) VALUES (7, 104, 25, 'None',  100);
INSERT INTO Package (packageNumber, shipmentNumber, weight, hazards, package_size) VALUES (5, 105, 30, 'Corrosive', 25);
INSERT INTO Package (packageNumber, shipmentNumber, weight, hazards, package_size) VALUES (6, 105, 30, 'Corrosive', 75);

INSERT INTO ShipmentFeedback (shipmentNumber, rating, message) VALUES (101, 5, 'Excellent service!');
INSERT INTO ShipmentFeedback (shipmentNumber, rating, message) VALUES (102, 4, 'Good delivery.');
INSERT INTO ShipmentFeedback (shipmentNumber, rating, message) VALUES (103, 3, 'Average experience.');
INSERT INTO ShipmentFeedback (shipmentNumber, rating, message) VALUES (104, 2, 'Delayed delivery.');
INSERT INTO ShipmentFeedback (shipmentNumber, rating, message) VALUES (105, 1, 'Poor service.');

INSERT INTO DeliveryFeedback (refNumber, customerID, shipmentNumber) VALUES (1, 1, 101);
INSERT INTO DeliveryFeedback (refNumber, customerID, shipmentNumber) VALUES (2, 2, 102);
INSERT INTO DeliveryFeedback (refNumber, customerID, shipmentNumber) VALUES (3, 3, 103);
INSERT INTO DeliveryFeedback (refNumber, customerID, shipmentNumber) VALUES (4, 4, 104);
INSERT INTO DeliveryFeedback (refNumber, customerID, shipmentNumber) VALUES (5, 5, 105);

INSERT INTO Prepares (warehouseID, shipmentNumber) VALUES (1, 101);
INSERT INTO Prepares (warehouseID, shipmentNumber) VALUES (2, 102);
INSERT INTO Prepares (warehouseID, shipmentNumber) VALUES (3, 103);
INSERT INTO Prepares (warehouseID, shipmentNumber) VALUES (4, 104);
INSERT INTO Prepares (warehouseID, shipmentNumber) VALUES (5, 105);

INSERT INTO PicksUpFrom (warehouseID, carrierID) VALUES (1, 1);
INSERT INTO PicksUpFrom (warehouseID, carrierID) VALUES (2, 2);
INSERT INTO PicksUpFrom (warehouseID, carrierID) VALUES (3, 3);
INSERT INTO PicksUpFrom (warehouseID, carrierID) VALUES (4, 4);
INSERT INTO PicksUpFrom (warehouseID, carrierID) VALUES (5, 5);
