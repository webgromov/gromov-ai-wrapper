import express from 'express';
import dotenv from 'dotenv';
import llmRoutes from './routes/llm.routes';

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api/llm', llmRoutes);

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
