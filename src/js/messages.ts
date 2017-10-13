import { getError } from '@js/storage';
import * as logging from '@js/logging';

export enum Message {
  GET_CURRENT_TAB_URL = 'GET_CURRENT_TAB_URL',
}

/**
 * Converts chrome.runtime.sendMessage into a Promise.
 * 
 * @param message The type of Message
 * @param T The type produced from calling sendMessage which gets passed
 * into the resolved promise for the caller to receive.
 */
export const sendMessage = <T extends {}>(message: Message): Promise<T> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (value: T) => {
      const error = getError();
      if (error) {
        reject(error);
        return;
      }
      logging.logWithPayload('sendMessage returning payload', value);
      resolve(value);
    });
  });
};
