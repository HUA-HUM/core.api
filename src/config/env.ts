import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 3000),
  serviceName: process.env.SERVICE_NAME ?? 'rituo-core-api',
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  appReviewAccountEmail:
    process.env.APP_REVIEW_ACCOUNT_EMAIL ?? 'hello@rituo.io',
  internalAnalyticsApiKey: process.env.INTERNAL_ANALYTICS_API_KEY,
  analyticsTimeZone:
    process.env.ANALYTICS_TIME_ZONE ?? 'America/Argentina/Buenos_Aires',
  // Internal/test accounts hidden from the public ranking (comma-separated).
  rankingExcludedEmails: Array.from(
    new Set(
      [
        process.env.APP_REVIEW_ACCOUNT_EMAIL ?? 'hello@rituo.io',
        ...(process.env.RANKING_EXCLUDED_EMAILS ?? '').split(','),
      ]
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ),
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
