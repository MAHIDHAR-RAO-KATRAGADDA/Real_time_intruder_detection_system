import { NotificationSettings } from '../types';

export const sendWhatsAppNotification = async (
  settings: NotificationSettings,
  imageData: string
): Promise<void> => {
  if (!settings.whatsappToken || !settings.whatsappTo || !settings.whatsappPhoneId) {
    console.warn('WhatsApp credentials not configured');
    return;
  }

  try {
    const url = `https://graph.facebook.com/v17.0/${settings.whatsappPhoneId}/messages`;
    const headers = {
      'Authorization': `Bearer ${settings.whatsappToken}`,
      'Content-Type': 'application/json'
    };

    const data = {
      messaging_product: 'whatsapp',
      to: settings.whatsappTo,
      type: 'text',
      text: {
        body: `⚠️ ALERT: Motion detected at ${new Date().toLocaleString()}`
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`WhatsApp notification failed: ${await response.text()}`);
    }
    
    console.log('WhatsApp notification sent successfully');
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
  }
};

export const sendEmailNotification = async (
  settings: NotificationSettings,
  imageData: string
): Promise<void> => {
  if (!settings.smtpServer || !settings.smtpUsername || !settings.emailFrom || !settings.emailTo) {
    console.warn('Email credentials not configured');
    return;
  }

  try {
    // Check if Supabase environment variables are available
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured, using fallback email service');
      await sendEmailFallback(settings, imageData);
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: settings.emailTo,
        from: settings.emailFrom,
        subject: '⚠️ Intruder Alert - Motion Detected',
        text: `Motion was detected at ${new Date().toLocaleString()}`,
        imageData,
        smtpSettings: {
          server: settings.smtpServer,
          port: settings.smtpPort,
          username: settings.smtpUsername,
          password: settings.smtpPassword
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email notification failed: ${errorText}`);
    }
    
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Try fallback method
    await sendEmailFallback(settings, imageData);
  }
};

/**
 * Fallback email method using EmailJS or similar service
 */
const sendEmailFallback = async (
  settings: NotificationSettings,
  imageData: string
): Promise<void> => {
  try {
    // Create a mailto link as a fallback
    const subject = encodeURIComponent('⚠️ Intruder Alert - Motion Detected');
    const body = encodeURIComponent(`Motion was detected at ${new Date().toLocaleString()}\n\nImage data: ${imageData.substring(0, 100)}...`);
    const mailtoLink = `mailto:${settings.emailTo}?subject=${subject}&body=${body}`;
    
    // Open the default email client
    window.open(mailtoLink, '_blank');
    
    console.log('Email client opened for manual sending');
  } catch (error) {
    console.error('Error with email fallback:', error);
  }
};