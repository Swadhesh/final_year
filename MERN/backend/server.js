const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3001;

// MongoDB connection string (replace with your actual connection string)
const mongoURI = 'mongodb+srv://Swadhesh:040702Swad@cluster0.isv02ds.mongodb.net/Testing';

app.get('/', async (req, res) => {
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Access the database
    const db = client.db();

    // Example: Insert a document into a collection
    const collection = db.collection('Data');
    const result = await collection.insertOne({ message: 'Hello from MongoDB!' });

    // Example: Retrieve documents from a collection
    const documents = await collection.find({}).toArray();

    // Close the MongoDB connection
    client.close();

    res.send({
      message: 'Hello, welcome to the home page!',
      mongoMessage: 'Message stored in MongoDB!',
      insertedDocument: result.ops[0],
      retrievedDocuments: documents,
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
