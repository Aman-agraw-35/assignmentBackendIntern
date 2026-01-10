import { createServer } from 'http';
import app from './app';
import { config } from './config/env';
import { initSocket } from './websocket/socketServer';
import { pollingService } from './services/polling';

const httpServer = createServer(app);
const io = initSocket(httpServer);

pollingService.start();

httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down...');
    pollingService.stop();
    httpServer.close(() => {
        process.exit(0);
    });
});
