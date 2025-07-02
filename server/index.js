require('dotenv').config();
const express = require('express');
const cors = require('cors');
const aiRouter = require('./routes/ai');
const pricingRouter = require('./routes/pricing');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRouter);
app.use('/api/pricing', pricingRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SCCC Pricing Advisor API running on port ${PORT}`);
});
