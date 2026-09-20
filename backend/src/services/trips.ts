import { z } from 'zod'

async function getPrisma() {
  const { PrismaClient } = await import('../generated/prisma/client')
  return new (PrismaClient as any)()
}

export const createTripSchema = z.object({
  name: z.string().min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  source: z.string().min(1),
  destination: z.string().min(1),
  cover_image_url: z.string().optional(),
})

export async function createTrip(userId: string, data: z.infer<typeof createTripSchema>) {
  const prisma = await getPrisma()
  const trip = await prisma.trip.create({
    data: {
      owner_id: userId,
      ...data,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
    },
  })
  await prisma.$disconnect()
  return trip
}

export async function getTrips(userId: string, limit = 20, offset = 0) {
  const prisma = await getPrisma()
  const trips = await prisma.trip.findMany({
    where: {
      OR: [{ owner_id: userId }, { collaborators: { some: { user_id: userId } } }],
    },
    include: {
      collaborators: { where: { user_id: userId }, select: { role: true } },
    },
    take: limit,
    skip: offset,
  })

  const total = await prisma.trip.count({
    where: {
      OR: [{ owner_id: userId }, { collaborators: { some: { user_id: userId } } }],
    },
  })

  await prisma.$disconnect()
  return { trips: trips.map(t => ({ ...t, role: t.collaborators[0]?.role || 'owner' })), total }
}

export async function getTrip(tripId: string, userId: string) {
  const prisma = await getPrisma()
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { collaborators: true },
  })

  if (!trip) throw new Error('Trip not found')

  const isOwner = trip.owner_id === userId
  const isCollaborator = trip.collaborators.some(c => c.user_id === userId)
  if (!isOwner && !isCollaborator) throw new Error('Access denied')

  const role = isOwner ? 'owner' : trip.collaborators.find(c => c.user_id === userId)?.role || 'viewer'

  await prisma.$disconnect()
  return { ...trip, role }
}

export async function updateTrip(tripId: string, userId: string, data: Partial<z.infer<typeof createTripSchema>>) {
  const prisma = await getPrisma()
  const trip = await prisma.trip.findUnique({ where: { id: tripId } })
  if (!trip || trip.owner_id !== userId) throw new Error('Access denied')

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...data,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
    },
  })

  await prisma.$disconnect()
  return updated
}

export async function deleteTrip(tripId: string, userId: string) {
  const prisma = await getPrisma()
  const trip = await prisma.trip.findUnique({ where: { id: tripId } })
  if (!trip || trip.owner_id !== userId) throw new Error('Access denied')

  await prisma.trip.delete({ where: { id: tripId } })
  await prisma.$disconnect()
}
