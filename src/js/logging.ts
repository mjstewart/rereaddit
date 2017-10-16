export const APP_NAME = 'rereaddit';

export const logIfError = (message: string) => {
  if (chrome.runtime.lastError && process.env.LOGGING) {
    console.log(`${APP_NAME}: `,  message + ' -' + `reason = ${chrome.runtime.lastError}`);
  }
};

// Toggle on/off in webpack config.
declare const LOGGING: boolean;

export const logWithPayload = <T extends {}>(message: string, payload: T) => {
  if (LOGGING) {
    console.group(APP_NAME);
    console.log(message);
    console.log(payload);
    console.groupEnd();
  }
};

export const log = (message: string) => {
  if (LOGGING) {
    console.log(`${APP_NAME}: ${message}`);
  }
};
