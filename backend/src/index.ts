import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth'

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 4000

const allowedOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(helmet())
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())
app.use(pinoHttp())

app.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' }, error: null })
})

app.use('/auth', authRoutes)

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
