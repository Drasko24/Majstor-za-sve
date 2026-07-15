import { FastifyRequest, FastifyReply } from 'fastify'
import { Role } from '@prisma/client'
import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; role: Role; type: 'access' | 'refresh' }
    user: { userId: string; role: Role; type: 'access' | 'refresh' }
  }
}

export function requireAuth(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch {
      return reply.code(401).send({ error: 'Neautorizovan pristup' })
    }
    if (req.user.type !== 'access') {
      return reply.code(401).send({ error: 'Nevažeći tip tokena' })
    }
    const isAdmin = req.user.role === Role.ADMIN
    if (roles.length > 0 && !isAdmin && !roles.includes(req.user.role)) {
      return reply.code(403).send({ error: 'Nemate dozvolu za ovu akciju' })
    }
  }
}
