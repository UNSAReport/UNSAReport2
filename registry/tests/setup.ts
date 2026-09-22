const TEST_DATABASE_URL = 'postgresql://idp:idppassword@localhost:5432/idp_db';
const TEST_S3_ENDPOINT = 'http://localhost:8333';
const TEST_S3_BUCKET = 'unsareport-registry';
const TEST_S3_ACCESS_KEY = 'seaweedadmin';
const TEST_S3_SECRET_KEY = 'seaweedadmin';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
}
if (!process.env.S3_ENDPOINT) {
  process.env.S3_ENDPOINT = TEST_S3_ENDPOINT;
}
if (!process.env.S3_BUCKET) {
  process.env.S3_BUCKET = TEST_S3_BUCKET;
}
if (!process.env.S3_ACCESS_KEY) {
  process.env.S3_ACCESS_KEY = TEST_S3_ACCESS_KEY;
}
if (!process.env.S3_SECRET_KEY) {
  process.env.S3_SECRET_KEY = TEST_S3_SECRET_KEY;
}
