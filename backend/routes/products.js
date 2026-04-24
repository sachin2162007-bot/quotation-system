const express = require('express');
const router = express.Router();

let products = []; // temporary storage

// GET products
router.get('/', (req, res) => {
  res.json(products);
});

// ADD product
router.post('/', (req, res) => {
  const { name, category, description, image } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name required' });
  }

  const newProduct = {
    _id: Date.now().toString(),
    name,
    category,
    description,
    image
  };

  products.push(newProduct);

  res.json({ message: 'Product added ✅', product: newProduct });
});

module.exports = router;