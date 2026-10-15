import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/env.js';

const queues = new Map();

function serialize(filePath, operation) {
  const previous = queues.get(filePath) || Promise.resolve();
  const current = previous.catch(() => {}).then(operation);
  queues.set(filePath, current);
  return current.finally(() => {
    if (queues.get(filePath) === current) queues.delete(filePath);
  });
}

async function writeArray(filePath, records) {
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(temporaryPath, filePath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}

export function withJsonArray(fileName, validate, operation) {
  const filePath = path.join(config.dataDir, fileName);
  return serialize(filePath, async () => {
    await mkdir(config.dataDir, { recursive: true, mode: 0o700 });
    let content;
    try {
      content = await readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await writeArray(filePath, []);
      content = '[]';
    }

    let records;
    try {
      records = JSON.parse(content);
    } catch {
      throw new Error(`${fileName} contains invalid JSON; refusing to replace the file.`);
    }
    validate(records);

    const result = await operation(records);
    if (result.changed) await writeArray(filePath, result.records);
    return result.value;
  });
}
