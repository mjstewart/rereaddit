import * as chrome from 'sinon-chrome';
import { assert, expect } from 'chai';
import * as mocha from 'mocha';
import { DeleteFrequency } from '@js/settings';
import * as moment from 'moment';
import { CommentEntry } from '@js/content-scripts/comments';
import { 
  repository, 
  getArticleIdFromCommentUrl, 
  StorageType,
  getArticleIdsExceedingDeleteFrequency,
} from '@js/storage';

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


const makeDateString = (formattedValue) => {
  return moment(formattedValue, 'DD-MM-YYYY HH:mm:ss').toString();
};

describe('storage.ts getArticleIdsExceedingDeleteFrequency', () => {
  it('finds no articles to delete when they have all been visited before the delete frequency', () => {
    const comments: CommentEntry = {
      a: {
        articleId: 'a',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('10-01-2017, 09:00:00'),
        title: 'title a',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
      // 0 days 23:59:59 so its not deleted as its within bounds by 1 second
      b: {
        articleId: 'b',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('09-01-2017, 10:00:01'),
        title: 'title b',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
    };

    const now = moment(new Date(makeDateString('10-01-2017 10:00:00')));

    const keysToDelete = getArticleIdsExceedingDeleteFrequency(
      comments,
      DeleteFrequency.DAY_1,
      now,
    );

    expect(keysToDelete).to.be.empty;
  });

  it('delete article when it has not been viewed within the delete frequency', () => {
    const comments: CommentEntry = {
      a: {
        articleId: 'a',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('10-01-2017, 09:00:00'),
        title: 'title a',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
      // 4 days 23:59:59 so its not deleted as its within bounds by 1 second.
      b: {
        articleId: 'b',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('05-01-2017, 10:00:01'),
        title: 'title b',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
      // exactly 5 days - delete
      c: {
        articleId: 'c',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('05-01-2017, 10:00:00'),
        title: 'title c',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
      // 5 days 1 second - delete
      d: {
        articleId: 'd',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('05-01-2017, 09:59:59'),
        title: 'title d',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
    };

    const now = moment(new Date(makeDateString('10-01-2017 10:00:00')));

    const keysToDelete = getArticleIdsExceedingDeleteFrequency(
      comments,
      DeleteFrequency.DAY_5,
      now,
    );

    expect(keysToDelete).to.deep.equal((['c', 'd']));
  });

  it('deletes all articles that have not been viewed before delete threshold', () => {
    const comments: CommentEntry = {
      // Viewed 2 days 23:59:59 ago. Safe by 1 second
      a: {
        articleId: 'a',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('17-01-2017, 10:00:01'),
        title: 'title a',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
      // Exactly 3 days. delete
      b: {
        articleId: 'b',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('17-01-2017, 10:00:00'),
        title: 'title b',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
      // 3 days 1 sec ago, delete
      c: {
        articleId: 'c',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('17-01-2017, 09:59:59'),
        title: 'title c',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
      // exactly 4 days ago - delete
      d: {
        articleId: 'd',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('16-01-2017, 10:00:00'),
        title: 'title d',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
      // exactly 5 days - delete
      e: {
        articleId: 'e',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('15-01-2017, 10:00:00'),
        title: 'title e',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
      // exactly 1 week - delete
      f: {
        articleId: 'f',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('13-01-2017, 10:00:00'),
        title: 'title f',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
      // exactly 2 weeks - delete
      g: {
        articleId: 'g',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('06-01-2017, 10:00:00'),
        title: 'title g',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
      // viewed 1 second ago - keep.
      h: {
        articleId: 'h',
        type: StorageType.COMMENT,
        lastViewedTime: makeDateString('20-01-2017, 09:59:59'),
        title: 'title h',
        tagline: 'submitted 4 days ago by user',
        subreddit: 'r/test',
        unread: 0,
      },
    };

    const now = moment(new Date(makeDateString('20-01-2017 10:00:00')));

    const keysToDelete = getArticleIdsExceedingDeleteFrequency(
      comments,
      DeleteFrequency.DAY_3,
      now,
    );

    expect(keysToDelete).to.deep.equal(['b', 'c', 'd', 'e', 'f', 'g']);
  });
});
