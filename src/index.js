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
const filterRegexDorian = /(.*@DorianDesings)|(@DorianDesings.*)/gi;

client.on('message', (channel, ctx, message, self) => {
  if (
    self ||
    message.startsWith('!') ||
    ignoredUsers.includes(ctx['display-name']) ||
    (message.match(filterRegexAt) && !message.match(filterRegexDorian)) ||
    ctx['emote-only']
  )
    return;

  const msgConfig = {
    user: ctx['display-name'],
    message: message,
    emotes: ctx.emotes,
    sub: ctx.subscriber,
    mod: ctx.mod,
    highlighted: ctx['msg-id'] === 'highlighted-message'
  };
  io.emit('message', msgConfig);
  console.log(ctx);
});

// https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_8c2887e0898547aabb83ffc71e8d1f71/1.0
