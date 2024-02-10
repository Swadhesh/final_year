// server/index.js
const express = require('express');
const bodyParser = require('body-parser');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 9000;

app.use(bodyParser.json());

app.post('/run-app', (req, res) => {
  const { repoUrl } = req.body;

  // Step 1: Clone the GitHub repository
  execSync(`git clone ${repoUrl}`, { stdio: 'inherit' });

  // Step 2: Create Dockerfiles for client and server subfolders
  const createDockerfile = (folderPath, imageName, exposePort) => {
const dockerfileContent = `
FROM node:20-alpine3.18
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE ${exposePort}
CMD ["npm", "start"]
`;

    fs.writeFileSync(path.join(folderPath, 'Dockerfile'), dockerfileContent.trim());
    console.log(`Dockerfile created for ${imageName}`);
  };

  process.chdir('mern-app');
  createDockerfile('client', 'client', 3000);
  createDockerfile('server', 'server', 5230);

  // Step 3: Generate Docker Compose file
const dockerComposeContent = `
version: '3'
services:
  client:
    build:
      context: ./client
    ports:
      - 3000:3000
  server:
    build:
      context: ./server
    ports:
      - 5230:5230
`;

  fs.writeFileSync('docker-compose.yml', dockerComposeContent.trim());
  console.log('docker-compose.yml created');

  // Step 4: Build and run Docker Compose
  execSync('docker-compose up -d --build', { stdio: 'inherit' });

  res.status(200).send('MERN app setup initiated!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
