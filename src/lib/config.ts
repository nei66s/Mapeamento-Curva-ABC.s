export const appConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  trackingEndpoint: process.env.NEXT_PUBLIC_TRACKING_ENDPOINT || '/api/admin/tracking',
  realtimePollInterval: Number(process.env.NEXT_PUBLIC_REALTIME_POLL_INTERVAL || 5000),
  slowRealtimePollInterval: Number(process.env.NEXT_PUBLIC_SLOW_REALTIME_POLL_INTERVAL || 10000),
  auth: {
    accessTokenCookie: 'pm_access_token',
    refreshTokenCookie: 'pm_refresh_token',
    refreshEndpoint: '/auth/refresh',
  },
};

export const dateLocale = 'pt-BR';
