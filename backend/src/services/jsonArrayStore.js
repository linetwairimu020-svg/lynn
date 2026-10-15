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

async function writeJson(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(temporaryPath, filePath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}

async function readOrInitialize(filePath, fileName, validate, initialValue) {
  await mkdir(config.dataDir, { recursive: true, mode: 0o700 });
  let content;
  try {
    content = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    validate(initialValue);
    await writeJson(filePath, initialValue);
    content = JSON.stringify(initialValue);
  }

  let value;
  try {
    value = JSON.parse(content);
  } catch {
    throw new Error(`${fileName} contains invalid JSON; refusing to replace the file.`);
  }
  validate(value);
  return value;
}

export function withJsonArray(fileName, validate, operation, initialRecords = []) {
  const filePath = path.join(config.dataDir, fileName);
  return serialize(filePath, async () => {
    const records = await readOrInitialize(filePath, fileName, validate, initialRecords);
    const result = await operation(records);
    if (result.changed) await writeJson(filePath, result.records);
    return result.value;
  });
}

export function withJsonValue(fileName, validate, initialValue, operation) {
  const filePath = path.join(config.dataDir, fileName);
  return serialize(filePath, async () => {
    const value = await readOrInitialize(filePath, fileName, validate, initialValue);
    const result = await operation(value);
    if (result.changed) await writeJson(filePath, result.records);
    return result.value;
  });
}
