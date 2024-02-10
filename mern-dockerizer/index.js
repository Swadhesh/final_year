const express = require('express');
const multer = require('multer');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public')); // Serve static files from the 'public' folder

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const docker = new Docker();

app.post('/upload', upload.single('mernApp'), (req, res) => {
  const appFolder = path.join(__dirname, 'uploads', req.file.originalname);

  docker.buildImage({
    context: appFolder,
    src: ['Dockerfile'],
  }, { t: 'mern-app-image' }, (err, stream) => {
    if (err) {
      console.error('Error building Docker image:', err);
      res.status(500).send('Error building Docker image');
      return;
    }

    docker.modem.followProgress(stream, (err, output) => {
      if (err) {
        console.error('Error building Docker image:', err);
        res.status(500).send('Error building Docker image');
        return;
      }

      const container = docker.run('mern-app-image', [], process.stdout, {
        ExposedPorts: { '3000/tcp': {} },
        Hostconfig: { PortBindings: { '3000/tcp': [{ HostPort: '3000' }] } },
      }, (err, data, container) => {
        if (err) {
          console.error('Error running Docker container:', err);
          res.status(500).send('Error running Docker container');
          return;
        }

        res.status(200).send('MERN app Dockerized and running on port 3000');
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
