import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

// Comma-separated list of allowed origins, e.g. "https://pd-travels.vercel.app,http://localhost:5173"
// Vercel preview URLs are intentionally NOT wildcarded here — see backend-spec.md Security Considerations.
const allowedOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(pinoHttp());

app.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' }, error: null });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
