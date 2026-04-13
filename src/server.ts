import http from 'node:http';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import { Agent } from './agent.js';


const PUBLIC_DIR = path.join(process.cwd(), 'src', 'public');
const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.autoclaw');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'setting.json');
const LOCAL_CONFIG_FILE = path.join(process.cwd(), '.autoclaw', 'setting.json');

interface AppConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  autoConfirm?: boolean;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  tavilyApiKey?: string;
  imageApiKey?: string;
  imageBaseUrl?: string;
  imageModel?: string;
  imageSize?: string;
  imageQuality?: string;
  imageStyle?: string;
  imageN?: number;
  feishuWebhook?: string;
  feishuKeyword?: string;
  dingtalkWebhook?: string;
  dingtalkKeyword?: string;
  wecomWebhook?: string;
  wecomKeyword?: string;
}

function loadJsonConfig(filePath: string): AppConfig {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as AppConfig;
  } catch {
    return {};
  }
}

function getConfig(): AppConfig {
  const globalConfig = loadJsonConfig(GLOBAL_CONFIG_FILE);
  const localConfig = loadJsonConfig(LOCAL_CONFIG_FILE);
  const fullConfig: AppConfig = { ...globalConfig, ...localConfig };

  if (process.env.OPENAI_API_KEY) fullConfig.apiKey = process.env.OPENAI_API_KEY;
  if (process.env.OPENAI_BASE_URL) fullConfig.baseUrl = process.env.OPENAI_BASE_URL;
  if (process.env.OPENAI_MODEL) fullConfig.model = process.env.OPENAI_MODEL;
  if (process.env.AUTO_CONFIRM === 'true') fullConfig.autoConfirm = true;

  return fullConfig;
}

async function readStaticFile(relativePath: string): Promise<Buffer> {
  const filePath = path.join(PUBLIC_DIR, relativePath);
  return await fsp.readFile(filePath);
}

function getContentType(filePath: string): string {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml; charset=utf-8';
  return 'application/octet-stream';
}

async function parseRequestBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function createAgent(): Promise<Agent> {
  const config = getConfig();
  const apiKey = config.apiKey;
  const baseURL = config.baseUrl;
  const model = config.model || 'gpt-4o';

  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please run autoclaw setup or set OPENAI_API_KEY.');
  }

  return new Agent(apiKey, baseURL, model, config);
}

export async function runWebUI(port = 3000) {
  const agent = await createAgent();

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
      const pathname = parsedUrl.pathname;

      if (pathname === '/' || pathname === '/index.html') {
        const content = await readStaticFile('index.html');
        res.writeHead(200, { 'Content-Type': getContentType('index.html') });
        res.end(content);
        return;
      }

      if (pathname === '/circuit' || pathname === '/circuit.html') {
        const content = await readStaticFile('circuit.html');
        res.writeHead(200, { 'Content-Type': getContentType('circuit.html') });
        res.end(content);
        return;
      }

      if (pathname.startsWith('/api/chat') && req.method === 'POST') {
        const body = await parseRequestBody(req);
        const payload = JSON.parse(body || '{}');
        const prompt = payload.prompt;
        const image = payload.image;
        const imageFileName = payload.imageFileName;

        if (!prompt || typeof prompt !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'prompt field is required' }));
          return;
        }

        let finalPrompt = prompt;
        if (image) {
          finalPrompt = `${prompt}\n\n[Image attached: ${imageFileName}]\nBase64 image data: ${image}`;
        }

        const result = await agent.chatToString(finalPrompt);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result }));
        return;
      }

      if (req.method === 'GET' && pathname.startsWith('/')) {
        const safePath = pathname.substring(1) || 'index.html';
        const content = await readStaticFile(safePath);
        res.writeHead(200, { 'Content-Type': getContentType(safePath) });
        res.end(content);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } catch (err: any) {
      console.error('Server error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Server error' }));
    }
  });

  server.listen(port, () => {
    console.log(`AutoClaw UI available at http://localhost:${port}`);
  });
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  runWebUI().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
