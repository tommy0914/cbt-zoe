export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
  enableSwagger: process.env.ENABLE_SWAGGER === 'true',
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
});