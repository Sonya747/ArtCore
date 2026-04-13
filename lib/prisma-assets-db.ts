import { PrismaClient } from '@prisma/client'

const globalForAssets = globalThis as unknown as { prismaAssetsDb?: PrismaClient }

/**
 * 资产库读写的 Postgres 连接：优先 NEON_URL，否则 DATABASE_URL。
 * 与根目录 lib/prisma 可指向不同库（例如本地任务库 + Neon 资产库）。
 */
export function getAssetsPrisma(): PrismaClient {
  if (globalForAssets.prismaAssetsDb) {
    return globalForAssets.prismaAssetsDb
  }
  const url = process.env.NEON_URL ?? process.env.DATABASE_URL
  if (!url) {
    throw new Error('NEON_URL 或 DATABASE_URL 未配置，无法访问 assets 表')
  }
  const client = new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
  globalForAssets.prismaAssetsDb = client
  return client
}
