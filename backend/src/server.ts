import { buildApp } from './app'

async function bootstrap() {
  const server = await buildApp()
  const port = Number(process.env.PORT ?? 3000)
  await server.listen({ port, host: '0.0.0.0' })
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
