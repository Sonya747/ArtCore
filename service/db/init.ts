import { prisma } from '@/lib/prisma'

let hasConnected = false

export async function initDatabaseConnection() {
  if (hasConnected) {
    return
  }

  await prisma.$connect()
  hasConnected = true
}
