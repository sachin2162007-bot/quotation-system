const express = require('express');
const router = express.Router();

// Send quotation
router.post('/send-quotation', (req, res) => {
  const { email, cart } = req.body;

  if (!email || !cart || cart.length === 0) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  console.log('📧 Quotation request:');
  console.log('Email:', email);
  console.log('Cart:', cart);

  // For now just simulate success
  res.json({ message: 'Quotation sent successfully ✅' });
});

module.exports = router;