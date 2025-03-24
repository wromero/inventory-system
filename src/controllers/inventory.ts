import  { Request, Response } from 'express';
import pkg from 'pg';
import dotenv from 'dotenv'; 

const { Pool } = pkg;
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT as string),
    });
    
export const seedDatabase = async (req: Request, res: Response) => {
  // Seed customers
  try {
  await pool.query('INSERT INTO customers (name) VALUES ($1)', ['Fresh Produce Company']);
  await pool.query('INSERT INTO customers (name) VALUES ($1)', ['Shoe Manufacturer']);
  
  // Seed attributes for fresh produce company
  await pool.query('INSERT INTO attributes (customer_id, name, type) VALUES ($1, $2, $3)', [1, 'color', 'string']);
  await pool.query('INSERT INTO attributes (customer_id, name, type) VALUES ($1, $2, $3)', [1, 'size', 'string']);
  
  // Seed attributes for shoe manufacturer
  await pool.query('INSERT INTO attributes (customer_id, name, type) VALUES ($1, $2, $3)', [2, 'size', 'string']);
  await pool.query('INSERT INTO attributes (customer_id, name, type) VALUES ($1, $2, $3)', [2, 'material', 'string']);
  
  // Seed a product for Fresh Produce Company
  const result = await pool.query('INSERT INTO products (sku, name, customer_id) VALUES ($1, $2, $3) RETURNING *', ['P001', 'Apple', 1]);
  res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed database' });
  }
}

export const postCustomer = async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO customers (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

export const postProduct = async (req: Request, res: Response) => {
  const customerId = req.params.customerId;
  const { sku, name } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO products (sku, name, customer_id) VALUES ($1, $2, $3) RETURNING *',
      [sku, name, customerId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const postAttribute = async (req: Request, res: Response) => {
  const customerId = req.params.customerId;
  const { name, type } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO attributes (customer_id, name, type) VALUES ($1, $2, $3) RETURNING *',
      [customerId, name, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create attribute' });
  }
};

export const postProductAttribute = async (req: Request, res: Response): Promise<any> => {
    const { productId } = req.params;
    const { attributeName, value } = req.body;
  
    try {
      const productResult = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [productId]
      );
  
      if (productResult.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      const product = productResult.rows[0];
      const customerId = product.customer_id; 

      const attributeResult = await pool.query(
        'SELECT id FROM attributes WHERE customer_id = $1 AND name = $2',
        [customerId, attributeName]
      );
  
      if (attributeResult.rows.length === 0) {
        return res.status(400).json({ error: 'Attribute not found' });
      }
  
      const attributeId = attributeResult.rows[0].id;
  
  
      const insertResult = await pool.query(
        'INSERT INTO product_attributes (product_id, attribute_id, value) VALUES ($1, $2, $3) RETURNING *',
        [productId, attributeId, value]
      );
  
      res.status(201).json(insertResult.rows[0]);
    } catch (error) {
      console.error('Error creating product attribute:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  export const getProducts = async (req: Request, res: Response): Promise<any> => {
    const productId = req.params.productId;
  
    try {
      const productResult = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [productId]
      );
  
      if (productResult.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      const product = productResult.rows[0];
  
      const attributesResult = await pool.query(
        'SELECT a.name, pa.value FROM product_attributes pa ' +
        'JOIN attributes a ON pa.attribute_id = a.id ' +
        'WHERE pa.product_id = $1',
        [productId]
      );
  
      res.json({
        ...product,
        customAttributes: attributesResult.rows,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch product details' });
    }
  };

  export const getProductsFilter = async (req: Request, res: Response) => {

    const filter = req.query as { attributeName: string, value: string };


    try {
        const filterQuery = `
        SELECT p.*, a.name AS attribute_name, pa.value 
        FROM products p
        JOIN product_attributes pa ON p.id = pa.product_id
        JOIN attributes a ON pa.attribute_id = a.id
        WHERE a.name = $1 AND pa.value = $2
        `;
        const result = await pool.query(filterQuery, [filter.attributeName, filter.value]);
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        
        res.status(500).json({ message: "Error fetching products" });
    }
};
