import * as chrome from 'sinon-chrome';
import { assert } from 'chai';
import * as mocha from 'mocha';
import { ChromeStorageRepository, getArticleIdFromCommentUrl } from '@js/storage';

declare const global;

describe('ChromeStorageRepository - storage.ts', () => {
  const repository = new ChromeStorageRepository();

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
    it('rejects promise when error accessing storage', async() => {
      chrome.runtime.lastError = { message: 'error' };
      const savePayload = { a: 1 };
      chrome.storage.sync.set.yields();

      try {
        const actual = await repository.save(savePayload);
      } catch (e) {
        assert.strictEqual('error', e);
      }

      assert.ok(chrome.storage.sync.set.calledOnce);
    });
    
    it('saves successfully and returns the original payload', async() => {
      const savePayload = { a: 1 };
      chrome.storage.sync.set.yields();

      const actual = await repository.save(savePayload);
      
      assert.deepEqual(savePayload, actual);
      assert.ok(chrome.storage.sync.set.calledOnce);
    });
  });

  describe('getAllBy', () => {
    it('rejects promise when error accessing storage', async () => {
      const data = { a: 1, b: 2, c: 3 };

      chrome.runtime.lastError = { message: 'error' };
      chrome.storage.sync.get.yields(data);

      try {
        const actual = await repository.getAllBy(key => true);
      } catch (e) {
        assert.strictEqual('error', e);
      }

      assert.ok(chrome.storage.sync.get.calledOnce);
    });

    it('returns empty object when storage is empty', async () => {
      const data = {};
      chrome.storage.sync.get.yields(data);

      const actual = await repository.getAllBy(key => true);

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.isEmpty(actual);
    });

    it('returns all data in non empty storage', async () => {
      const data = { a: 1, b: 2, c: 3 };
      chrome.storage.sync.get.yields(data);

      const actual = await repository.getAllBy(key => true);

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(data, actual);
    });

    it('returns data that matches predicate', async () => {
      const data = { a: 1, b: 2, c: 3 };
      const expect = { a: 1, c: 3 };

      chrome.storage.sync.get.yields(data);

      const actual = await repository.getAllBy((key) => {
        return key === 'a' || key === 'c';
      });

      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(actual, expect);
    });
  });

  describe('get', () => {
    it('rejects promise when error accessing storage', async () => {
      const data = { a: 1, b: 2, c: 3 };

      chrome.runtime.lastError = { message: 'error' };
      chrome.storage.sync.get.yields(data);

      try {
        const actual = await repository.getAllBy(key => true);
      } catch (e) {
        assert.strictEqual('error', e);
      }

      assert.ok(chrome.storage.sync.get.calledOnce);
    });

    it('returns empty object when storage is empty', async () => {
      const data = {};
      chrome.storage.sync.get.yields(data);

      const actual = await repository.get('key');
      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(actual, {});
    });

    it('returns single value when single string key is provided and storage is non empty', async () => {
      const data = { a: 1, b: 2, c: 3 };
      const expect = { a: 1 };
      chrome.storage.sync.get.yields(expect);

      const actual = await repository.get('a');
      
      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(actual, expect);
    });

    it('returns multiple values when array of keys is provided and storage is non empty', async () => {
      const data = { a: 1, b: 2, c: 3 };
      const expect = { a: 1, b: 2 };
      chrome.storage.sync.get.yields(expect);

      const actual = await repository.get(['a', 'b']);
      
      assert.ok(chrome.storage.sync.get.calledOnce);
      assert.deepEqual(actual, expect);
    });
  });

  describe('deleteAll', () => {
    it('rejects promise when error accessing storage', async() => {
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
      chrome.storage.sync.clear.yields(true);
      chrome.storage.sync.get.yields({});

      const actual = await repository.deleteAll();
      const currentStorage = await repository.getAllBy(x => true);

      assert.ok(chrome.storage.sync.clear.calledOnce);
      assert.isTrue(actual);
      assert.deepEqual(currentStorage, {});
    });

    it('all data is cleared from non empty storage', async () => {
      const data = { a: 1, b: 2, c: 3 };
      chrome.storage.sync.clear.yields(true);
      chrome.storage.sync.get.yields({});

      const actual = await repository.deleteAll();
      const currentStorage = await repository.getAllBy(x => true);

      assert.ok(chrome.storage.sync.clear.calledOnce);
      assert.isTrue(actual);
      assert.deepEqual(currentStorage, {});
    });
  });

  describe('deleteKeys', () => {
    it('rejects promise when error accessing storage', async() => {
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
      
      assert.ok(chrome.storage.sync.remove.calledOnce);
      assert.isTrue(actual);
    });

    it('returns true when clearing many keys non empty storage', async () => {
      const data = { a: 1, b: 2, c: 3 };
      const expectAfterDelete = { b: 2 };

      chrome.storage.sync.remove.yields();
      chrome.storage.sync.get.yields(expectAfterDelete);

      const actual = await repository.deleteKeys(['a', 'c']);
      const currentStorage = await repository.getAllBy(x => true);

      assert.ok(chrome.storage.sync.remove.calledOnce);
      assert.isTrue(actual);
    });
  });
});

describe('getUrlForCommentId', () => {
  it('returns empty string when url is empty', () => {
    const url = '';
    const expect = '';
    const actual = getArticleIdFromCommentUrl(url);
    assert.strictEqual(actual, expect);
  });

  it('returns valid article id when there are no query params', () => {
    const url = 'https://www.reddit.com/r/java/comments/74x9gv/title';
    const expect = 'comment:74x9gv';
    const actual = getArticleIdFromCommentUrl(url);
    assert.strictEqual(actual, expect);
  });

  it('returns valid article id when there are query params seperated from the title by a /', () => {
    const url = 'https://www.reddit.com/r/java/comments/75fs3p/title/?utm_content=comments&utm_medium=hot&utm_source=reddit&utm_name=java';
    const expect = 'comment:75fs3p';
    const actual = getArticleIdFromCommentUrl(url);
    assert.strictEqual(actual, expect);
  });

  it('returns valid article id when there are query params joined with the title', () => {
    const url = 'https://www.reddit.com/r/java/comments/75fs3p/title?utm_content=comments&utm_medium=hot&utm_source=reddit&utm_name=java';
    const expect = 'comment:75fs3p';
    const actual = getArticleIdFromCommentUrl(url);
    assert.strictEqual(actual, expect);
  });
});
