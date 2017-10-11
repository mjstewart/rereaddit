import { getArticleIdFromCommentUrl, save, unreadCommentHexColour } from '@js/storage';
import { GET_CURRENT_TAB_URL } from '@js/messages';
import { isEmpty, log, logWithPayload } from '@js/util';

type CommentEntry = {
  urlId: string,
  lastViewedTime: string;
};

/**
 * Creates a key, value pair to be inserted into storage.
 * 
 * @param urlId The url id of the subreddit comment thread being viewed.
 */
const createLastViewedEntry = (urlId: string): any => {
  return {
    [urlId]: new Date().toString(),
  };
};

const removeBackgroundStyle = (child: HTMLElement) => (event: MouseEvent) => child.style.backgroundColor = null;

type GetResult = {
  lastViewedTime: string,
  unreadCommentHexColor: string,
};

window.addEventListener('load', () => {
  chrome.runtime.sendMessage(GET_CURRENT_TAB_URL, (currentUrl: string) => {
    const urlId = getArticleIdFromCommentUrl(currentUrl);
  
    log(`comments.ts urlId ${urlId}`);
  
    // need to store the commentId as the actual key, not urlId as urlId gets overridden.
    chrome.storage.sync.get({ urlId, unreadCommentHexColour }, (result: GetResult) => {
      if (!result) return;
  
      logWithPayload('comments.ts get result', result);
  
      if (isEmpty(result)) {
        // First time viewing thread, save timestamp so future posts can be identified.
        save(createLastViewedEntry(urlId));
        return;
      }
  
      const lastViewedTime = new Date(result.lastViewedTime);
      const comments = document.getElementsByClassName('comment');
  
      for (let i = 0; i < comments.length; i = i + 1) {
        const comment = comments[i];
        const commentTime = new Date(comment.querySelector('time')!.getAttribute('datetime')!);
  
        // if root comment is newer, all descendents will be newer too.
        // if (commentTime > lastViewedTime) {
        //   comment.querySelectorAll('.usertext-body').forEach((child: HTMLElement) => {
        //     child.style.backgroundColor = result.unreadColorHexCode;
        //     child.onclick = removeBackgroundStyle(child);
        //   });
        // }
        comment.querySelectorAll('.usertext-body').forEach((child: HTMLElement) => {
          child.style.backgroundColor = result.unreadCommentHexColor;
          child.onclick = removeBackgroundStyle(child);
        });
      }
  
      // Update timestamp as its assumed user has now read all new posts.
      save(createLastViewedEntry(urlId));
    });
  });  
});
