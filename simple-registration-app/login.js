// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Create an Express app
const app = express();
const PORT = process.env.PORT || 4600;

// Enable CORS
app.use(cors());

// Connect to MongoDB (make sure your MongoDB server is running)
mongoose.connect('mongodb+srv://Swadhesh:swadplac472@details.q0ysjlg.mongodb.net/Registration', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Create a user schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

// Create a user model
const User = mongoose.model('User', userSchema);

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Serve HTML page for login
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

// Handle login POST request
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('Received login request:', { email, password });

  try {
    // Check if the user with the given email exists
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found');
      res.status(404).send('User not found');
      return;
    }

    // Check if the password matches
    if (user.password === password) {
      console.log('Login successful!');
      res.send('Login successful!');
    } else {
      console.log('Incorrect password');
      res.status(401).send('Incorrect password');
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Error during login');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
