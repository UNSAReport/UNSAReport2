import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PRESIGN_SECONDS } from '@unsa/schemas/constants';
import JSZip from 'jszip';
import { config } from '@/config';

export const s3Client = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
  forcePathStyle: config.s3.forcePathStyle,
});

export const s3PresignClient = new S3Client({
  endpoint: config.s3.publicEndpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
  forcePathStyle: config.s3.forcePathStyle,
});

export async function ensureBucketExists(): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: config.s3.bucket }));
    return;
  } catch {
    try {
      await s3Client.send(
        new CreateBucketCommand({ Bucket: config.s3.bucket }),
      );
    } catch (createErr) {
      const code = createErr instanceof Error ? createErr.name : '';
      if (
        code === 'BucketAlreadyOwnedByYou' ||
        code === 'BucketAlreadyExists'
      ) {
        return;
      }
      const message =
        createErr instanceof Error ? createErr.message : String(createErr);
      throw new Error(
        `Failed to ensure S3 bucket "${config.s3.bucket}" exists: ${message}`,
      );
    }
  }
}

export async function uploadS3Object(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream',
): Promise<string> {
  await ensureBucketExists();
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: typeof body === 'string' ? Buffer.from(body) : body,
      ContentType: contentType,
    }),
  );
  return key;
}

export async function getPresignedUrl(
  key: string,
  expiresInSeconds = PRESIGN_SECONDS,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });
  return await getSignedUrl(s3PresignClient, command, {
    expiresIn: expiresInSeconds,
  });
}

export async function deleteS3Object(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    }),
  );
}

export async function buildAndUploadZipArchive(
  s3Key: string,
  files: { path: string; content: Buffer }[],
): Promise<string> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
  await uploadS3Object(s3Key, zipBuffer, 'application/zip');
  return s3Key;
}
