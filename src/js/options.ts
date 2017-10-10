require('styles/options');
import { save, clear, unreadCommentHexColour } from '@js/storage';
import { isEmpty, logWithPayload, log } from '@js/util';

const DEFAULT_UNREAD_COMMENT_COLOUR = '#B3ECB7';

// DOM elements
const unreadCommentColourPicker = document.querySelector('#unreadCommentColourPicker')! as HTMLInputElement;
const restoreDefaultButton = document.querySelector('#restoreDefaultsButton')! as HTMLInputElement;

/**
 * Handler for changing the unread comment color picker value.
 */
const onUnreadCommentColourChange = (event) => {
  save({ unreadCommentHexColour: event.target.value });
};

/**
 * Override existing keys with defaults.
 */
const onRestoreDefaults = () => {
  save({ unreadCommentHexColour: DEFAULT_UNREAD_COMMENT_COLOUR });
  unreadCommentColourPicker.value = DEFAULT_UNREAD_COMMENT_COLOUR;
};

// Register event listeners
unreadCommentColourPicker.addEventListener('change', onUnreadCommentColourChange);
restoreDefaultButton.addEventListener('click', onRestoreDefaults);

type GetResult = {
  unreadCommentHexColour?: string,
};

/**
 * Get all default settings from storage to initialise DOM elements, otherwise
 * set to defaults.
 */
chrome.storage.sync.get(unreadCommentHexColour, (setting: GetResult) => {
  logWithPayload('options.ts get setting', setting);

  if (setting.unreadCommentHexColour) {
    log('options.ts - loading unread color for storage');
    unreadCommentColourPicker.value = setting.unreadCommentHexColour;
  } else {
    log('options.ts - saving unread color for the first time');
    unreadCommentColourPicker.value = DEFAULT_UNREAD_COMMENT_COLOUR;
    save({ unreadCommentHexColour: DEFAULT_UNREAD_COMMENT_COLOUR });
  }
});

