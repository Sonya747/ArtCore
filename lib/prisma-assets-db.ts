import { PrismaClient } from '@prisma/client'
import { config as loadEnv } from 'dotenv'
import { join } from 'node:path'

const globalForAssets = globalThis as unknown as { prismaAssetsDb?: PrismaClient }
/**
 * 资产库读写固定使用本地 DATABASE_URL。
 * neon有时候连不上因为，
 */
export function getAssetsPrisma(): PrismaClient {
  if (globalForAssets.prismaAssetsDb) {
    return globalForAssets.prismaAssetsDb
  }

  loadEnv({ path: join(process.cwd(), '.env'), override: true })
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error('DATABASE_URL 未配置，无法访问本地数据库')
  }
  const client = new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
  globalForAssets.prismaAssetsDb = client
  return client
}

export async function resetAssetsPrisma(): Promise<void> {
  const existing = globalForAssets.prismaAssetsDb
  globalForAssets.prismaAssetsDb = undefined
  if (existing) {
    try {
      await existing.$disconnect()
    } catch {
      // noop: disconnect best-effort
    }
  }
}
