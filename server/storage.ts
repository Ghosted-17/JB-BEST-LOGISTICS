import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import crypto from 'node:crypto';
import { config } from './config';

const client = config.storage.endpoint && config.storage.bucket
  ? new S3Client({
      region: config.storage.region,
      endpoint: config.storage.endpoint,
      forcePathStyle: Boolean(config.storage.endpoint),
      credentials: config.storage.accessKeyId && config.storage.secretAccessKey
        ? { accessKeyId: config.storage.accessKeyId, secretAccessKey: config.storage.secretAccessKey }
        : undefined,
    })
  : null;

export const uploadPrivateProfilePhoto = async (userId: string, file: { buffer: Buffer; mimetype: string }) => {
  if (!client || !config.storage.bucket) throw new Error('Private object storage is not configured');
  const extension = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
  const key = `profiles/${userId}/${crypto.randomUUID()}.${extension}`;
  await client.send(new PutObjectCommand({
    Bucket: config.storage.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ServerSideEncryption: 'AES256',
  }));
  return key;
};
