import { Message } from '@js/messages';
import * as logging from '@js/logging';
import { repository, StorageType, getError } from '@js/storage';
import * as isempty from 'lodash.isempty';
import {
  settingKeys,
  makeDefaultUnreadColorSetting,
} from '@js/settings';

// repository.deleteAll();
repository.getAll().then(data => logging.logWithPayload('ALL STORAGE', data));

/**
 * The first time the extension loads, default settings are saved, otherwise nothing
 * happens and existing settings are used.
 */
(async function initSettings() {
  try {
    const unreadCommentColor = await repository.get([settingKeys.unreadCommentColor]);
    if (isempty(unreadCommentColor)) {
      await repository.save(makeDefaultUnreadColorSetting());
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logging.log(`chrome.runtime.onMessage: ${message}`);
  switch (message) {
    case Message.GET_CURRENT_TAB_URL:
      getCurrentTabUrl(sendResponse);
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
