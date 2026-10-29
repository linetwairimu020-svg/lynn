import { HttpError } from '../middleware/errorHandler.js';
import {
  createContactMessage,
  createContent,
  deleteContent,
  getOverview,
  getSingleton,
  listContent,
  replyToMessage,
  setMessageRead,
  updateContent,
  updateSingleton,
} from '../services/contentStore.js';
import {
  validateMessageInput,
  validateMessageReply,
  validateMessageUpdate,
} from '../services/contentValidation.js';

const publicCollections = new Set(['projects', 'services', 'skills', 'social-links']);
const managedCollections = new Set(['projects', 'services', 'skills', 'social-links', 'messages']);

function collectionName(value) {
  return value === 'social-links' ? 'social-links' : value;
}

export async function getPublicContent(request, response) {
  const name = request.params.name;
  if (name === 'profile' || name === 'settings') {
    response.json({ content: await getSingleton(name) });
    return;
  }
  const collection = collectionName(name);
  if (!publicCollections.has(collection)) {
    throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested public content does not exist.');
  }
  response.json({ content: await listContent(collection, { publishedOnly: true }) });
}

export async function getAdminContent(request, response) {
  const name = request.params.name;
  if (name === 'profile' || name === 'settings') {
    response.json({ content: await getSingleton(name) });
    return;
  }
  const collection = collectionName(name);
  if (!managedCollections.has(collection)) throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content collection does not exist.');
  response.json({ content: await listContent(collection) });
}

export async function createAdminContent(request, response) {
  const collection = collectionName(request.params.name);
  if (!managedCollections.has(collection) || collection === 'messages') {
    throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content collection does not exist.');
  }
  response.status(201).json({ content: await createContent(collection, request.body) });
}

export async function updateAdminContent(request, response) {
  const collection = collectionName(request.params.name);
  if (!managedCollections.has(collection) || collection === 'messages') {
    throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content collection does not exist.');
  }
  response.json({ content: await updateContent(collection, request.params.id, request.body) });
}

export async function deleteAdminContent(request, response) {
  const collection = collectionName(request.params.name);
  if (!managedCollections.has(collection)) {
    throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content collection does not exist.');
  }
  await deleteContent(collection, request.params.id);
  response.status(204).end();
}

export async function updateAdminSingleton(request, response) {
  const { name } = request.params;
  if (name !== 'profile' && name !== 'settings') throw new HttpError(404, 'CONTENT_NOT_FOUND', 'The requested content item does not exist.');
  response.json({ content: await updateSingleton(name, request.body) });
}

export async function getAdminOverview(_request, response) {
  response.json(await getOverview());
}

export async function submitContactMessage(request, response) {
  const details = validateMessageInput(request.body);
  const message = await createContactMessage(details);
  response.status(201).json({ message: 'Your message was received.', id: message.id });
}

export async function updateAdminMessage(request, response) {
  const { read } = validateMessageUpdate(request.body);
  response.json({ content: await setMessageRead(request.params.id, read) });
}

export async function replyToAdminMessage(request, response) {
  const { reply } = validateMessageReply(request.body);
  response.json({ content: await replyToMessage(request.params.id, reply) });
}
