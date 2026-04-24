require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');

const authRoutes      = require('./routes/auth');
const productRoutes   = require('./routes/products');
const quotationRoutes = require('./routes/quotation');

// ─── App ──────────────────────────────────────────────────────
const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded product images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/quotation', quotationRoutes);

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ─── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ─── Database + Listen ────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅  MongoDB connected');
    await seedAdmin();          // ensure admin account exists
    app.listen(PORT, () =>
      console.log(`🚀  Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ─── Seed default admin ───────────────────────────────────────
async function seedAdmin() {
  const User     = require('./models/User');
  const bcrypt   = require('bcryptjs');
  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!existing) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await User.create({
      name:     'Admin',
      email:    process.env.ADMIN_EMAIL,
      password: hash,
      role:     'admin',
    });
    console.log('🛡️   Admin account seeded:', process.env.ADMIN_EMAIL);
  }
}
