import { Message, sendMessage } from '@js/messages';
import * as logging from '@js/logging';
import * as isempty from 'lodash.isempty';
import * as has from 'lodash.has';
import { unreadCommentColor, UnreadCommentColor } from '@js/settings';
import {
  getArticleIdFromCommentUrl,
  repository,
  getError,
  StorageType,
} from '@js/storage';

export type Comment = {
  articleId: string,
  type: StorageType.COMMENT,
  lastViewedTime: string,
  title: string,
  tagline: string,
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
const createCommentEntry = (meta: Meta): CommentEntry => {
  return {
    [meta.articleId]: {
      type: StorageType.COMMENT,
      lastViewedTime: new Date().toString(),
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
};

// /**
//  * Extract meta data from the article such as the url, title etc.
//  */
// const articleMetaExtractor = (): Promise<Meta> => {
//   return new Promise((resolve, reject) => {
//     chrome.runtime.sendMessage(Message.GET_CURRENT_TAB_URL, (currentUrl: string) => {
//       const error = getError();

//       if (error) {
//         reject(error);
//         return;
//       }

//       const articleId = getArticleIdFromCommentUrl(currentUrl);

//       const titleElement = document.querySelector('.top-matter .title a');
//       const title = titleElement ? titleElement.innerHTML : 'Missing title';

//       // submitted 11 hours ago by user
//       const taglineElement: HTMLElement | null = document.querySelector('.top-matter .tagline') as HTMLElement;
//       const tagline = taglineElement ? taglineElement.innerText : '';

//       resolve({ articleId, title, tagline });
//     });
//   });
// };

/**
 * Extract meta data from the article such as the url, title etc.
 */
const articleMetaExtractor = async (): Promise<Meta> => {
  try {
    const url = await sendMessage<string>(Message.GET_CURRENT_TAB_URL);
    const articleId = getArticleIdFromCommentUrl(url);

    const titleElement = document.querySelector('.top-matter .title a');
    const title = titleElement ? titleElement.innerHTML : 'Missing title';

    // submitted 11 hours ago by user
    const taglineElement: HTMLElement | null = document.querySelector('.top-matter .tagline') as HTMLElement;
    const tagline = taglineElement ? taglineElement.innerText : '';

    return Promise.resolve({ articleId, title, tagline });
  } catch (e) {
    return Promise.reject(`Unable to get URL: ${e}`);
  }
};


window.addEventListener('load', async () => {
  try {
    const meta = await articleMetaExtractor();

    logging.logWithPayload('comments.ts meta data', meta);

    // See createCommentEntry comment for the structure, the key is the article id.
    type QueryResult = CommentEntry & UnreadCommentColor;

    const queryResult = await repository.get<QueryResult>([meta.articleId, unreadCommentColor]);
    logging.logWithPayload('article get partial query', queryResult);
    if (!has(queryResult, meta.articleId)) {
      // First time viewing article
      const entry = createCommentEntry(meta);
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
    const lastViewedTime = new Date(existingArticle.lastViewedTime);

    logging.logWithPayload('existingArticle', existingArticle);
    const comments = document.getElementsByClassName('comment');

    for (let i = 0; i < comments.length; i = i + 1) {
      const comment = comments[i];
      const commentTime = new Date(comment.querySelector('time')!.getAttribute('datetime')!);

      // if root comment is newer, all descendents will be newer too.
      if (commentTime > lastViewedTime) {
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

    // Update the last visit time to track new comments for future visits
    repository.save(createCommentEntry(meta));
  } catch (e) {
    logging.log(`Could not extract meta data for article: ${e}`);
  }
});
