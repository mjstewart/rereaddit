import { StorageType } from '@js/storage';

export const APP_NAME = 'rereaddit';
export const APP_SLOGAN = 'Track and manage unread reddit comments';

export const DEFAULT_UNREAD_COMMENT_COLOUR = '#B3ECB7';

// Setting keys used to access storage
export const unreadCommentColor = 'unreadCommentColor';

export interface SettingKeys {
  defaultUnreadCommentColor: string;
  unreadCommentColor: string;
}

/**
 * Lookup setting keys in storage
 */
export const settingKeys: SettingKeys = {
  defaultUnreadCommentColor: 'defaultUnreadCommentColor',
  unreadCommentColor: 'unreadCommentColor',
};

/**
 * Shape of setting to be stored.
 */
export type UnreadCommentColor = {
  unreadCommentColor: {
    type: StorageType.SETTING,
    color: string,
  };
};

export const makeUnreadColorSetting = (color: string): UnreadCommentColor => ({
  unreadCommentColor: {
    color,
    type: StorageType.SETTING,
  },
});

export const makeDefaultUnreadColorSetting = (): UnreadCommentColor => ({
  unreadCommentColor: {
    type: StorageType.SETTING,
    color: DEFAULT_UNREAD_COMMENT_COLOUR,
  },
});
