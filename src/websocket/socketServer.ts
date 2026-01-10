import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { TokenData } from '../types';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('subscribe', (room: string) => {
            socket.join(room);
        });

        socket.on('disconnect', () => {
            // console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const broadcastUpdate = (tokens: TokenData[]) => {
    if (!io) return;
    io.to('discover').emit('market-update', tokens);
};
