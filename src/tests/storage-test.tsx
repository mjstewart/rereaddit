import * as chrome from 'sinon-chrome';
import { assert } from 'chai';
import * as mocha from 'mocha';
import { repository, getArticleIdFromCommentUrl, StorageType } from '@js/storage';

declare const global;

const makeTestPayload = value => ({
  value,
  type: StorageType.COMMENT,
});

describe('ChromeStorageRepository - storage.ts', () => {

  before(() => {
    global.chrome = chrome;
  });

  beforeEach(() => {
    chrome.flush();
  });

  after(() => {
    chrome.flush();
    delete global.chrome;
  });

  describe('save', () => {
    it('rejects promise when error accessing storage', async () => {
      chrome.runtime.lastError = { message: 'error' };
      const savePayload = { a: { value: 1, type: StorageType.COMMENT } };
      chrome.storage.sync.set.yields();

      try {
        const actual = await repository.save(savePayload);
      } catch (e) {
        assert.strictEqual('error', e);
      }

      assert.ok(chrome.storage.sync.set.calledOnce);
    });

    it('saves successfully and returns the original payload', async () => {
      const savePayload = { a: { value: 1, type: StorageType.COMMENT } };
      chrome.storage.sync.set.yields();

      const actual = await repository.save(savePayload);

      assert.deepEqual(savePayload, actual);
      assert.ok(chrome.storage.sync.set.calledOnce);
    });
  });

  describe('getAllBy', () => {
    it('rejects promise when error accessing storage', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
      };

      chrome.runtime.lastError = { message: 'error' };
      chrome.storage.sync.get.yields(data);

      try {
        const actual = await repository.getAllBy((key, type) => true);
      } catch (e) {
        assert.strictEqual('error', e);
      }

      assert.ok(chrome.storage.sync.get.calledOnce);
    });

    it('returns empty object when storage is empty', async () => {
      const data = {};
      chrome.storage.sync.get.yields(data);

      const actual = await repository.getAllBy((key, type) => true);

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.isEmpty(actual);
    });

    it('returns all data in non empty storage', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.SETTING },
        c: { value: 3, type: StorageType.COMMENT },
        d: { value: 4, type: StorageType.COMMENT },
        e: { value: 5, type: StorageType.SETTING },
      };
      chrome.storage.sync.get.yields(data);

      const actual = await repository.getAllBy((key, type) => true);

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(data, actual);
    });

    it('returns data that matches predicate key only', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.SETTING },
        c: { value: 3, type: StorageType.COMMENT },
        d: { value: 4, type: StorageType.COMMENT },
        e: { value: 5, type: StorageType.SETTING },
      };
      const expect = {
        a: { value: 1, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
      };

      chrome.storage.sync.get.yields(data);

      const actual = await repository.getAllBy((key, type) => {
        return key === 'a' || key === 'c';
      });

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(actual, expect);
    });

    it('returns data that matches predicate value StorageType', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.SETTING },
        c: { value: 3, type: StorageType.COMMENT },
        d: { value: 4, type: StorageType.COMMENT },
        e: { value: 5, type: StorageType.SETTING },
      };
      const expect = {
        b: { value: 2, type: StorageType.SETTING },
        e: { value: 5, type: StorageType.SETTING },
      };

      chrome.storage.sync.get.yields(data);

      const actual = await repository.getAllBy((key, type) => {
        return type === StorageType.SETTING;
      });

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(actual, expect);
    });

    it('returns data that matches predicate key and value StorageType', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.SETTING },
        c: { value: 3, type: StorageType.COMMENT },
        d: { value: 4, type: StorageType.COMMENT },
        e: { value: 5, type: StorageType.SETTING },
      };
      const expect = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.SETTING },
        e: { value: 5, type: StorageType.SETTING },
      };

      chrome.storage.sync.get.yields(data);

      const actual = await repository.getAllBy((key, type) => {
        return key === 'a' || type === StorageType.SETTING;
      });

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(actual, expect);
    });
  });

  describe('getAll', () => {
    it('rejects promise when error accessing storage', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
      };

      chrome.runtime.lastError = { message: 'error' };
      chrome.storage.sync.get.yields(data);

      try {
        const actual = await repository.getAll();
      } catch (e) {
        assert.strictEqual('error', e);
      }

      assert.ok(chrome.storage.sync.get.calledOnce);
    });

    it('returns empty object when storage is empty', async () => {
      const data = {};
      chrome.storage.sync.get.yields(data);

      const actual = await repository.getAll();

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.isEmpty(actual);
    });

    it('returns all data in non empty storage', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.SETTING },
        c: { value: 3, type: StorageType.COMMENT },
        d: { value: 4, type: StorageType.COMMENT },
        e: { value: 5, type: StorageType.SETTING },
      };
      chrome.storage.sync.get.yields(data);

      const actual = await repository.getAll();

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(data, actual);
    });
  });

  describe('get', () => {
    it('rejects promise when error accessing storage', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
      };

      chrome.runtime.lastError = { message: 'error' };
      chrome.storage.sync.get.yields(data);

      try {
        const actual = await repository.get('key');
      } catch (e) {
        assert.strictEqual('error', e);
      }

      assert.ok(chrome.storage.sync.get.calledOnce);
    });

    it('returns empty object when storage is empty', async () => {
      const data = {};
      chrome.storage.sync.get.yields(data);

      const actual = await repository.get<{}>('key');
      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(actual, {});
    });

    it('returns single result when single key is provided and storage is non empty', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
      };
      const expect = { a: { value: 1, type: StorageType.COMMENT } };

      type Expect = {
        a: { value: number, type: StorageType.COMMENT };
      };

      chrome.storage.sync.get.yields(expect);

      const actual = await repository.get<Expect>('a');

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(actual, expect);
    });

    it('returns multiple results when array of keys is provided and storage is non empty', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
      };
      const expect = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
      };
      type Expect = {
        a: { value: number, type: StorageType.COMMENT };
        b: { value: number, type: StorageType.COMMENT };
      };
      chrome.storage.sync.get.yields(expect);

      const actual = await repository.get<Expect>(['a', 'b']);

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(actual, expect);
    });
  });

  describe('deleteAll', () => {
    it('rejects promise when error accessing storage', async () => {
      chrome.runtime.lastError = { message: 'error' };
      chrome.storage.sync.clear.yields();

      try {
        const actual = await repository.deleteAll();
      } catch (e) {
        assert.strictEqual('error', e);
      }

      assert.ok(chrome.storage.sync.clear.calledOnce);
    });

    it('returns true when trying to clear empty storage', async () => {
      const data = {};
      chrome.storage.sync.clear.yields();
      chrome.storage.sync.get.yields({});

      const actual = await repository.deleteAll();
      const currentStorage = await repository.getAll();

      assert.ok(chrome.storage.sync.clear.calledOnce);
      assert.isTrue(actual);
      assert.deepEqual(currentStorage, {});
    });

    it('all data is cleared from non empty storage', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
      };
      chrome.storage.sync.clear.yields();
      chrome.storage.sync.get.yields({});

      const actual = await repository.deleteAll();
      const currentStorage = await repository.getAll();

      assert.ok(chrome.storage.sync.clear.calledOnce);
      assert.isTrue(actual);
      assert.deepEqual(currentStorage, {});
    });
  });

  describe('deleteKeys', () => {
    it('rejects promise when error accessing storage', async () => {
      chrome.runtime.lastError = { message: 'error' };
      chrome.storage.sync.remove.yields();

      try {
        const actual = await repository.deleteKeys(['key']);
      } catch (e) {
        assert.strictEqual('error', e);
      }

      assert.ok(chrome.storage.sync.remove.calledOnce);
    });

    it('returns true when trying to delete single key from empty storage', async () => {
      const data = {};
      chrome.storage.sync.remove.yields();
      chrome.storage.sync.get.yields({});

      const actual = await repository.deleteKeys(['key']);

      assert.isTrue(actual);
      assert.ok(chrome.storage.sync.remove.calledOnce);
    });

    it('returns true when all deleted keys are actually removed from non empty storage', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
      };
      const expectAfterDelete = {
        b: { value: 2, type: StorageType.COMMENT },
      };

      chrome.storage.sync.remove.yields();
      chrome.storage.sync.get.yields(expectAfterDelete);

      const actual = await repository.deleteKeys(['a', 'c']);

      assert.isTrue(actual);
      assert.ok(chrome.storage.sync.remove.calledOnce);
    });

    it('returns false when some requested deleted keys are still in storage', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
      };

      // request to delete a and c, but c is still in storage for whatever reason.
      const expectAfterDelete = {
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
      };

      chrome.storage.sync.remove.yields();
      chrome.storage.sync.get.yields(expectAfterDelete);

      const actual = await repository.deleteKeys(['a', 'c']);

      assert.ok(chrome.storage.sync.remove.calledOnce);
      assert.isFalse(actual);
    });
  });

  describe('deleteBy', () => {
    it('rejects promise when error accessing storage', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
        d: { value: 4, type: StorageType.SETTING },
      };

      chrome.runtime.lastError = { message: 'error' };
      chrome.storage.sync.get.yields(data);
      chrome.storage.sync.remove.yields();

      try {
        const actual = await repository.deleteBy((key, type) => {
          return type === StorageType.COMMENT;
        });
      } catch (e) {
        assert.strictEqual('error', e);
      }
    });

    it('Returns true when non existing key is deleted', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
        d: { value: 4, type: StorageType.SETTING },
      };

      chrome.storage.sync.get.yields(data);
      chrome.storage.sync.remove.yields();

      const actual = await repository.deleteBy((key, type) => {
        return key === 'e';
      });

      assert.isTrue(actual);
      assert.ok(chrome.storage.sync.remove.calledOnce);
      // Get all entries before and after delete
      assert.ok(chrome.storage.sync.get.calledTwice);
    });

    it('Returns false when deleted key still exists after deletion', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
        d: { value: 4, type: StorageType.SETTING },
      };

      // Try delete 'b' but its still there after deletion.
      const expect = data;

      chrome.storage.sync.get
        .onCall(0).yields(data)
        .onCall(1).yields(expect);

      chrome.storage.sync.remove.yields();

      const actual = await repository.deleteBy((key, type) => {
        return key === 'b';
      });

      assert.isFalse(actual);
      assert.ok(chrome.storage.sync.remove.calledOnce);
      // Get all entries before and after delete
      assert.ok(chrome.storage.sync.get.calledTwice);
    });

    it('Deletes matching predicate entries and returns true denoting deleted keys no longer exist', async () => {
      const data = {
        a: { value: 1, type: StorageType.COMMENT },
        b: { value: 2, type: StorageType.COMMENT },
        c: { value: 3, type: StorageType.COMMENT },
        d: { value: 4, type: StorageType.SETTING },
      };

      const expect = {
        d: { value: 4, type: StorageType.SETTING },
      };

      chrome.storage.sync.get
        .onCall(0).yields(data)
        .onCall(1).yields(expect);

      chrome.storage.sync.remove.yields();

      const actual = await repository.deleteBy((key, type) => {
        return type === StorageType.COMMENT;
      });

      assert.isTrue(actual);
      assert.ok(chrome.storage.sync.remove.calledOnce);
      // Get all entries before and after delete
      assert.ok(chrome.storage.sync.get.calledTwice);
    });
  });
});

describe('getArticleIdFromCommentUrl', () => {
  it('returns empty string when url is empty', () => {
    const url = '';
    const expect = '';
    const actual = getArticleIdFromCommentUrl(url);
    assert.strictEqual(actual, expect);
  });

  it('returns valid article id when there are no query params', () => {
    const url = 'https://www.reddit.com/r/java/comments/74x9gv/title';
    const expect = '74x9gv';
    const actual = getArticleIdFromCommentUrl(url);
    assert.strictEqual(actual, expect);
  });

  it('returns valid article id when there are query params seperated from the title by a /', () => {
    const url = 'https://www.reddit.com/r/java/comments/75fs3p/title/?utm_content=comments&utm_medium=hot&utm_source=reddit&utm_name=java';
    const expect = '75fs3p';
    const actual = getArticleIdFromCommentUrl(url);
    assert.strictEqual(actual, expect);
  });

  it('returns valid article id when there are query params joined with the title', () => {
    const url = 'https://www.reddit.com/r/java/comments/75fs3p/title?utm_content=comments&utm_medium=hot&utm_source=reddit&utm_name=java';
    const expect = '75fs3p';
    const actual = getArticleIdFromCommentUrl(url);
    assert.strictEqual(actual, expect);
  });
});
