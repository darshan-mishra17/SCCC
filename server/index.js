import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import aiRouter from './routes/ai.js';
import quotationsRouter from './routes/quotations.js';
import authRouter from './routes/auth.js';
import chatRouter from './routes/chat.js';

// import serviceRouter from './routes/services.js';

dotenv.config({ path: './.env' });

// Temporary hardcoded values to get server running
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb+srv://Sccc:SCCC%40abc123@cluster0.yhomiud.mongodb.net/sccc';
}
if (!process.env.PORT) {
  process.env.PORT = '4000';
}
if (!process.env.GROQ_API_KEY) {
  process.env.GROQ_API_KEY = 'placeholder_key_will_use_fallback';
}

console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***SET***' : 'UNDEFINED');
console.log('PORT:', process.env.PORT);
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '***SET***' : 'UNDEFINED');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRouter);
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/quotations', quotationsRouter);
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
