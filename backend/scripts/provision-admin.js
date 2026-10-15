import argon2 from 'argon2';
import { validateRegistration } from '../src/services/authValidation.js';
import { deleteSessionsForUser } from '../src/services/sessionStore.js';
import { initializeUserStore, provisionAdmin, toPublicUser } from '../src/services/userStore.js';

async function main() {
  let details;
  try {
    details = validateRegistration({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
  } catch (error) {
    console.error(`Administrator provisioning requires valid ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  await initializeUserStore();
  const passwordHash = await argon2.hash(details.password, { type: argon2.argon2id });
  const user = await provisionAdmin({ ...details, passwordHash });
  await deleteSessionsForUser(user.id);
  console.info(`Administrator provisioned: ${toPublicUser(user).email}`);
}

main().catch((error) => {
  console.error('Administrator provisioning failed:', error.message);
  process.exitCode = 1;
});
