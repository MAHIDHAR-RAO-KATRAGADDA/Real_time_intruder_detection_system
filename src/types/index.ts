export interface IntruderEvent {
  id: string;
  timestamp: number;
  imageData: string;
}

export interface DetectionSettings {
  sensitivity: number;
  isSystemArmed: boolean;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
}

export interface NotificationSettings {
  whatsappToken?: string;
  whatsappPhoneId?: string;
  whatsappTo?: string;
  smtpServer?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  emailFrom?: string;
  emailTo?: string;
}