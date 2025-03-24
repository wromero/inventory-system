import express, { Request, Response } from 'express';

import bodyParser from 'body-parser';

import { postCustomer, postProduct, postAttribute, postProductAttribute, getProducts, getProductsFilter, seedDatabase } from './controllers/inventory';

const app = express();

const port = process.env.PORT || 8081;

app.use(bodyParser.json());

// Prevent the default route
app.get('/', async (req: Request, res: Response) => {
  res.send('Service unavailable');
});


// 1. Create a new customer
app.post('/api/customers', postCustomer);

// 2. Create a new product for a customer
app.post('/api/customers/:customerId/products', postProduct);

// 3. Define custom attributes for a customer
app.post('/api/customers/:customerId/attributes', postAttribute);

// 4. Define product attributes linking a product to custom attributes and values
app.post('/api/products/:productId/attributes', postProductAttribute);

// 5. Get product details including custom attributes
app.get('/api/products/:productId', getProducts);

// 6. Filter products based on custom attributes
app.get('/api/productsfilter', getProductsFilter);

// Seed the database with some initial data. This is optional. Uncomment and Run this only once.
//app.get('/seed/database', seedDatabase);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;
