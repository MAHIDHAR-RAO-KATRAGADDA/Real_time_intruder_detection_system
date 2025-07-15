import { IntruderEvent } from '../types';
import { getNotificationSettings } from './storageUtils';
import { sendWhatsAppNotification, sendEmailNotification } from './notificationUtils';

// Previous frame data for comparison
let previousFrame: ImageData | null = null;
let detectionCooldown = false;

/**
 * Compares two frames to detect significant motion
 */
export const detectMotion = (
  currentFrame: ImageData,
  sensitivity: number
): boolean => {
  if (!previousFrame) {
    previousFrame = currentFrame;
    return false;
  }

  const currentData = currentFrame.data;
  const previousData = previousFrame.data;
  
  let differentPixels = 0;
  const pixelThreshold = 20; // Reduced threshold for more sensitive detection
  
  // Reduced stride for more frequent pixel sampling
  const stride = 4;
  const totalPixelsChecked = (currentData.length / 4) / stride;
  
  for (let i = 0; i < currentData.length; i += 4 * stride) {
    const rDiff = Math.abs(currentData[i] - previousData[i]);
    const gDiff = Math.abs(currentData[i + 1] - previousData[i + 1]);
    const bDiff = Math.abs(currentData[i + 2] - previousData[i + 2]);
    
    if (rDiff > pixelThreshold || gDiff > pixelThreshold || bDiff > pixelThreshold) {
      differentPixels++;
    }
  }
  
  // Calculate percentage of changed pixels
  const percentageDifferent = (differentPixels / totalPixelsChecked) * 100;
  
  // Update previous frame for next comparison
  previousFrame = currentFrame;
  
  // Return true if the percentage of different pixels exceeds the sensitivity threshold
  return percentageDifferent > (sensitivity / 2); // Adjusted threshold scaling
};

/**
 * Creates an intruder event from canvas data
 */
export const createIntruderEvent = async (canvas: HTMLCanvasElement): Promise<IntruderEvent> => {
  const id = crypto.randomUUID();
  const timestamp = Date.now();
  const imageData = canvas.toDataURL('image/jpeg', 0.7);
  
  return {
    id,
    timestamp,
    imageData
  };
};

/**
 * Triggers detection with cooldown to prevent multiple rapid detections
 */
export const triggerDetectionWithCooldown = async (
  canvas: HTMLCanvasElement,
  onDetection: (event: IntruderEvent) => void,
  cooldownMs: number = 3000 // Reduced cooldown for more frequent detections
): Promise<void> => {
  if (detectionCooldown) return;
  
  detectionCooldown = true;
  const event = await createIntruderEvent(canvas);
  onDetection(event);
  playAlertSound();
  
  // Send notifications
  await sendNotifications(event.imageData);
  
  setTimeout(() => {
    detectionCooldown = false;
  }, cooldownMs);
};

/**
 * Sends notifications based on user settings
 */
const sendNotifications = async (imageData: string): Promise<void> => {
  try {
    const notificationSettings = getNotificationSettings();
    
    // Send WhatsApp notification
    if (notificationSettings.whatsappToken && notificationSettings.whatsappTo) {
      await sendWhatsAppNotification(notificationSettings, imageData);
    }
    
    // Send email notification
    if (notificationSettings.emailFrom && notificationSettings.emailTo) {
      await sendEmailNotification(notificationSettings, imageData);
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

// Create and cache the audio element for better performance
const alertAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
alertAudio.volume = 0.7;

/**
 * Plays an alert sound with error handling
 */
export const playAlertSound = async (): Promise<void> => {
  try {
    // Reset the audio to the beginning if it's already playing
    alertAudio.currentTime = 0;
    await alertAudio.play();
  } catch (err) {
    console.error('Error playing alert sound:', err);
  }
};