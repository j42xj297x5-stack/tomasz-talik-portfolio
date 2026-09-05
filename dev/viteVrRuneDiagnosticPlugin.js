import { appendFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const BODY_LIMIT = 128 * 1024;

export function viteVrRuneDiagnosticPlugin({ base }) {
  const endpoint = `${base.replace(/\/?$/, '/')}__vr-debug/rune`;
  const outputPath = resolve('.debug/vr-rune-completion.jsonl');
  let writeQueue = Promise.resolve();

  return {
    name: 'vr-rune-diagnostic-flight-recorder',
    apply: 'serve',
    configureServer(server) {
      console.info(`[VR diagnostic] Rune flight recorder: ${outputPath}`);
      server.middlewares.use((req, res, next) => {
        const requestPath = req.url?.split('?')[0];
        if (requestPath !== endpoint) {
          next();
          return;
        }
        if (req.method !== 'POST') {
          res.statusCode = 400;
          res.end();
          return;
        }

        let size = 0;
        let rejected = false;
        const chunks = [];
        req.on('data', (chunk) => {
          size += chunk.length;
          if (size > BODY_LIMIT) {
            rejected = true;
            chunks.length = 0;
            res.statusCode = 413;
            res.end();
            return;
          }
          if (!rejected) chunks.push(chunk);
        });
        req.on('end', () => {
          if (rejected) return;
          let record;
          try {
            record = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (!record || Array.isArray(record) || typeof record !== 'object') throw new Error('Invalid record');
          } catch {
            res.statusCode = 400;
            res.end();
            return;
          }

          const line = `${JSON.stringify({
            ...record,
            serverTimestamp: new Date().toISOString(),
            remoteAddress: req.socket.remoteAddress ?? null,
            userAgent: req.headers['user-agent'] ?? null
          })}\n`;
          const writeOperation = writeQueue.catch(() => {}).then(async () => {
            await mkdir(join(outputPath, '..'), { recursive: true });
            await appendFile(outputPath, line, 'utf8');
          });
          writeQueue = writeOperation;
          writeOperation.then(() => {
            res.statusCode = 204;
            res.end();
          }).catch((error) => {
            console.error('[VR diagnostic] Could not append Rune flight recorder.', error);
            res.statusCode = 500;
            res.end();
          });
        });
        req.on('error', () => {
          if (!res.writableEnded) {
            res.statusCode = 400;
            res.end();
          }
        });
      });
    }
  };
}
