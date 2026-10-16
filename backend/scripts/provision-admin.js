import { deleteSessionsForUser } from '../src/services/sessionStore.js';
import {
  findUserByEmail,
  initializeUserStore,
  normalizeEmail,
  provisionAdmin,
  toPublicUser,
} from '../src/services/userStore.js';
import { closeDocumentStore } from '../src/services/postgresDocumentStore.js';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const confirmedEmail = process.env.ADMIN_EMAIL_CONFIRM;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== 'string' || email.length > 254 || !emailPattern.test(email.trim())) {
    console.error('Administrator provisioning requires a valid ADMIN_EMAIL.');
    process.exitCode = 1;
    return;
  }
  if (typeof confirmedEmail !== 'string' || normalizeEmail(confirmedEmail) !== normalizeEmail(email)) {
    console.error('ADMIN_EMAIL_CONFIRM must match ADMIN_EMAIL to confirm the account being promoted.');
    process.exitCode = 1;
    return;
  }

  await initializeUserStore();
  const user = await provisionAdmin({ email });
  await deleteSessionsForUser(user.id);
  const verifiedUser = await findUserByEmail(email);
  if (verifiedUser?.id !== user.id || verifiedUser.role !== 'admin') {
    throw new Error('Backend verification failed after administrator provisioning.');
  }
  console.info(`Administrator role verified for ${toPublicUser(verifiedUser).email}. Existing sessions were revoked.`);
}

main()
  .catch((error) => {
    console.error('Administrator provisioning failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeDocumentStore();
    } catch (error) {
      console.error('Could not close the PostgreSQL connection pool:', error.message);
      process.exitCode = 1;
    }
  });
