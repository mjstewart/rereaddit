import { GET_CURRENT_TAB_URL } from '@js/messages';
import { log, logWithPayload } from '@js/util';

chrome.storage.sync.get(null, (store) => {
  logWithPayload('background.js get full store', store);
});

/**
 * Content scripts can send messages to the background task which has special priviledges.
 * The background task responds to the caller by sending the payload back using the
 * sendResponse callback.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log(`chrome.runtime.onMessage: ${message}`);
  switch (message) {
    case GET_CURRENT_TAB_URL:
      logWithPayload('background.ts onMessage: ', sender);
      sendResponse(sender.url);
    default:
  }
});

/**
 * When user is on https://www.reddit.com, the page action icon is enabled.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.indexOf('https://www.reddit.com') === 0) {
    log(`background.ts chrome.pageAction.show: ${tab.url!}`);
    chrome.pageAction.show(tabId);
  } else {
    log(`background.ts chrome.pageAction.hide: ${tab.url!}`);
    chrome.pageAction.hide(tabId);
  }
});