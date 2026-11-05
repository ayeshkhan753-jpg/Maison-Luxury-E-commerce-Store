import express, { Request, Response } from 'express';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const PYTHON_PORT = 5001;

let pythonProcess: ChildProcess | null = null;

// Start Python Backend Process
function startPythonBackend() {
  const pythonScript = path.join(__dirname, 'maison', 'run.py');
  console.log(`[MAISON] Launching Python Backend: python3 ${pythonScript} ${PYTHON_PORT}`);

  pythonProcess = spawn('python3', [pythonScript, String(PYTHON_PORT)], {
    stdio: 'inherit',
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  pythonProcess.on('error', (err) => {
    console.error('[MAISON] Failed to start Python backend:', err);
  });

  pythonProcess.on('exit', (code, signal) => {
    console.log(`[MAISON] Python backend exited with code ${code} / signal ${signal}`);
  });
}

startPythonBackend();

// Raw body parser for proxying
app.use('/api', express.raw({ type: '*/*', limit: '10mb' }));

// Proxy all /api/* calls to Python backend on port 5001
app.all('/api/*', (req: Request, res: Response) => {
  const targetPath = req.originalUrl;
  const options: http.RequestOptions = {
    hostname: '127.0.0.1',
    port: PYTHON_PORT,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${PYTHON_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[PROXY ERROR] Failed to connect to Python backend for ${targetPath}:`, err.message);
    res.status(502).json({
      error: 'Python backend initializing or unavailable. Please retry in a moment.',
      details: err.message
    });
  });

  if (req.body && Buffer.isBuffer(req.body) && req.body.length > 0) {
    proxyReq.write(req.body);
  }
  proxyReq.end();
});

// Setup Vite middleware in dev or static files in production
async function setupViteOrStatic() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MAISON] Full-Stack Applet running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('[MAISON] Failed to bootstrap server:', err);
});

// Graceful cleanup
process.on('SIGINT', () => {
  if (pythonProcess) pythonProcess.kill('SIGINT');
  process.exit();
});
process.on('SIGTERM', () => {
  if (pythonProcess) pythonProcess.kill('SIGTERM');
  process.exit();
});
