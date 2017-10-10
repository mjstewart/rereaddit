import { logIfError, log, logWithPayload, isEmpty } from '@js/util';
import * as pickBy from 'lodash.pickby';
import * as has from 'lodash.has';

// Setting keys used to access storage
export const unreadCommentHexColour = 'unreadCommentHexColour';

export type Success<T> = {
  success: T;
};

export type Failure = {
  reason: string;
};

export type DataAccessResult<T> = Success<T> | Failure;

/**
 * Data access interface into chrome storage
 * https://developer.chrome.com/apps/storage
 * 
 */
interface Repository {
  /**
   * Save the payload.
   * 
   * On resolve - The saved payload.
   * On reject - Fail reason.
   */
  save<T extends {}>(payload: T): Promise<T>;

  /**
   * Get by single key or many keys.
   * 
   * usage:
   * get(['firstname', 'address']) => { firstname: bob, address: 1 smith street }
   * 
   * On resolve - The saved payload.
   * On reject - Fail reason.
   */
  get(keys: string | string[]): Promise<{ [key: string]: any }>;

  /**
   * Get all items where the item key matches the supplied predicate.
   * For each item retrieved from storage, the items property is the key that gets
   * passed in to the predicate.
   * 
   * usage:
   * {a: 1, b: 2, c:3 } 
   * getAllBy(key => key === 'a') => {a: 1}
   * 
   * On resolve - The saved payload.
   * On reject - Fail reason.
   */
  getAllBy(predicate: (key: string) => boolean): Promise<{ [key: string]: any }>;

  /**
   * Clear entire storage
   * 
   * On resolve - true if successful and the storage is now completely empty, otherwise false.
   * On reject - Fail reason.
   */
  deleteAll(): Promise<boolean>;

  /**
   * Delete all items that match the supplied keys.
   * 
   * On resolve - true if successful and the storage no longer contains the 
   * deleted keys, otherwise false. 
   * On reject - Fail reason.
   */
  deleteBy(keys: string[]): Promise<boolean>;
}

const getError = (): string | undefined => {
  if (chrome.runtime.lastError) {
    if (chrome.runtime.lastError.message) {
      return chrome.runtime.lastError.message;
    }
    return 'Error accessing storage';
  }
  return undefined;
};

export class ChromeStorageRepository implements Repository {
  save<T extends {}>(payload: T): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(payload, () => {
        const error = getError();
        if (error) {
          reject(error);
        } else {
          resolve(payload);
        }
      });
    });
  }

  get(keys: string | string[]): Promise<{ [key: string]: any; }> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (result) => {
        const error = getError();
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  getAllBy(predicate: (key: string) => boolean): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, (results) => {
        const error = getError();
        if (error) {
          reject(error);
        } else {
          const filteredObject = pickBy(results, (v, k) => predicate(k));
          resolve(filteredObject);
        }
      });
    });
  }

  deleteAll(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.clear(() => {
        const error = getError();
        if (error) {
          reject(error);
        } else {
          this.getAllBy(x => true)
            .then(vals => resolve(isEmpty(vals)))
            .catch(vals => resolve(false));
        }
      });
    });
  }

  deleteBy(keys: string[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove(keys, () => {
        const error = getError();
        if (error) {
          reject(error);
        } else {
          this.getAllBy(x => true)
            .then((data) => {
              const removedAllKeys = keys.map(key => has(data, key))
                .reduce((acc, x) => x && acc, true);
              resolve(isEmpty(removedAllKeys));
            })
            .catch(vals => resolve(false));
        }
      });
    });
  }
}


export const save = <T extends {}>(payload: T) => {
  logWithPayload('storage.ts saving', payload);
  chrome.storage.sync.set(payload, () => {
    if (chrome.runtime.lastError && process.env.LOGGING) {
      logIfError('error saving to storage');
    }
  });
};

export const clear = () => chrome.storage.sync.clear(() => {
  log('cleared storage');
  logIfError('error clearing local storage');
});

/**
 * Given a url such as 'https://www.reddit.com/r/java/comments/74x9gv/title?queryParams'. 
 * The dervived id is the hash and title after the comments joined together = 74x9gvtitle.
 * 
 * This is used as the key in storage api.
 * 
 * @param url
 * @return The derived id otherwise an empty string.
 */
export const getUrlForCommentId = (url: string) => {
  log(`storage.ts getUrlForCommentId url=${url}`);
  if (url === '') return '';
  const tokens = url.split('/');
  const index = tokens.indexOf('comments') + 1;
  return tokens.slice(index, index + 2).join('');
};

