require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const travelRoutes = require('./routes/travel');
const chatRoutes = require('./routes/chat');
const propertyRoutes = require('./routes/property');
const bookingRoutes = require('./routes/booking');
const dashboardRoutes = require('./routes/dashboard');
const squadRoutes = require('./routes/squad');
const Squad = require('./models/Squad');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Presence Tracking
const onlineUsers = {}; // roomId -> Set(userIds)
const socketToUser = {}; // socketId -> { roomId, userId }

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('👤 [SOCKET] User connected:', socket.id);

    socket.on('identify_user', (userId) => {
        socket.userId = userId;
        console.log(`🆔 [SOCKET] User ${socket.id} identified as ${userId}`);
    });

    socket.on('join_squad', async (data) => {
        try {
            const roomId = typeof data === 'string' ? data : data.roomId;
            const userId = (data && data.userId) || socket.userId || socket.handshake.query.userId;

            if (!roomId || !userId) return;

            socket.join(roomId);
            console.log(`🏠 [SOCKET] User ${userId} joined room ${roomId}`);

            // Track presence
            if (!onlineUsers[roomId]) onlineUsers[roomId] = new Set();
            onlineUsers[roomId].add(userId);
            socketToUser[socket.id] = { roomId, userId };

            // Broadcast presence update (using io.to to include the sender)
            const currentOnline = Array.from(onlineUsers[roomId]);
            console.log(`🌐 [PRESENCE] Room ${roomId} online users:`, currentOnline);
            io.to(roomId).emit('presence_update', currentOnline);

            const squad = await Squad.findById(roomId).populate('members', 'name email');
            if (squad) {
                socket.to(roomId).emit('member_joined', {
                    newMemberCount: squad.members.length,
                    updatedSquad: squad
                });
            }
        } catch (err) {
            console.error("Socket Join Error:", err);
        }
    });

    socket.on('update_squad_trip', (data) => {
        socket.to(data.roomId).emit('squad_trip_updated', data.updates);
    });

    socket.on('squad_plan_generated', (data) => {
        socket.to(data.roomId).emit('plan_received', data.squad);
    });

    socket.on('squad_generating_started', (data) => {
        socket.to(data.roomId).emit('squad_generating', data.isGenerating);
    });

    socket.on('activity_voted', (data) => {
        socket.to(data.roomId).emit('vote_updated', data.squad);
    });

    socket.on('disconnect', () => {
        const info = socketToUser[socket.id];
        if (info) {
            const { roomId, userId } = info;
            if (onlineUsers[roomId]) {
                onlineUsers[roomId].delete(userId);
                io.to(roomId).emit('presence_update', Array.from(onlineUsers[roomId]));
            }
            delete socketToUser[socket.id];
        }
        console.log('👤 [SOCKET] Member disconnected');
    });
});

// Connect to MongoDB
connectDB();

// Security & parsing middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/squad', squadRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
const fs = require('fs');
app.use((err, req, res, next) => {
    const log = `[${new Date().toISOString()}] ${err.stack}\n`;
    fs.appendFileSync(path.join(__dirname, 'server_error.log'), log);
    console.error(err.stack);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`));

module.exports = { app, server, io };
