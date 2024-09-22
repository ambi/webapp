import { Redis, type RedisOptions } from 'ioredis';

import { type Deserialize, type Serialize, defaultDeserialize, defaultSerialize } from './memory-db.js';

export interface MemoryDbOptions<T> {
  serialize?: Serialize<T>;
  deserialize?: Deserialize<T>;
  secondaryKeys?: string[];
  redisOptions: RedisOptions;
}

export class RedisDb<T extends { id: string; [key: string]: any }> {
  private serialize: Serialize<T>;
  private deserialize: Deserialize<T>;
  private secondaryKeys: string[];
  private db: Redis;

  constructor(options: MemoryDbOptions<T>) {
    this.serialize = options.serialize || defaultSerialize;
    this.deserialize = options.deserialize || defaultDeserialize;
    this.secondaryKeys = options.secondaryKeys || [];
    this.db = new Redis(options.redisOptions);
  }

  async get(id: string): Promise<T | undefined> {
    const data = await this.db.get(id);
    if (!data) {
      return undefined;
    }

    return this.deserialize(data);
  }

  async findBy(key: string, value: string): Promise<T | undefined> {
    const id = await this.db.hget(key, value);
    if (!id) {
      return undefined;
    }

    return await this.get(id);
  }

  async save(obj: T): Promise<void> {
    if (!obj.id) {
      throw new Error(`id must not be empty: ${obj}`);
    }

    for (const key of this.secondaryKeys) {
      const result = await this.db.hset(key, obj[key], obj.id);
      if (result === 0) {
        throw new Error(`index cannot be created: ${key}`);
      }
    }

    const result = await this.db.set(obj.id, this.serialize(obj));
    if (result !== 'OK') {
      throw new Error(`failed to save: ${obj}`);
    }
  }

  async delete(obj: T): Promise<boolean> {
    if (!obj.id) {
      throw new Error(`id must not be empty: ${obj}`);
    }

    for (const key of this.secondaryKeys) {
      await this.db.hdel(key, obj[key]);
    }

    const result = await this.db.del(obj.id);
    return result > 0;
  }
}
