import { MessageType, sendMessage } from '@js/messages';
import * as logging from '@js/logging';
import * as isempty from 'lodash.isempty';
import * as has from 'lodash.has';
import { UnreadCommentColorSetting, settingKeys } from '@js/settings';
import * as moment from 'moment';
import {
  repository,
  getError,
  StorageType,
  getArticleIdFromCommentUrl,
} from '@js/storage';

export type Comment = {
  // https://www.reddit.com/r/java/comments/763ibv/title. The id is 763ibv
  articleId: string,

  type: StorageType.COMMENT,

  // The last time user viewed the article
  lastViewedTime: string,

  // Title of the article
  title: string,

  // submitted an hour ago by user
  tagline: string,

  // r/java but there is no r/ prepended
  subreddit: string,

  // Total unread comments in the article since lastViewedTime.
  unread: number,
};

export type CommentEntry = {
  [key: string]: Comment;
};

/**
 * Creates the value to be inserted into storage.
 * 
   "75odv7": {
    "articleId": "75odv7",
    "lastViewedTime": "Thu Oct 12 2017 17:38:41 GMT+1030 (Cen. Australia Daylight Time)",
    "tagline": "submitted 19 hours ago by user",
    "title": "some title",
    "type": "COMMENT"
  }
 * 
 * @param meta
 */
const createArticleEntry = (meta: Meta): CommentEntry => {
  return {
    [meta.articleId]: {
      type: StorageType.COMMENT,
      lastViewedTime: new Date().toString(),
      unread: 0,
      ...meta,
    },
  };
};

const removeStyling = (child: HTMLElement) => (event: MouseEvent) => {
  child.style.backgroundColor = null;
  child.style.cursor = null;
  child.title = '';
  child.onclick = () => false;

  // remove the last class
  // const classTokens = child.className.split(/\s+/).filter(x => x !== '');
  // child.className = classTokens.slice(0, classTokens.length - 1).join(' ');
};

type GetResult = {
  lastViewedTime: string,
  unreadCommentHexColor: string,
};

type Meta = {
  articleId: string,
  title: string,
  tagline: string,
  subreddit: string,
};

/**
 * Extract meta data from the article such as the url, title etc.
 */
const articleMetaExtractor = async (): Promise<Meta> => {
  try {
    const url = await sendMessage<string>({ type: MessageType.GET_CURRENT_TAB_URL });
    const articleId = getArticleIdFromCommentUrl(url);

    const titleElement = document.querySelector('.top-matter .title a');
    const title = titleElement ? titleElement.innerHTML : '';

    const siteTableElement = document.querySelector('#siteTable .thing');
    const subredditAttribute = siteTableElement && siteTableElement.getAttribute('data-subreddit');
    const subreddit = subredditAttribute ? subredditAttribute : '';

    const taglineElement: HTMLElement | null = document.querySelector('.top-matter .tagline') as HTMLElement;
    const tagline = taglineElement ? taglineElement.innerText : '';

    return Promise.resolve({ articleId, title, tagline, subreddit });
  } catch (e) {
    return Promise.reject(`Unable to get URL: ${e}`);
  }
};


window.addEventListener('load', async () => {
  try {
    const meta = await articleMetaExtractor();

    logging.logWithPayload('comments.ts meta data', meta);

    // See createCommentEntry comment for the structure, the key is the article id.
    type QueryResult = CommentEntry & UnreadCommentColorSetting;

    const queryResult = await repository.get<QueryResult>([meta.articleId, settingKeys.unreadCommentColor]);
    logging.logWithPayload('article get partial query', queryResult);
    if (!has(queryResult, meta.articleId)) {
      // First time viewing article
      const entry = createArticleEntry(meta);
      logging.logWithPayload(`First time viewing ${meta.title}, saving new comment entry to storage`, entry);
      try {
        await repository.save(entry);
      } catch (e) {
        logging.log(e);
      }
      return;
    }

    // Get the existing article and highlight any new comments which occur after the last viewed time.
    const existingArticle = queryResult[meta.articleId];
    const lastViewedTime = moment(new Date(existingArticle.lastViewedTime));

    logging.logWithPayload('existingArticle', existingArticle);
    const comments = document.getElementsByClassName('comment');

    for (let i = 0; i < comments.length; i = i + 1) {
      const comment = comments[i];
      const commentTime = moment(new Date(comment.querySelector('time')!.getAttribute('datetime')!));

      // if root comment is newer, all descendents will be newer too.
      if (commentTime.isAfter(lastViewedTime)) {
        comment.querySelectorAll('.usertext-body').forEach((child: HTMLElement) => {
          child.style.backgroundColor = queryResult.unreadCommentColor.color;
          child.style.cursor = 'pointer';
          child.title = 'Click to unread comment';
          child.onclick = removeStyling(child);
        });
      }

      // comment.querySelectorAll('.usertext-body').forEach((child: HTMLElement) => {
      //   child.style.backgroundColor = queryResult.unreadCommentColor.color;
      //   child.style.cursor = 'pointer';
      //   child.title = 'Click to unread comment';
      //   child.onclick = removeStyling(child);
      // });
    }

    // Update the last visit time and any other meta data such as original post time
    // as reddit servers autoupdate the time. This also sets the article as completely read ready 
    // for the next visit to track new unread comments.
    repository.save(createArticleEntry(meta));
  } catch (e) {
    logging.log(`Could not extract meta data for article: ${e}`);
  }
});
