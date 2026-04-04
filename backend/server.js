import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './src/routes/authRoutes.js';
import postRoutes from './src/routes/postRoutes.js';
import communityRoutes from './src/routes/communityRoutes.js';
import searchRoutes from './src/routes/searchRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';

import { createServer } from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const PORT = process.env.PORT || 5001;

// Health route (added)
app.get('/', (req, res) => {
  res.send('Nexa API Running');
});

// Socket.IO logic
io.on('connection', (socket) => {
  // User joins their own room (for general notifications maybe) and conversation rooms
  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit('connected');
  });

  socket.on('join chat', (room) => {
    socket.join(room);
  });

  socket.on('new message', (newMessageRecieved) => {
    var chat = newMessageRecieved.conversationId;
    if (!chat) return;

    // 1. Send to the conversation room (for the active chat area)
    socket.in(chat._id || chat).emit('message recieved', newMessageRecieved);

    // 2. Send to the recipient's personal room (for sidebar unread badges)
    if (chat.participants) {
      chat.participants.forEach(user => {
        if (user === newMessageRecieved.sender._id) return;
        socket.in(user).emit('message recieved', newMessageRecieved);
      });
    }
  });
});

// Connect to local MongoDB for true persistence
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error. Ensure MongoDB is running locally.', err));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: err.message });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});