import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';
import { SERVER_URL } from './app/core/interceptors/ssr-absolute-url.interceptor';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

// Security and performance middleware
app.disable('x-powered-by'); // Remove X-Powered-By header for security

// Trust proxy for Cloud Run (needed for proper IP forwarding)
app.set('trust proxy', true);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });
  next();
});

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
  });
});

// Readiness check endpoint
app.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 * Important: This must come before SSR routes to serve JSON, images, etc.
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false, // Don't serve index.html for directories, let SSR handle routes
    setHeaders: (res, path) => {
      // Set proper cache headers for different file types
      if (path.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache JSON for 1 hour
      } else if (
        path.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)
      ) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache assets for 1 year
      }
    },
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  // Construct the full URL for SSR HTTP requests
  const serverUrl = `${protocol}://${headers.host}`;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${serverUrl}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [
        { provide: APP_BASE_HREF, useValue: baseUrl },
        { provide: SERVER_URL, useValue: serverUrl }, // Provide server URL for absolute paths
      ],
    })
    .then((html) => res.send(html))
    .catch((err) => {
      console.error('SSR Error:', err);
      next(err);
    });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err.stack || err);

    res.status(err.status || 500).json({
      error: {
        message:
          process.env['NODE_ENV'] === 'production'
            ? 'Internal Server Error'
            : err.message,
        status: err.status || 500,
      },
    });
  }
);

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = Number(process.env['PORT']) || 4000;
  const host = process.env['HOST'] || '0.0.0.0';

  const server = app.listen(port, host, () => {
    console.log(`Node Express server listening on http://${host}:${port}`);
    console.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
    console.log(`Health check: http://${host}:${port}/health`);
  });

  // Graceful shutdown handling for Cloud Run
  const gracefulShutdown = (signal: string) => {
    console.log(`${signal} signal received: closing HTTP server`);
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

export default app;
export const reqHandler = app;
