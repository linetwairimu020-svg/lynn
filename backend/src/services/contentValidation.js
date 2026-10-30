import { HttpError } from '../middleware/errorHandler.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const iconPattern = /^bi-[a-z0-9-]{1,60}$/;
const collectionFields = {
  projects: ['title', 'number', 'status', 'description', 'image', 'technologies', 'route', 'demoUrl', 'repositoryUrl', 'comingSoon', 'published'],
  services: ['title', 'icon', 'description', 'published'],
  skills: ['name', 'icon', 'skills', 'published'],
  'social-links': ['platform', 'name', 'url', 'icon', 'enabled'],
};

function invalid(message) {
  throw new HttpError(400, 'INVALID_CONTENT', message);
}

function cleanText(value, label, { required = false, max = 5000 } = {}) {
  if (typeof value !== 'string') invalid(`${label} must be text.`);
  const clean = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (clean.length > max || (required && clean.length === 0)) invalid(`${label} is required and must not exceed ${max} characters.`);
  return clean;
}

function checkKeys(body, allowed, required) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).some((key) => !allowed.includes(key))
    || required.some((key) => !Object.hasOwn(body, key))) {
    invalid('The content fields are invalid or incomplete.');
  }
}

function optionalUrl(value, label) {
  const clean = cleanText(value, label, { max: 2048 });
  if (!clean) return '';
  let parsed;
  try {
    parsed = new URL(clean);
  } catch {
    invalid(`${label} must be an absolute HTTP or HTTPS URL.`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    invalid(`${label} must be an absolute HTTP or HTTPS URL without embedded credentials.`);
  }
  return parsed.toString();
}

function optionalIcon(value) {
  const clean = cleanText(value, 'Icon', { max: 64 });
  if (clean && !iconPattern.test(clean)) invalid('Icon must be a Bootstrap Icons class such as bi-window.');
  return clean;
}

function optionalBoolean(value, label, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') invalid(`${label} must be true or false.`);
  return value;
}

function stringList(value, label) {
  if (!Array.isArray(value) || value.length > 100
    || value.some((entry) => typeof entry !== 'string' || entry.trim().length > 100)) {
    invalid(`${label} must be a list of up to 100 text items.`);
  }
  return value.map((entry) => cleanText(entry, label, { max: 100 })).filter(Boolean);
}

export function validateCollectionInput(collection, body) {
  const allowed = collectionFields[collection];
  if (!allowed) throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content collection does not exist.');
  const required = collection === 'projects'
    ? ['title', 'status', 'description']
    : collection === 'services'
      ? ['title', 'description']
      : collection === 'skills'
        ? ['name', 'skills']
        : ['platform', 'name', 'url', 'icon'];
  checkKeys(body, allowed, required);

  const value = {};
  for (const field of allowed) {
    if (!Object.hasOwn(body, field)) continue;
    if (['title', 'name', 'status', 'number', 'description'].includes(field)) {
      value[field] = cleanText(body[field], field, { required: required.includes(field), max: field === 'description' ? 5000 : 160 });
    } else if (['image', 'demoUrl', 'repositoryUrl', 'url'].includes(field)) {
      value[field] = optionalUrl(body[field], field);
    } else if (field === 'route') {
      const route = cleanText(body[field], field, { max: 300 });
      if (route && (!route.startsWith('/') || route.startsWith('//') || route.includes('\\'))) invalid('Route must be an internal path.');
      value[field] = route;
    } else if (field === 'icon') {
      value[field] = optionalIcon(body[field]);
    } else if (field === 'skills' || field === 'technologies') {
      value[field] = stringList(body[field], field);
    } else if (field === 'platform') {
      value[field] = cleanText(body[field], 'platform', { required: true, max: 32 }).toLowerCase();
      if (!/^[a-z0-9-]+$/.test(value[field])) invalid('Platform may contain only lowercase letters, numbers, and hyphens.');
    } else if (field === 'comingSoon' || field === 'published' || field === 'enabled') {
      value[field] = optionalBoolean(body[field], field, field === 'published' || field === 'enabled');
    }
  }
  return value;
}

export function validateSingletonInput(name, body) {
  const profileFields = ['name', 'headline', 'summary', 'about', 'location', 'email', 'phone'];
  const settingsFields = [
    'siteTitle', 'notice', 'seoTitle', 'defaultMetaDescription', 'ogImageUrl',
    'adminDisplayName', 'adminEmail', 'adminUsername', 'contactEmail',
    'emailNotifications', 'maintenanceMode', 'maintenanceMessage', 'defaultTheme',
    'accentColor', 'twoFactorEnabled', 'analyticsId', 'resumeFileName', 'resumeUpdatedAt',
  ];
  const fields = name === 'profile'
    ? profileFields
    : name === 'settings'
      ? settingsFields
      : null;
  if (!fields) throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content item does not exist.');
  checkKeys(body, fields, name === 'profile' ? profileFields.filter((field) => field !== 'location' && field !== 'phone') : ['siteTitle']);
  const value = {};

  for (const field of fields) {
    if (name === 'profile') {
      const required = field !== 'location' && field !== 'phone';
      value[field] = cleanText(body[field] ?? '', field, { required, max: field === 'about' || field === 'summary' ? 5000 : 250 });
    } else if (field === 'siteTitle' || field === 'notice' || field === 'seoTitle' || field === 'defaultMetaDescription' || field === 'maintenanceMessage' || field === 'adminDisplayName' || field === 'adminUsername' || field === 'resumeFileName' || field === 'resumeUpdatedAt' || field === 'analyticsId' || field === 'contactEmail' || field === 'adminEmail' || field === 'defaultTheme' || field === 'accentColor' || field === 'ogImageUrl') {
      if (field === 'ogImageUrl') {
        value[field] = optionalUrl(body[field] ?? '', field);
      } else if (field === 'defaultTheme') {
        const rawTheme = body[field];
        const safeTheme = typeof rawTheme === 'string'
          ? rawTheme.trim().toLowerCase()
          : typeof rawTheme === 'boolean'
            ? rawTheme ? 'dark' : 'light'
            : '';
        const normalizedTheme = safeTheme === 'system preference' ? 'system' : safeTheme;
        if (!normalizedTheme) {
          value[field] = 'system';
        } else if (['dark', 'light', 'system'].includes(normalizedTheme)) {
          value[field] = normalizedTheme;
        } else {
          invalid('Default theme must be dark, light, or system.');
        }
      } else if (field === 'accentColor') {
        const safeColor = cleanText(body[field] ?? '', field, { required: false, max: 32 });
        if (safeColor && !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(safeColor)) invalid('Accent color must be a valid hex color.');
        value[field] = safeColor;
      } else if (field === 'contactEmail' || field === 'adminEmail') {
        const email = cleanText(body[field] ?? '', field, { required: false, max: 254 });
        if (email && !emailPattern.test(email)) invalid(`${field} must be a valid email address.`);
        value[field] = email;
      } else {
        const required = field === 'siteTitle';
        const max = field === 'maintenanceMessage' || field === 'defaultMetaDescription' ? 500 : 250;
        value[field] = cleanText(body[field] ?? '', field, { required, max });
      }
    } else if (['emailNotifications', 'maintenanceMode', 'twoFactorEnabled'].includes(field)) {
      value[field] = optionalBoolean(body[field], field, false);
    }
  }

  if (name === 'profile' && !emailPattern.test(value.email)) invalid('Email must be a valid email address.');
  return value;
}

export function validateMessageInput(body) {
  checkKeys(body, ['name', 'email', 'subject', 'message'], ['name', 'email', 'subject', 'message']);
  const value = {
    name: cleanText(body.name, 'Name', { required: true, max: 120 }),
    email: cleanText(body.email, 'Email', { required: true, max: 254 }).toLowerCase(),
    subject: cleanText(body.subject, 'Subject', { required: true, max: 120 }),
    message: cleanText(body.message, 'Message', { required: true, max: 5000 }),
  };
  if (!emailPattern.test(value.email)) invalid('Email must be a valid email address.');
  return value;
}

export function validateStoredRecord(collection, record) {
  if (collection === 'messages') {
    const {
      id, createdAt, updatedAt, read, reply, repliedAt, status, ...details
    } = record;
    validateMessageInput(details);
    if (typeof read !== 'boolean') throw new Error('messages.json contains an invalid message record.');
    if (reply !== undefined && reply !== null
      && (typeof reply !== 'string' || reply.length > 5000)) {
      throw new Error('messages.json contains an invalid message reply.');
    }
    if (repliedAt !== undefined && repliedAt !== null
      && (typeof repliedAt !== 'string' || !Number.isFinite(Date.parse(repliedAt)))) {
      throw new Error('messages.json contains an invalid reply timestamp.');
    }
    if (status !== undefined && !['unread', 'read', 'replied'].includes(status)) {
      throw new Error('messages.json contains an invalid message status.');
    }
    return;
  }
  const { id, createdAt, updatedAt, ...details } = record;
  validateCollectionInput(collection, details);
}

export function validateMessageUpdate(body) {
  checkKeys(body, ['read'], ['read']);
  if (typeof body.read !== 'boolean') invalid('Read must be true or false.');
  return { read: body.read };
}

export function validateMessageReply(body) {
  checkKeys(body, ['reply'], ['reply']);
  return { reply: cleanText(body.reply, 'Reply', { required: true, max: 5000 }) };
}
