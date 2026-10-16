import { config } from '../config/env.js';
import { withJsonArray, withJsonValue } from './jsonArrayStore.js';
import { withPostgresArray, withPostgresValue } from './postgresDocumentStore.js';

export const withDocumentArray = (...args) => (
  config.nodeEnv === 'test' ? withJsonArray(...args) : withPostgresArray(...args)
);

export const withDocumentValue = (...args) => (
  config.nodeEnv === 'test' ? withJsonValue(...args) : withPostgresValue(...args)
);
