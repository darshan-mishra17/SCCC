import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import connectDB from './db.js';
import aiRouter from './routes/ai.js';
// import serviceRouter from './routes/services.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRouter);
// app.use('/api/services', serviceRouter);


const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Global error handler for logging and returning errors
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
