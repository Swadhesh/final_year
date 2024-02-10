const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoUrl = 'https://github.com/Swadhesh/mern-app.git';
const appPort = 3000; // Specify the port you want the app to run on

// Step 1: Clone the GitHub repository
execSync(`git clone ${repoUrl}`, { stdio: 'inherit' });

// Step 2: Create Dockerfiles for client and server subfolders
const createDockerfileClient = (folderPath, imageName) => {
  const dockerfileContent = `
FROM node:20-alpine3.18
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
`;

  fs.writeFileSync(path.join(folderPath, 'Dockerfile'), dockerfileContent.trim());
  console.log(`Dockerfile created for ${imageName}`);
};

const createDockerfileServer = (folderPath, imageName) => {
  const dockerfileContent = `
FROM node:20-alpine3.18
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5230
CMD ["npm", "start"]
`;

  fs.writeFileSync(path.join(folderPath, 'Dockerfile'), dockerfileContent.trim());
  console.log(`Dockerfile created for ${imageName}`);
};

process.chdir('mern-app');
createDockerfileClient('client', 'client');
createDockerfileServer('server', 'server');

// Step 3: Generate Docker Compose file
const dockerComposeContent = `
version: '3'
services:
  client:
    build:
      context: ./client
    ports:
      - ${appPort}:3000
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