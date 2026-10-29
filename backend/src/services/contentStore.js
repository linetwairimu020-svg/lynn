import { randomUUID } from 'node:crypto';
import defaultProfile from '../../../frontend/src/data/profile.js';
import defaultProjects from '../../../frontend/src/data/projects.js';
import defaultServices from '../../../frontend/src/data/services.js';
import defaultSkills from '../../../frontend/src/data/skills.js';
import defaultSettings from '../../../frontend/src/data/settings.js';
import defaultSocialLinks from '../../../frontend/src/data/socialLinks.js';
import { HttpError } from '../middleware/errorHandler.js';
import { withDocumentArray, withDocumentValue } from './documentStore.js';
import { validateCollectionInput, validateSingletonInput, validateStoredRecord } from './contentValidation.js';

const arrayDefinitions = {
  projects: { file: 'projects.json', defaults: defaultProjects },
  services: { file: 'services.json', defaults: defaultServices },
  skills: { file: 'skills.json', defaults: defaultSkills },
  'social-links': {
    file: 'social-links.json',
    defaults: defaultSocialLinks.map(({ id: platform, ...item }) => ({ ...item, id: platform, platform, enabled: true })),
  },
  messages: { file: 'messages.json', defaults: [] },
};
const singletonDefinitions = {
  profile: { file: 'profile.json', defaults: defaultProfile },
  settings: { file: 'settings.json', defaults: defaultSettings },
};

function validateRecords(collection, records) {
  if (!Array.isArray(records)) throw new Error(`${arrayDefinitions[collection].file} must contain a JSON array.`);
  const ids = new Set();
  for (const record of records) {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id
      || ids.has(record.id)
      || (record.createdAt !== undefined && (typeof record.createdAt !== 'string' || !Number.isFinite(Date.parse(record.createdAt))))
      || (record.updatedAt !== undefined && (typeof record.updatedAt !== 'string' || !Number.isFinite(Date.parse(record.updatedAt))))) {
      throw new Error(`${arrayDefinitions[collection].file} contains an invalid or duplicate record.`);
    }
    try {
      validateStoredRecord(collection, record);
    } catch {
      throw new Error(`${arrayDefinitions[collection].file} contains an invalid record.`);
    }
    ids.add(record.id);
    if (collection === 'messages'
      && (typeof record.name !== 'string' || typeof record.email !== 'string'
        || typeof record.subject !== 'string' || typeof record.message !== 'string'
        || typeof record.read !== 'boolean')) {
      throw new Error('messages.json contains an invalid message record.');
    }
  }
}

function validateSingleton(name, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${singletonDefinitions[name].file} must contain a JSON object.`);
  }
  validateSingletonInput(name, value);
}

function arrayFile(collection) {
  const definition = arrayDefinitions[collection];
  if (!definition) throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content collection does not exist.');
  return definition;
}

function singletonFile(name) {
  const definition = singletonDefinitions[name];
  if (!definition) throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content item does not exist.');
  return definition;
}

export async function initializeContentStore() {
  await Promise.all([
    ...Object.entries(arrayDefinitions).map(([name, definition]) => withDocumentArray(
      definition.file,
      (records) => validateRecords(name, records),
      async () => ({ value: undefined, changed: false }),
      definition.defaults,
    )),
    ...Object.entries(singletonDefinitions).map(([name, definition]) => withDocumentValue(
        definition.file,
        (value) => validateSingleton(name, value),
        definition.defaults,
        async () => ({ value: undefined, changed: false }),
      )),
  ]);
  const whatsappLink = arrayDefinitions['social-links'].defaults.find(
    (link) => link.id === 'whatsapp',
  );
  await withDocumentArray(
    'social-links.json',
    (records) => validateRecords('social-links', records),
    async (records) => {
      if (records.some((record) => record.id === 'whatsapp' || record.platform === 'whatsapp')) {
        return { value: undefined, changed: false };
      }
      return {
        value: undefined,
        records: [...records, whatsappLink],
        changed: true,
      };
    },
    arrayDefinitions['social-links'].defaults,
  );
}

export async function listContent(collection, { publishedOnly = false } = {}) {
  const definition = arrayFile(collection);
  return withDocumentArray(definition.file, (records) => validateRecords(collection, records), async (records) => {
    const selected = publishedOnly
      ? records.filter((record) => collection === 'social-links' ? record.enabled !== false : record.published !== false)
      : records;
    return { value: selected, changed: false };
  }, definition.defaults);
}

export async function createContent(collection, details) {
  const definition = arrayFile(collection);
  if (collection === 'messages') throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content collection does not exist.');
  const item = {
    ...validateCollectionInput(collection, details),
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await withDocumentArray(definition.file, (records) => validateRecords(collection, records), async (records) => ({
    value: item,
    records: [...records, item],
    changed: true,
  }), definition.defaults);
  return item;
}

export async function updateContent(collection, id, details) {
  const definition = arrayFile(collection);
  const value = validateCollectionInput(collection, details);
  let updated;
  await withDocumentArray(definition.file, (records) => validateRecords(collection, records), async (items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content item does not exist.');
    updated = { ...items[index], ...value, updatedAt: new Date().toISOString() };
    const records = [...items];
    records[index] = updated;
    return { value: updated, records, changed: true };
  }, definition.defaults);
  return updated;
}

export async function deleteContent(collection, id) {
  const definition = arrayFile(collection);
  await withDocumentArray(definition.file, (records) => validateRecords(collection, records), async (items) => {
    const records = items.filter((item) => item.id !== id);
    if (records.length === items.length) throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content item does not exist.');
    return { value: undefined, records, changed: true };
  }, definition.defaults);
}

export async function setMessageRead(id, read) {
  return withDocumentArray('messages.json', (records) => validateRecords('messages', records), async (items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new HttpError(404, 'MESSAGE_NOT_FOUND', 'The requested message does not exist.');
    const updated = { ...items[index], read, updatedAt: new Date().toISOString() };
    const records = [...items];
    records[index] = updated;
    return { value: updated, records, changed: true };
  }, arrayDefinitions.messages.defaults);
}

export async function getSingleton(name) {
  const definition = singletonFile(name);
  return withDocumentValue(
    definition.file,
    (value) => validateSingleton(name, value),
    definition.defaults,
    async (value) => ({ value, changed: false }),
  );
}

export async function updateSingleton(name, body) {
  const definition = singletonFile(name);
  const value = validateSingletonInput(name, body);
  return withDocumentValue(
    definition.file,
    (record) => validateSingleton(name, record),
    definition.defaults,
    async () => ({ value, records: value, changed: true }),
  );
}

export async function createContactMessage(details) {
  const message = {
    ...details,
    id: randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await withDocumentArray('messages.json', (records) => validateRecords('messages', records), async (items) => ({
    value: message,
    records: [...items, message],
    changed: true,
  }), arrayDefinitions.messages.defaults);
  return { id: message.id, createdAt: message.createdAt };
}

export async function getOverview() {
  const [projects, services, skills, messages, profile, settings, socialLinks] = await Promise.all([
    listContent('projects'),
    listContent('services'),
    listContent('skills'),
    listContent('messages'),
    getSingleton('profile'),
    getSingleton('settings'),
    listContent('social-links'),
  ]);
  const activity = [
    ...['projects', 'services', 'skills', 'socialLinks'].flatMap((name) => {
      const items = name === 'socialLinks' ? socialLinks : ({ projects, services, skills })[name];
      return items.map((item) => ({
        type: name,
        id: item.id,
        label: item.title || item.name || item.platform,
        at: item.updatedAt || item.createdAt,
      })).filter((item) => item.at);
    }),
    ...messages.map((item) => ({ type: 'message', id: item.id, label: item.subject, at: item.createdAt })),
  ].sort((left, right) => Date.parse(right.at) - Date.parse(left.at)).slice(0, 10);
  return {
    counts: {
      projects: projects.length,
      services: services.length,
      skills: skills.length,
      profile: profile ? 1 : 0,
      socialLinks: socialLinks.length,
      messages: messages.length,
      settings: settings ? 1 : 0,
    },
    recentActivity: activity,
  };
}
