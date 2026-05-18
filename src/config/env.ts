import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 3000),
  serviceName: process.env.SERVICE_NAME ?? 'rituo-core-api',
  databaseUrl: process.env.DATABASE_URL,
};
