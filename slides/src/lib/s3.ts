import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

export async function getS3Object(key: string): Promise<{
  body: Uint8Array;
  contentType: string;
  contentLength?: number;
  eTag?: string;
}> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`S3 object "${key}" has no body`);
  }

  const bytes = await response.Body.transformToByteArray();
  return {
    body: bytes,
    contentType: response.ContentType || 'application/octet-stream',
    contentLength: response.ContentLength,
    eTag: response.ETag,
  };
}

export async function getPresignedUrl(
  key: string,
  expiresInSeconds = config.presignSeconds,
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

export async function deleteS3Prefix(prefix: string): Promise<void> {
  let continuationToken: string | undefined;
  do {
    const listRes = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: config.s3.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    if (listRes.Contents && listRes.Contents.length > 0) {
      const objectsToDelete = listRes.Contents.map((obj) => ({
        Key: obj.Key,
      })).filter(
        (item): item is { Key: string } => typeof item.Key === 'string',
      );

      if (objectsToDelete.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: config.s3.bucket,
            Delete: { Objects: objectsToDelete },
          }),
        );
      }
    }

    continuationToken = listRes.NextContinuationToken;
  } while (continuationToken);
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.wasm': 'application/wasm',
};

export function getMimeType(filePath: string): string {
  const dotIndex = filePath.lastIndexOf('.');
  if (dotIndex === -1) {
    return 'application/octet-stream';
  }
  const ext = filePath.slice(dotIndex).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}
