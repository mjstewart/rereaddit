import { logIfError, log, logWithPayload } from '@js/logging';
import * as pickby from 'lodash.pickby';
import * as isempty from 'lodash.isempty';
import * as has from 'lodash.has';

// Setting keys used to access storage
export const unreadCommentHexColour = 'unreadCommentHexColour';

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
   * Get by single key or many keys. The result will be cast into T.
   * 
   * usage:
   * get(['firstname', 'address']) => { firstname: bob, address: 1 smith street }
   * 
   * On resolve - Object with the query keys populated with values.
   * On reject - Fail reason.
   */
  get<T>(keys: string | string[]): Promise<T>;

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
  deleteKeys(keys: string[]): Promise<boolean>;
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

class ChromeStorageRepository implements Repository {
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

  get<T>(keys: string | string[]): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (result) => {
        const error = getError();
        if (error) {
          reject(error);
        } else {
          resolve(result as T);
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
          const filteredObject = pickby(results, (v, k) => predicate(k));
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
            .then(vals => resolve(isempty(vals)))
            .catch(vals => resolve(false));
        }
      });
    });
  }

  deleteKeys(keys: string[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove(keys, () => {
        const error = getError();
        if (error) {
          reject(error);
        } else {
          this.getAllBy(x => true)
            .then((data) => {
              const containsDeletedKeys = keys.map(key => has(data, key))
                .reduce((acc, x) => x && acc, true);
              resolve(!containsDeletedKeys);
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
 * 
 * reddit api - GET [/r/subreddit]/comments/article
 * 
 * This function returns the article id of 74x9gv.
 * An id is created in the form of 'comment:74x9gv to allow querying the store for comment keys only.
 * 
 * @param url
 * @return The derived id otherwise an empty string.
 */
export const getArticleIdFromCommentUrl = (url: string) => {
  if (url === '') return '';
  const tokens = url.split('/');
  const index = tokens.indexOf('comments') + 1;
  return `comment:${tokens.slice(index, index + 1)[0]}`;
};


export const repository = new ChromeStorageRepository();
