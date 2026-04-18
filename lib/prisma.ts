import { PrismaClient } from "@prisma/client"
import { config as loadEnv } from "dotenv"
import { join } from "node:path"

declare global {
  var prisma: PrismaClient | undefined
}

//加载环境变量 因为会有neon和本地数据库两个环境变量， 有的时候neon连接残留，怎么都连不上
//不知道为什么会这样，就这样写死先用着
loadEnv({ path: join(process.cwd(), ".env"), override: true })

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置，无法连接本地数据库")
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
