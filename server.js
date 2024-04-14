const express = require('express');
const http = require('http');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Server } = require('socket.io');

const port = 6501;
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const rooms = {};

app.use(bodyParser.json());
app.use(cors());

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

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

      const ptyProcess = spawn('sudo', ['docker', ...command], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      ptyProcess.stdout.on('data', (data) => {
        socket.emit('output', data.toString());
      });

      ptyProcess.stderr.on('data', (data) => {
        socket.emit('output', data.toString());
      });

      socket.on('input', (data) => {
        console.log("Received input", data.trim());
        ptyProcess.stdin.write(data + '\n');
      });

      socket.on('inputEnd', () => {
        console.log('Pseudo-terminal exited with code:', code);
        ptyProcess.stdin.end();
      });

      ptyProcess.on('exit', (code) => {
        socket.emit('exit', code);
      });
    } catch (error) {
      console.error('Error:', error);
      socket.emit('output', 'Internal Server Error');
    }
  });

  // Event handler for creating a room
  socket.on('createRoom', () => {
    const roomId = generateRoomId();
    socket.emit('roomCreated', roomId);
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(socket);
    // console.log(rooms);
    console.log(`User created and joined room ${roomId}`);
  });
 
  // Event handler for joining a room
  // Event handler for joining a room
  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      rooms[roomId].push(socket);
      // console.log(rooms);
      console.log(`User joined room ${roomId}`);
      socket.emit('roomJoined', { roomId, success: true }); // Emit success message
    } else {
      console.log(`Room ${roomId} does not exist`);
      socket.emit('roomJoined', { roomId, success: false }); // Emit failure message
    }
  });


  socket.on('updateCode', ({ roomId, code }) => {
    // Broadcast the updated code to all clients in the room except the sender
    socket.broadcast.to(roomId).emit('codeUpdated', { code });
});


  socket.on("disconnect", () => {
    console.log("A user disconnected");
    Object.keys(socket.rooms).forEach(roomId => {
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(s => s !== socket);
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        }
      }
    });
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
      return ['run', '-i', '--rm', imageName, '/bin/sh', '-c', `echo '${code}' > main.c && gcc main.c -o main && ./main`];
    case 'java':
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

function generateRoomId() {
  return Math.random().toString(36).substring(2, 6);
}
