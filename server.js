require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./server/db');
const { UPLOADS_DIR } = require('./server/middleware');
const apiRoutes = require('./server/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static assets
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// Health check for Railway
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'WFC Portal' }));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wachagga Family Community (WFC) Portal running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start WFC Portal:', err);
  process.exit(1);
});
