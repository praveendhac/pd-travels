import { Router, Request, Response } from 'express'
import { verifyAuth } from '../middleware/auth'
import * as TripsService from '../services/trips'

const router = Router()
router.use(verifyAuth)

router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = '20', offset = '0' } = req.query
    const { trips, total } = await TripsService.getTrips((req as any).userId, parseInt(limit as string), parseInt(offset as string))
    res.json({ data: { items: trips, total }, error: null })
  } catch (e) {
    res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: (e as Error).message } })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = TripsService.createTripSchema.parse(req.body)
    const trip = await TripsService.createTrip((req as any).userId, data)
    res.status(201).json({ data: trip, error: null })
  } catch (e) {
    const msg = (e as Error).message
    res.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: msg } })
  }
})

router.get('/:tripId', async (req: Request, res: Response) => {
  try {
    const trip = await TripsService.getTrip(req.params.tripId, (req as any).userId)
    res.json({ data: trip, error: null })
  } catch (e) {
    const msg = (e as Error).message
    const status = msg.includes('Access') ? 403 : 404
    res.status(status).json({ data: null, error: { code: status === 403 ? 'FORBIDDEN' : 'NOT_FOUND', message: msg } })
  }
})

router.patch('/:tripId', async (req: Request, res: Response) => {
  try {
    const trip = await TripsService.updateTrip(req.params.tripId, (req as any).userId, req.body)
    res.json({ data: trip, error: null })
  } catch (e) {
    res.status(403).json({ data: null, error: { code: 'FORBIDDEN', message: (e as Error).message } })
  }
})

router.delete('/:tripId', async (req: Request, res: Response) => {
  try {
    await TripsService.deleteTrip(req.params.tripId, (req as any).userId)
    res.json({ data: { success: true }, error: null })
  } catch (e) {
    res.status(403).json({ data: null, error: { code: 'FORBIDDEN', message: (e as Error).message } })
  }
})

export default router
