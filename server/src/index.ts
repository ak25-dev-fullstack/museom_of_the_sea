/**
 * @module index
 *
 * Server entry point: builds the app and starts listening.
 */
import { createApp } from './app.js';
import { env } from './config/env.js';

createApp().listen(env.PORT, () => {
  console.info(`Museum of the Sea API listening on http://localhost:${env.PORT}`);
});
