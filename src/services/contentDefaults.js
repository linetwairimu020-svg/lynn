import profile from '../data/profile';
import projects from '../data/projects';
import services from '../data/services';
import skills from '../data/skills';
import settings from '../data/settings';
import socialLinks from '../data/socialLinks';

const defaults = { profile, projects, services, skills, settings, socialLinks, messages: [] };

export function getDefaultCollection(name) {
  if (!Object.hasOwn(defaults, name)) throw new Error(`Unknown content collection: ${name}`);
  return structuredClone(defaults[name]);
}
