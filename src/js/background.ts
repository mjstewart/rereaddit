import { Message, MessageType } from '@js/messages';
import * as logging from '@js/logging';
import { repository, StorageType, getError, getArticleIdsExceedingDeleteFrequency } from '@js/storage';
import * as isempty from 'lodash.isempty';
import * as moment from 'moment';
import { CommentEntry } from '@js/content-scripts/comments';
import {
  settingKeys,
  makeDefaultUnreadColorSetting,
  makeDefaultDeleteFrequencySetting,
  DeleteFrequencySetting,
  DeleteFrequency,
  UnreadCommentColorSetting,
  deleteFrequencyToDaysMap,
  AutoFollowSetting,
  makeDefaultAutoFollowSetting,
} from '@js/settings';

/**
 * The first time the extension loads, default settings are saved, otherwise nothing
 * happens and existing settings are used.
 */
(async function initSettings() {
  try {
    type QueryResult = UnreadCommentColorSetting & DeleteFrequencySetting & AutoFollowSetting;
    const result = await repository.get<QueryResult>(
      [settingKeys.unreadCommentColor, settingKeys.deleteFrequency, settingKeys.autoFollow],
    );
    const comments: CommentEntry = await repository.getAllBy((key, type) => type === StorageType.COMMENT);

    if (isempty(result.unreadCommentColor)) {
      await repository.save(makeDefaultUnreadColorSetting());
    }

    if (isempty(result.autoFollow)) {
      await repository.save(makeDefaultAutoFollowSetting());
    }

    if (isempty(result.deleteFrequency)) {
      await repository.save(makeDefaultDeleteFrequencySetting());
    } else {
      // Delete articles that exceed delete frequency visit time to prevent storage overload.
      const keysToDelete = getArticleIdsExceedingDeleteFrequency(
        comments,
        result.deleteFrequency.frequency,
        moment(),
      );
      await repository.deleteKeys(keysToDelete);
    }
  } catch (e) {
    logging.log(e);
  }
})();


/**
 * Content scripts can send messages to the background task which has special priviledges.
 * The background task responds to the caller by sending the payload back using the
 * sendResponse callback.
 * 
 * The callback must return true if you want to call another async function, otherwise
 * sendResponse channel is closed. 
 * https://developer.chrome.com/extensions/runtime#event-onMessage
 */
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  switch (message.type) {
    case MessageType.GET_CURRENT_TAB_URL:
      getCurrentTabUrl(sendResponse);
      break;
    case MessageType.OPEN_TAB:
      openTab(message.url, sendResponse);
      break;
    default:
  }
  return true;
});

const getCurrentTabUrl = (sendResponse) => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      sendResponse('');
    } else {
      sendResponse(tabs[0].url);
    }
  });
};

const openTab = (url: string, sendResponse) => {
  chrome.tabs.create({ url }, (tab) => {
    sendResponse(tab);
  });
};

/**
 * When user is on https://www.reddit.com, the page action icon is enabled.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.indexOf('https://www.reddit.com') === 0) {
    chrome.pageAction.show(tabId);
  } else {
    chrome.pageAction.hide(tabId);
  }
});
