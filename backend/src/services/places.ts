async function getPrisma() {
  const { PrismaClient } = await import('../generated/prisma/client')
  return new (PrismaClient as any)()
}

export const notImplemented = async () => {
  throw new Error('Not yet implemented')
}
