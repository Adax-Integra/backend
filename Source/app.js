import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

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