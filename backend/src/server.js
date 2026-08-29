require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userId = require('./middleware/userId');
const errorHandler = require('./middleware/errorHandler');

const itemsRouter = require('./routes/items');
const outfitsRouter = require('./routes/outfits');
const feedbackRouter = require('./routes/feedback');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(userId);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/items', itemsRouter);
app.use('/api/outfits', outfitsRouter);
app.use('/api/feedback', feedbackRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
