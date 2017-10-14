import { getError } from '@js/storage';
import * as logging from '@js/logging';

export enum MessageType {
  GET_CURRENT_TAB_URL = 'GET_CURRENT_TAB_URL',
  OPEN_TAB = 'OPEN_TAB',
}

export type Message = 
 | GetCurrentTabUrlMessage
 | OpenTabMessage;

export type GetCurrentTabUrlMessage = {
  type: MessageType.GET_CURRENT_TAB_URL;
};

export type OpenTabMessage = {
  type: MessageType.OPEN_TAB;
  url: string,
};

/**
 * Converts chrome.runtime.sendMessage into a Promise.
 * 
 * @param message The type of Message
 * @param T The type produced from calling sendMessage which gets passed
 * into the resolved promise for the caller to receive.
 * @param args Any args to supply. For example when sending Message.OPEN_TAB the new url needs to be 
 * supplied.
 */
export const sendMessage = <T extends {}>(message: Message): Promise<T> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (value: T) => {
      const error = getError();
      if (error) {
        reject(error);
        return;
      }
      resolve(value);
    });
  });
};
