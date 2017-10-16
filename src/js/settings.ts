import { StorageType } from '@js/storage';

export const APP_NAME = 'rereaddit';
export const APP_SLOGAN = 'Track and manage unread reddit comments';
export const GITHUB_URL = 'https://github.com/mjstewart/rereaddit';

/**
 * Delete storage after not revisiting an article for 3 days for example.
 */
export enum DeleteFrequency {
  DAY_1 = 'DAY_1',
  DAY_2 = 'DAY_2',
  DAY_3 = 'DAY_3', 
  DAY_4 = 'DAY_4',
  DAY_5 = 'DAY_5',
  WEEK_1 = 'WEEK_1',
  WEEK_2 = 'WEEK_2',
}

/**
 * Given a DeleteFrequency, return the number of days for that period.
 */
export const deleteFrequencyToDaysMap = new Map<DeleteFrequency, number>([
  [DeleteFrequency.DAY_1, 1],
  [DeleteFrequency.DAY_2, 2],
  [DeleteFrequency.DAY_3, 3],
  [DeleteFrequency.DAY_4, 4],
  [DeleteFrequency.DAY_5, 5],
  [DeleteFrequency.WEEK_1, 7],
  [DeleteFrequency.WEEK_2, 14],
]);

export const DEFAULT_UNREAD_COMMENT_COLOR = '#B3ECB7';
export const DEFAULT_DELETE_FREQUENCY = DeleteFrequency.DAY_2;

export interface SettingKeys {
  defaultUnreadCommentColor: string;
  unreadCommentColor: string;
  deleteFrequency: string;
}

/**
 * Lookup setting keys in storage
 */
export const settingKeys: SettingKeys = {
  defaultUnreadCommentColor: 'defaultUnreadCommentColor',
  unreadCommentColor: 'unreadCommentColor',
  deleteFrequency: 'deleteFrequency',
};

/**
 * Shape of setting to be stored.
 */
export type UnreadCommentColorSetting = {
  unreadCommentColor: {
    type: StorageType.SETTING,
    color: string,
  };
};

export const makeUnreadColorSetting = (color: string): UnreadCommentColorSetting => ({
  unreadCommentColor: {
    color,
    type: StorageType.SETTING,
  },
});

export const makeDefaultUnreadColorSetting = (): UnreadCommentColorSetting => ({
  unreadCommentColor: {
    type: StorageType.SETTING,
    color: DEFAULT_UNREAD_COMMENT_COLOR,
  },
});


export type DeleteFrequencySetting = {
  deleteFrequency: {
    type: StorageType.SETTING,
    frequency: DeleteFrequency,
  };
};

export const makeDeleteFrequencySetting = (frequency: DeleteFrequency): DeleteFrequencySetting => ({
  deleteFrequency: {
    frequency,
    type: StorageType.SETTING,
  },
});

export const makeDefaultDeleteFrequencySetting = (): DeleteFrequencySetting => ({
  deleteFrequency: {
    type: StorageType.SETTING,
    frequency: DEFAULT_DELETE_FREQUENCY,
  },
});
