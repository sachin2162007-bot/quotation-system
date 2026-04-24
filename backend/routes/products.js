const express = require('express');
const router = express.Router();

// Sample route (test)
router.get('/products', (req, res) => {
  res.json({ message: 'Products route working ✅' });
});

module.exports = router;