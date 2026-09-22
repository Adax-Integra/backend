import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { parse as parseYaml } from 'yaml';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Import route modules
import externalUserRoutes from '../Source/Routes/externalUser.routes.js';
import caseRoutes from '../Source/Routes/case.routes.js';
import internalUserRoutes from '../Source/Routes/internalUser.routes.js';
import authRoutes from '..Source/Routes/auth.routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swaggerDocument = parseYaml(
  readFileSync(join(__dirname, '..', 'openapi.yaml'), 'utf8')
);

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());

// Built-in body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Default server running page
app.get('/', (_req, res) => res.status(200).json({ status: 'server running' }));

// Health check endpoint for mobile connectivity testing & load balancers
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// OpenAPI docs (single source in root folder: openapi.yaml)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount routes under /api
app.use('/api', externalUserRoutes);
app.use('/api', internalUserRoutes);
app.use('/api', caseRoutes);
app.use('/api/auth', authRoutes);

// 404
app.use((_req, res) => res.status(404).send('Not found.'));

// Global error handler — prevents unhandled exceptions from crashing the serverless function
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).send('Internal server error.');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));

export default app;
