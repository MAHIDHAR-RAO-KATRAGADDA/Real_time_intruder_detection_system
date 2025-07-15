import { IntruderEvent, DetectionSettings, NotificationSettings } from '../types';

const EVENTS_STORAGE_KEY = 'intruder-events';
const SETTINGS_STORAGE_KEY = 'detection-settings';
const NOTIFICATION_SETTINGS_KEY = 'notification-settings';

/**
 * Saves an intruder event to local storage
 */
export const saveIntruderEvent = (event: IntruderEvent): void => {
  const events = getIntruderEvents();
  events.unshift(event);
  
  // Limit storage to prevent excessive memory usage
  const limitedEvents = events.slice(0, 100);
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(limitedEvents));
};

/**
 * Gets all stored intruder events
 */
export const getIntruderEvents = (): IntruderEvent[] => {
  try {
    const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
    return storedEvents ? JSON.parse(storedEvents) : [];
  } catch (error) {
    console.error('Error retrieving events:', error);
    return [];
  }
};

/**
 * Clears all stored intruder events
 */
export const clearIntruderEvents = (): void => {
  localStorage.removeItem(EVENTS_STORAGE_KEY);
};

/**
 * Saves detection settings
 */
export const saveDetectionSettings = (settings: DetectionSettings): void => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

/**
 * Gets stored detection settings
 */
export const getDetectionSettings = (): DetectionSettings => {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return storedSettings 
      ? JSON.parse(storedSettings) 
      : { 
          sensitivity: 15, 
          isSystemArmed: true,
          whatsappEnabled: false,
          emailEnabled: false
        };
  } catch (error) {
    console.error('Error retrieving settings:', error);
    return { 
      sensitivity: 15, 
      isSystemArmed: true,
      whatsappEnabled: false,
      emailEnabled: false
    };
  }
};

/**
 * Saves notification settings
 */
export const saveNotificationSettings = (settings: NotificationSettings): void => {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
};

/**
 * Gets notification settings
 */
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const storedSettings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return storedSettings ? JSON.parse(storedSettings) : {};
  } catch (error) {
    console.error('Error retrieving notification settings:', error);
    return {};
  }
};