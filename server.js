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
const rooms = {};

app.use(bodyParser.json());
app.use(cors());
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Socket.io Server</title>
    </head>
    <body>
        <h1>Welcome to Socket.io Server</h1>
        <p>This is a simple Socket.io server.</p>
    </body>
    </html>
  `);
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
        // Send user input to the pseudo-terminal
        console.log("Received input",data.trim());
        ptyProcess.stdin.write(data + '\n'); 
        
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

  socket.on("createRoom", () => {
    const roomId = generateRoomId();
    socket.emit("roomCreated", roomId);
    socket.join(roomId);
    if (!rooms[roomId]) {
        rooms[roomId] = [];
    }
    rooms[roomId].push(socket);
    console.log(`User created and joined room ${roomId}`);
  });

  socket.on("joinRoom", roomId => {
      socket.join(roomId);
      if (!rooms[roomId]) {
          rooms[roomId] = [];
      }
      rooms[roomId].push(socket);
      console.log(`User joined room ${roomId}`);
  });

  socket.on("codeChange", (roomId, updatedCode) => {
    // Broadcast the updated code to all clients in the same room
    io.to(roomId).emit("codeUpdate", updatedCode);
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
