// server.js
const express = require('express');
const http = require('http');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Server } = require('socket.io');
const port = 6501;
const app = express();
const server = http.createServer(app);
// const server = http.createServer(app).listen(port, '0.0.0.0');
const io = new Server(server);

app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('runCode', ({ environment, code }) => {
    try {
      const imageName = getDockerImageName(environment);

      if (!imageName) {
        socket.emit('output', 'Invalid environment');
        return;
      }

      const command = getDockerRunCommand(imageName, code, environment);

      const ptyProcess = spawn('docker', command, {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'] // Add an additional pipe for user input
      });

      ptyProcess.stdout.on('data', (data) => {
        socket.emit('output', data.toString());
      });

      ptyProcess.stderr.on('data', (data) => {
        socket.emit('output', data.toString());
      });

      socket.on('input', (data) => {
        // Send user input to the pseudo-terminal
        console.log("Received input",data.trim());
        ptyProcess.stdin.write(data + '\n'); // Include a newline character to simulate pressing "Enter"
        
      });

      socket.on('inputEnd', () => {
        console.log('Pseudo-terminal exited with code:', code);
        ptyProcess.stdin.end(); // Signal the end of input
      });

      ptyProcess.on('exit', (code) => {
        socket.emit('exit', code);
      });
    } catch (error) {
      console.error('Error:', error);
      socket.emit('output', 'Internal Server Error');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function getDockerRunCommand(imageName, code, environment) {
  switch (environment) {
    case 'python':
      return ['run', '-i', '--rm', imageName, 'python', '-c', code];
    case 'c':
      return ['run', '-i', '--rm', imageName, '/bin/sh', '-c', `echo '${code}' > abc.c && gcc abc.c -o abc && ./abc`];
    case 'openjdk':
      return ['run', '-i', '--rm', imageName, '/bin/sh', '-c', `echo '${code}' > Main.java && javac Main.java && java Main`];
    default:
      return [];
  }
}

function getDockerImageName(environment) {
  switch (environment) {
    case 'python':
      return 'python:latest';
    case 'c':
      return 'gcc:latest';
    case 'openjdk':
      return 'openjdk:latest';
    default:
      return null;
  }
}
