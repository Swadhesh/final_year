// server/index.js
const express = require('express');
const bodyParser = require('body-parser');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 9000;

app.use(bodyParser.json());
app.use(cors());

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
  execSync('sudo docker-compose up -d --build', { stdio: 'inherit' });

  res.status(200).send('MERN app setup initiated!');
});

app.post('/run-mean', (req, res) => {
  const { repoUrl } = req.body;

  // Step 1: Clone the GitHub repository
  execSync(`git clone ${repoUrl}`, { stdio: 'inherit' });

  // Step 2: Create Dockerfiles for client and server subfolders
  const createDockerfile = (folderPath, imageName, exposePort) => {
const dockerfileContent = `
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE ${exposePort}
CMD ["ng","serve","--host","0.0.0.0","--disable-host-check"]
`;

      fs.writeFileSync(path.join(folderPath, 'Dockerfile'), dockerfileContent.trim());
      console.log(`Dockerfile created for ${imageName}`);
  };

  process.chdir('mean-appl');
  createDockerfile('Frontend', 'client', 4200);
  createDockerfile('Backend', 'server', 3200);

  // Step 3: Generate Docker Compose file
const dockerComposeContent = `
version: '3'
services:
  client:
    build:
      context: ./Frontend
    ports:
      - "4200:4200"
  server:
    build:
      context: ./Backend
    ports:
      - "3200:3200"
`;

  fs.writeFileSync('docker-compose.yml', dockerComposeContent.trim());
  console.log('docker-compose.yml created');

  // Step 4: Build and run Docker Compose
  execSync('sudo docker-compose up -d --build', { stdio: 'inherit' });

  res.status(200).send('MEAN app setup initiated!');
});

// app.post('/run-mean', (req, res) => {
//   const { repoUrl } = req.body;

//   // Step 1: Clone the GitHub repository
//   execSync(`git clone ${repoUrl}`, { stdio: 'inherit' });

//   // Step 2: Create Dockerfiles for client and server subfolders
//   const createDockerfile = (folderPath, imageName, exposePort, isFrontend = false) => {
//     let dockerfileContent;
//     if (isFrontend) {
//       dockerfileContent = `
// FROM node:14 AS build-stage
// WORKDIR /app
// COPY package*.json ./
// RUN npm install
// COPY . .
// RUN npm run build --prod

// FROM nginx:alpine AS production-stage
// COPY --from=build-stage /app/dist /usr/share/nginx/html
// EXPOSE ${exposePort}
// CMD ["nginx", "-g", "daemon off;"]
// `;
//     } else {
//       dockerfileContent = `
// FROM node:14
// WORKDIR /app
// COPY package*.json ./
// RUN npm install
// COPY . .
// EXPOSE ${exposePort}
// CMD ["npm", "start"]
// `;
//     }

//     fs.writeFileSync(path.join(folderPath, 'Dockerfile'), dockerfileContent.trim());
//     console.log(`Dockerfile created for ${imageName}`);
//   };

//   process.chdir('mean-appl');
//   createDockerfile('Frontend', 'client', 80, true); // Exposing port 80 for NGINX
//   createDockerfile('Backend', 'server', 3200);

//   // Step 3: Generate Docker Compose file
//   const dockerComposeContent = `
// version: '3'
// services:
//   client:
//     build:
//       context: ./Frontend
//     ports:
//       - "80:80" # Map NGINX container port to port 80 on host
//   server:
//     build:
//       context: ./Backend
//     ports:
//       - "3200:3200"
// `;

//   fs.writeFileSync('docker-compose.yml', dockerComposeContent.trim());
//   console.log('docker-compose.yml created');

//   // Step 4: Build and run Docker Compose
//   execSync('sudo docker-compose up -d --build', { stdio: 'inherit' });

//   res.status(200).send('MEAN app setup initiated!');
// });


app.listen('9000','0.0.0.0',()=>{
  console.log("server is listening on 9000 port");
})

