import { FastifyInstance } from 'fastify'
import { prisma } from '../../common/prisma'

export async function categoryRoutes(app: FastifyInstance) {
  app.get('/', async (_request, reply) => {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return reply.send(categories)
  })
}
