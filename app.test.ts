import request from 'supertest';
import  app  from './src/app'; // Import the Express app from app.ts
import pkg from 'pg';
import dotenv from 'dotenv'; 

const { Pool } = pkg;
dotenv.config();



// Initialize PostgreSQL client for testing
const pool = new Pool({
    user: process.env.DB_USER_TEST,
    host: process.env.DB_HOST_TEST,
    database: process.env.DB_NAME_TEST,
    password: process.env.DB_PASSWORD_TEST,
    port: 5432
});

beforeAll(async () => {
  // Before tests, create a clean test database
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      sku VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS attributes (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS product_attributes (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      attribute_id INTEGER REFERENCES attributes(id) ON DELETE CASCADE,
      value VARCHAR(255) NOT NULL
    );
  `);
});

afterAll(async () => {
  // After tests, clean up the test database
  await pool.query('DROP TABLE IF EXISTS product_attributes, attributes, products, customers');
  await pool.end();
});

describe('API Tests', () => {
  let customerId: number;
  let productId: number;
  let attributeId: number;

  // Test Case 1: Create a new customer
  it('should create a new customer', async () => {
    const response = await request(app)
      .post('/api/customers')
      .send({ name: 'Fresh Produce Company' });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Fresh Produce Company');
    customerId = response.body.id; // Store the customer ID for further tests
  });

  // Test Case 2: Create a new product for the customer
  it('should create a new product for the customer', async () => {
    const response = await request(app)
      .post(`/api/customers/${customerId}/products`)
      .send({ sku: 'P001', name: 'Apple' });

    expect(response.status).toBe(201);
    expect(response.body.sku).toBe('P001');
    expect(response.body.name).toBe('Apple');
    productId = response.body.id; // Store the product ID for further tests
  });

  // Test Case 3: Define custom attribute for the customer
  it('should define a custom attribute for the customer', async () => {
    const response = await request(app)
      .post(`/api/customers/${customerId}/attributes`)
      .send({ name: 'color', type: 'string' });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('color');
    attributeId = response.body.id; // Store the attribute ID for further tests
  });

  // Test Case 4: Fetch product details, including custom attributes
  it('should fetch product details including custom attributes', async () => {
    // Assign the attribute value to the product (color = red)

    const result = await request(app)
      .post(`/api/products/${productId}/attributes`)
      .send({ attributeName: 'color', value: 'red' })
      .then(async(res) => {
        const response = await request(app).get(`/api/products/${productId}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(productId);
        expect(response.body.customAttributes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'color',
              value: 'red',
            }),
          ])
        );
      });
      

    
  });

  // Test Case 5: Filter products based on custom attributes
  it('should filter products based on custom attributes', async () => {
    const response = await request(app)
      .get(`/api/productsfilter?attributeName=color&value=red`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: productId,
          sku: 'P001',
          name: 'Apple',
        }),
      ])
    );
  });
});