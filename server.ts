console.log("[SERVER] Iniciando processo...");
import express from "express";
import { createServer as createViteServer } from "vite";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let client: any = null;

async function getSecret(name: string): Promise<string | undefined> {
  if (!client && process.env.GOOGLE_CLOUD_PROJECT) {
    try {
      console.log("[SECRET MANAGER] Inicializando para o projeto:", process.env.GOOGLE_CLOUD_PROJECT);
      client = new SecretManagerServiceClient();
    } catch (e) {
      console.error("[SECRET MANAGER] Falha ao inicializar:", e);
    }
  }

  if (client && process.env.GOOGLE_CLOUD_PROJECT) {
    try {
      const [version] = await client.accessSecretVersion({
        name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/${name}/versions/latest`,
      });
      return version.payload?.data?.toString();
    } catch (error) {
      console.error(`[SECRET MANAGER] Erro ao buscar segredo ${name}:`, error);
    }
  }
  return process.env[name]; // Fallback to env var
}

const REQUIRED_SECRETS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_ID',
  'VITE_RECAPTCHA_SITE_KEY'
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ── SEGURANÇA ──────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.gstatic.com", "https://www.google.com", "https://apis.google.com"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "connect-src": ["'self'", "https://*.firebaseio.com", "https://*.googleapis.com", "https://*.firebaseapp.com", "wss://*.run.app"],
        "frame-src": ["'self'", "https://*.firebaseapp.com", "https://www.google.com"],
        "img-src": ["'self'", "data:", "https://*.googleusercontent.com", "https://www.gstatic.com", "https://picsum.photos"],
        "frame-ancestors": ["'self'", "https://*.run.app", "https://ais-dev-wbo5jhcjfgeoudt37fe3nw-138470562406.us-west1.run.app", "https://ais-pre-wbo5jhcjfgeoudt37fe3nw-138470562406.us-west1.run.app"]
      },
    },
    crossOriginEmbedderPolicy: false,
    xFrameOptions: false,
  }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000 // Aumentado para 1000 para evitar bloqueios em dev
  });
  app.use(limiter);

  // Fetch secrets on startup
  const secrets: Record<string, string> = {};
  for (const name of REQUIRED_SECRETS) {
    const val = await getSecret(name);
    if (val) secrets[name] = val;
  }

  // API route to provide secrets to the client
  app.get("/api/config", (req, res) => {
    res.json(secrets);
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Iniciando Vite em modo desenvolvimento...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Middleware to inject secrets into the HTML in dev mode
    app.use(async (req, res, next) => {
      if (req.url === '/' || req.url.endsWith('.html')) {
        try {
          const fs = await import('fs');
          const htmlPath = path.resolve(__dirname, 'index.html');
          let html = fs.readFileSync(htmlPath, 'utf-8');
          html = await vite.transformIndexHtml(req.url, html);
          
          const script = `<script>window.ENV = ${JSON.stringify(secrets)};</script>`;
          html = html.replace('</head>', `${script}</head>`);
          
          res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
          return;
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
          return;
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Iniciando em modo produção...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', async (req, res) => {
      try {
        const fs = await import('fs');
        const htmlPath = path.join(distPath, 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf-8');
        
        // Inject secrets into the HTML
        const script = `<script>window.ENV = ${JSON.stringify(secrets)};</script>`;
        html = html.replace('</head>', `${script}</head>`);
        
        res.send(html);
      } catch (e) {
        res.status(500).send("Erro ao carregar index.html. Verifique se o build foi executado.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Rodando em http://localhost:${PORT}`);
  }).on('error', (err) => {
    console.error('[SERVER] Erro ao iniciar servidor:', err);
  });
}

startServer().catch((err) => {
  console.error('[SERVER] Erro fatal na inicialização:', err);
});
