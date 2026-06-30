import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 3000),
  serviceName: process.env.SERVICE_NAME ?? 'rituo-core-api',
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  internalAnalyticsApiKey: process.env.INTERNAL_ANALYTICS_API_KEY,
  analyticsTimeZone:
    process.env.ANALYTICS_TIME_ZONE ?? 'America/Argentina/Buenos_Aires',
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
