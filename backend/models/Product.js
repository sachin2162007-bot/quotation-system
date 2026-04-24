const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    specifications: {
      // Flexible key-value store (e.g. { "Voltage": "220V", "Power": "5kW" })
      type: Map,
      of: String,
      default: {},
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    unit: {
      type: String,
      default: 'Piece',
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// Full-text search index
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
