const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://Swadhesh:swadplac472@details.q0ysjlg.mongodb.net/?retryWrites=true&w=majority";

async function testConnection() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
  } finally {
    await client.close();
  }
}

testConnection();
