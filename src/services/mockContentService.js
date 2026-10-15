import profile from '../data/profile';
import projects from '../data/projects';
import services from '../data/services';
import skills from '../data/skills';
import settings from '../data/settings';
import socialLinks from '../data/socialLinks';

const STORAGE_KEY = 'lynn-portfolio-preview-content';
const UPDATE_EVENT = 'lynn-portfolio-content-updated';
const defaults = { profile, projects, services, skills, settings, socialLinks, messages: [] };

const clone = (value) => JSON.parse(JSON.stringify(value));

function readSavedContent() {
  let saved;
  try {
    saved = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    throw new Error(`Preview storage is unavailable: ${error.message}`);
  }
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    throw new Error('Saved preview content is invalid. Clear the preview content in browser storage to restore defaults.');
  }
}

export function getCollection(name) {
  if (!Object.hasOwn(defaults, name)) throw new Error(`Unknown content collection: ${name}`);
  const saved = readSavedContent();
  return clone(saved[name] ?? defaults[name]);
}

export function saveCollection(name, value) {
  if (!Object.hasOwn(defaults, name)) throw new Error(`Unknown content collection: ${name}`);
  const saved = readSavedContent();
  saved[name] = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch (error) {
    throw new Error(`Could not save preview content: ${error.message}`);
  }
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { name } }));
}

export function subscribeToCollection(name, callback) {
  const onUpdate = (event) => {
    if (event.detail?.name === name) callback();
  };
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener(UPDATE_EVENT, onUpdate);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(UPDATE_EVENT, onUpdate);
    window.removeEventListener('storage', onStorage);
  };
}

export function getDefaultCollection(name) {
  if (!Object.hasOwn(defaults, name)) throw new Error(`Unknown content collection: ${name}`);
  return clone(defaults[name]);
}
