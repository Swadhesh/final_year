const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4500;
const cors = require('cors');
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

// Serve HTML page for registration
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/registration.html');
});

// Handle registration POST request
// Handle registration GET and POST requests
app.route('/register')
  .get((req, res) => {
    res.sendFile(__dirname + '/registration.html');
  })
  .post(async (req, res) => {
    const { name, email, password } = req.body;

    console.log('Received registration request:', { name, email, password });

    // Create a new user
    const newUser = new User({
      name,
      email,
      password,
    });

    try {
      // Save the user to the database
      await newUser.save();
      console.log('Registration successful!');
      res.send('Registration successful!');
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).send('Error registering user');
    }
  });


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
