
const express = require('express');
const cors = require('cors');
require('dotenv').config(); 

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// First route
app.get('/', (req, res) => {
  res.json({ message: 'Hello, Express is running!' });
});

// Start server using PORT from .env
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
