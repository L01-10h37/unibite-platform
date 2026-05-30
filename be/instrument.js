import 'dotenv/config';
import * as Sentry from '@sentry/node';
import environment from './config/environment.js';

Sentry.init({
  dsn: environment.sentry_dsn,
  enabled: Boolean(environment.sentry_dsn),
  environment: environment.node_env,
  release: environment.sentry_release,
  tracesSampleRate: Number(environment.sentry_traces_sample_rate),
  sendDefaultPii: true,
});

export default Sentry;