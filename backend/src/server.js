require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const requireAuth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const { getImage } = require('./controllers/itemsController');

const authRouter = require('./routes/auth');
const itemsRouter = require('./routes/items');
const outfitsRouter = require('./routes/outfits');
const feedbackRouter = require('./routes/feedback');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => res.json({ ok: true }));

// Item images are public, like the static files they replaced — the client
// renders them with <Image src>, which can't send an Authorization header.
app.get('/api/images/:id', getImage);

// Register/login are public; everything else requires a valid session.
app.use('/api/auth', authRouter);
app.use('/api/items', requireAuth, itemsRouter);
app.use('/api/outfits', requireAuth, outfitsRouter);
app.use('/api/feedback', requireAuth, feedbackRouter);

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
