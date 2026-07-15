import { Client } from 'minio'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
})

const BUCKET = process.env.MINIO_BUCKET ?? 'majstor-uploads'
const PUBLIC_URL = (process.env.MINIO_PUBLIC_URL ?? `http://localhost:9000/${BUCKET}`).replace(/\/$/, '')

export async function uploadImage(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; fileSize: number }> {
  const processed = await sharp(buffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()

  const key = `${folder}/${randomUUID()}.webp`
  await minioClient.putObject(BUCKET, key, processed, processed.length, {
    'Content-Type': 'image/webp',
  })

  return { url: `${PUBLIC_URL}/${key}`, fileSize: processed.length }
}

export async function deleteImageByUrl(url: string): Promise<void> {
  const prefix = `${PUBLIC_URL}/`
  const key = url.startsWith(prefix) ? url.slice(prefix.length) : null
  if (key) await minioClient.removeObject(BUCKET, key)
}
