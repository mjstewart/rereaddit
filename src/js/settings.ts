export const DEFAULT_UNREAD_COMMENT_COLOUR = '#B3ECB7';

/**
 * Types of data stored to allow querying / filtering.
 */
export enum StorageType {
  SETTING = 'SETTING',
  COMMENT = 'COMMENT',
}

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
