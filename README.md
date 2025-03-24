# Flexible Product Model Backend

This is a backend system designed for an inventory management system where different customers can define custom attributes for their products. The system is built using **TypeScript**, **Node.js**, **Express**, and **PostgreSQL**. This API supports creating products, defining custom attributes, fetching product details (including custom attributes), and filtering products based on custom attributes.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Design Decisions](#design-decisions)

## Prerequisites

Before you can run the project, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** (v6 or higher)
- **TypeScript** (for development)

## Installation

### 1. Clone the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/wromero/inventory-system.git
cd inventory-system
```

### 2. Install Dependencies
Install the required dependencies using npm:
```bash
npm install
```

## 3. Set Up PostgreSQL Database
Create a new database and run the provided SQL script to create the necessary tables. You can use a PostgreSQL client such as pgAdmin or run the following commands in the psql command-line interface:
```sql
-- Create the database
CREATE DATABASE inventory;

-- Use the database
\c inventory;

-- Execute the SQL schema
-- Copy the SQL schema below and execute it

-- Customers Table
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE
);

-- Attributes Table
CREATE TABLE attributes (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL  -- e.g., 'string', 'number', 'boolean'
);

-- ProductAttributes Table (Dynamic Attributes for Products)
CREATE TABLE product_attributes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  attribute_id INTEGER REFERENCES attributes(id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL -- Value for the attribute (e.g., 'red', 'US12')
);
```

### 4. Configure Database Connection
In the .env file, configure the PostgreSQL connection to match your local setup. For example, update the following block with your PostgreSQL credentials:
```bash
DB_USER = 
DB_HOST = 
DB_NAME = 
DB_PASSWORD = 
DB_PORT = 
```

### 5. Run the Application
Once the dependencies are installed and the database is set up, run the application:
```bash
npm run dev    # Run the TypeScript files
```

The server will be running at http://localhost:8081.

## API Endpoints
### 1. Create a New Customer
    • URL: /api/customers 
    • Method: POST 
    • Request Body: 
  ```json
      {
        "name": "Fresh Produce Company"
      }
  ```
    • Response: 
  ```json
      {
        "id": 1,
        "name": "Fresh Produce Company"
      }
  ```
### 2. Create a New Product for a Customer
    • URL: /api/customers/:customerId/products 
    • Method: POST 
    • Request Body: 
  ```json
      {
        "sku": "P001",
        "name": "Apple"
      }
  ```
    • Response: 
  ```json
      {
        "id": 1,
        "sku": "P001",
        "name": "Apple",
        "customer_id": 1
      }
  ```
### 3. Define Custom Attributes for a Customer
    • URL: /api/customers/:customerId/attributes 
    • Method: POST 
    • Request Body: 
  ```json
      {
        "name": "color",
        "type": "string"
      }
  ```
    • Response: 
  ```json
      {
        "id": 1,
        "customer_id": 1,
        "name": "color",
        "type": "string"
      }
  ```
### 4. Get Product Details Including Custom Attributes
    • URL: /api/products/:productId 
    • Method: GET 
    • Response: 
  ```json
      {
        "id": 1,
        "sku": "P001",
        "name": "Apple",
        "customAttributes": [
          {
            "name": "color",
            "value": "red"
          }
        ]
      }
  ```
### 5. Filter Products Based on Custom Attributes
    • URL: /api/productsfilter 
    • Method: POST 
    • Request Query: 
  ```json
      {
        [
          {
            "attributeName": "color",
            "value": "red"
          }
        ]
      }
  ```
    • Response: 
  ```json
      [
        {
          "id": 1,
          "sku": "P001",
          "name": "Apple"
        }
      ]
  ```
## Testing
You can use tools like Postman or cURL to interact with the API.
To test the API, you can send requests for creating customers, products, defining attributes, and querying product details.
### Example cURL Commands:
Create Customer:
```bash
curl -X POST http://localhost:8081/api/customers -H "Content-Type: application/json" -d '{"name": "Fresh Produce Company"}'
```
Create Product:
```bash
curl -X POST http://localhost:8081/api/customers/1/products -H "Content-Type: application/json" -d '{"sku": "P001", "name": "Apple"}'
```
Define Attribute:
```bash
curl -X POST http://localhost:8081/api/customers/1/attributes -H "Content-Type: application/json" -d '{"name": "color", "type": "string"}'
```
Get Product Details:
```bash
curl http://localhost:8081/api/products/1
```

### Run unit tests
```bash
npm run test
```

## Design Decisions
### 1. Flexible Attributes
The design uses two core tables for attributes: attributes and product_attributes. This allows each customer to define their own custom attributes for products. This way, the system is scalable and adaptable to different customer needs.
### 2. Dynamic Filtering
The dynamic filtering endpoint allows users to search for products based on their custom attributes. This feature is built using SQL clauses to dynamically filter products by the attributes that have been defined.
