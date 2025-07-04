const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./db');
const aiRouter = require('./routes/ai');
const serviceRouter = require('./routes/services'); // ✅ Import your service routes

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRouter);
app.use('/api/services', serviceRouter); // ✅ Mount the router here

connectDB().then(() => {
  const PORT =  4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
