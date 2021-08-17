require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const tmi = require('tmi.js');
const { join } = require('path');
const httpServer = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(httpServer);

const options = {
  options: {
    debug: false
  },
  connection: {
    reconnect: true
  },
  identity: {
    username: process.env.USERNAME,
    password: process.env.TOKEN
  },
  channels: [process.env.CHANNELS]
};

const client = new tmi.client(options);
const ignoredUsers = ['Streamlabs', 'PretzelRocks'];

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

app.use(express.static(join(__dirname, '../public')));

httpServer.listen(process.env.PORT, () => {
  console.log(`Listen on port ${process.env.PORT}`);
});

io.on('connection', socket => {
  console.log('UN USUARIO SE HA CONECTADO');
});

client.connect();

// Filtro de mensajes con @

const filterRegexAt = /@/g;

const filterMessages = message => {
  const result = /(.*)(@DorianDesigns)(.*)/g.exec(message);
  return (
    result &&
    result.length &&
    ((result[2] && result[1]) || (result[2] && result[3]))
  );
};

client.on('message', (channel, ctx, message, self) => {
  if (
    self ||
    message.startsWith('!') ||
    ignoredUsers.includes(ctx['display-name']) ||
    filterMessages(message)
  )
    return;

  // Objeto con mensaje, emotes, suscriptor, mod
  const msgConfig = {
    user: ctx['display-name'],
    message: message,
    emotes: ctx.emotes,
    sub: ctx.subscriber,
    mod: ctx.mod
  };
  // console.log(`${ctx['display-name']}: ${message}`);
  io.emit('message', msgConfig);
  // console.log(ctx);
});

// https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_8c2887e0898547aabb83ffc71e8d1f71/1.0
