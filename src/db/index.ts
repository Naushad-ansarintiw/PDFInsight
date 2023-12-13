import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined
}

let prisma: PrismaClient
if (process.env.NODE_ENV === 'production') {
  // @ts-ignore
  prisma = new PrismaClient().$extends(withAccelerate())
} else {
  if (!global.cachedPrisma) {
    // @ts-ignore
    global.cachedPrisma = new PrismaClient().$extends(withAccelerate())
  }
  // @ts-ignore
  prisma = global.cachedPrisma
}

export const db = prisma
