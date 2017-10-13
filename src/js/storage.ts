import * as logging from '@js/logging';
import * as pickby from 'lodash.pickby';
import * as isempty from 'lodash.isempty';
import * as has from 'lodash.has';
import { Message } from '@js/messages';
 

/**
  * Example storage structure
  
  {
  "75odv7": {
    "articleId": "75odv7",
    "lastViewedTime": "Thu Oct 12 2017 17:38:41 GMT+1030 (Cen. Australia Daylight Time)",
    "tagline": "submitted 19 hours ago by user",
    "title": "some title",
    "type": "COMMENT"
  },
  "unreadCommentColor": {
    "color": "#B3ECB7",
    "type": "SETTING"
  }
 }
 */

/**
 * Types of data stored to allow querying / filtering.
 */
export enum StorageType {
  SETTING = 'SETTING',
  COMMENT = 'COMMENT',
}

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
   * Delegates to getAllBy with the predicate(key, value.type) => true.
   */
  getAll(): Promise<{ [key: string]: any }>;

  /**
   * Get all entries matching the supplied predicate.
   * 
   * Every value in storage has a StorageType field used for filtering.
   * The predicate gets passed in the key and StorageType which the caller can use to decide
   * if the item should be included in the final result.
   * 
   * for each (key, value) pair in storage { 
   *    if (predicate(key, value.type)) {
   *       return pair
   *    }
   * }
   * 
   * usage:
   * { 
   *   a: { value: 1, type: StorageType.COMMENT },
   *   b: { value: 2, type: StorageType.COMMENT },
   *   c: { value: 3, type: StorageType.COMMENT }
   * }
   * 
   * getAllBy((key, type) => key === 'a') => {a: { value: 1, type: StorageType.COMMENT }}
   * 
   * On resolve - The saved payload.
   * On reject - Fail reason.
   */
  getAllBy(predicate: (key: string, type: StorageType) => boolean): Promise<{ [key: string]: any }>;

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

export const getError = (): string | undefined => {
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

  getAll(): Promise<{ [key: string]: any }> {
    return this.getAllBy((k, type) => true);
  }

  getAllBy(predicate: (key: string, type: StorageType) => boolean): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, (results) => {
        const error = getError();
        if (error) {
          reject(error);
        } else {
          const filteredObject = pickby(results, (v, k) => predicate(k, v.type));
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
          this.getAll()
            .then(vals => resolve(isempty(vals)))
            .catch(e => reject(e));
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
          this.getAll()
            .then((data) => {
              console.log('keys: ', keys + ' ,data: ', data);
              
              const isAllKeysDeleted = keys.map(key => !has(data, key))
                .reduce((acc, x) => x && acc, true);
              resolve(isAllKeysDeleted);
            })
            .catch(e => reject(e));
        }
      });
    });
  }
}

/**
 * Given a url such as 'https://www.reddit.com/r/java/comments/74x9gv/title?queryParams'.
 * 
 * reddit api - GET [/r/subreddit]/comments/article
 * 
 * This function returns the article id of 74x9gv.
 * 
 * @param url
 * @return The derived id otherwise an empty string.
 */
export const getArticleIdFromCommentUrl = (url: string) => {
  if (url === '') return '';
  const tokens = url.split('/');
  const index = tokens.indexOf('comments') + 1;
  return tokens.slice(index, index + 1)[0];
};


export const repository = new ChromeStorageRepository();
