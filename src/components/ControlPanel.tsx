import React, { useState, useEffect } from 'react';
import { DetectionSettings, NotificationSettings } from '../types';
import { Bell, Settings } from 'lucide-react';
import { saveNotificationSettings, getNotificationSettings } from '../utils/storageUtils';

interface ControlPanelProps {
  settings: DetectionSettings;
  onSettingsChange: (settings: DetectionSettings) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, onSettingsChange }) => {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    whatsappToken: '',
    whatsappPhoneId: '',
    whatsappTo: '',
    smtpServer: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    emailFrom: '',
    emailTo: ''
  });

  // Load notification settings on mount
  useEffect(() => {
    const savedSettings = getNotificationSettings();
    setNotificationSettings(savedSettings);
  }, []);

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onSettingsChange({ ...settings, sensitivity: value });
  };

  const toggleSystemArmed = () => {
    onSettingsChange({ ...settings, isSystemArmed: !settings.isSystemArmed });
  };

  const toggleWhatsApp = () => {
    onSettingsChange({ ...settings, whatsappEnabled: !settings.whatsappEnabled });
  };

  const toggleEmail = () => {
    onSettingsChange({ ...settings, emailEnabled: !settings.emailEnabled });
  };

  const handleNotificationSettingsSave = () => {
    saveNotificationSettings(notificationSettings);
    setShowNotificationSettings(false);
    alert('Notification settings saved successfully!');
  };

  const handleNotificationSettingChange = (field: keyof NotificationSettings, value: string | number) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-white mb-4">Control Panel</h2>
      
      <div className="space-y-6">
        {/* System arm/disarm toggle */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">System Status</span>
          <button 
            onClick={toggleSystemArmed}
            className={`px-4 py-2 rounded-full flex items-center transition-colors ${
              settings.isSystemArmed 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            <span className={`w-3 h-3 rounded-full mr-2 ${
              settings.isSystemArmed 
                ? 'bg-white animate-pulse' 
                : 'bg-white'
            }`}></span>
            <span className="text-white text-sm font-medium">
              {settings.isSystemArmed ? 'Armed' : 'Disarmed'}
            </span>
          </button>
        </div>
        
        {/* Motion sensitivity slider */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-300">Motion Sensitivity</span>
            <span className="text-gray-400 text-sm">{settings.sensitivity}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={settings.sensitivity}
            onChange={handleSensitivityChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Notification settings */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-300 font-medium flex items-center">
              <Bell size={16} className="mr-2" />
              Notifications
            </h3>
            <button
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Settings size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.whatsappEnabled}
                onChange={toggleWhatsApp}
                className="mr-2"
              />
              <span className="text-gray-300 text-sm">WhatsApp Notifications</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={toggleEmail}
                className="mr-2"
              />
              <span className="text-gray-300 text-sm">Email Notifications</span>
            </label>
          </div>

          {/* Notification Settings Modal */}
          {showNotificationSettings && (
            <div className="mt-4 border-t border-gray-600 pt-4">
              <h4 className="text-gray-300 font-medium mb-3">Notification Settings</h4>
              
              {/* WhatsApp Settings */}
              <div className="space-y-2 mb-4">
                <h5 className="text-gray-400 text-sm font-medium">WhatsApp Settings</h5>
                <input
                  type="text"
                  placeholder="WhatsApp Token"
                  value={notificationSettings.whatsappToken || ''}
                  onChange={(e) => handleNotificationSettingChange('whatsappToken', e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="WhatsApp Phone ID"
                  value={notificationSettings.whatsappPhoneId || ''}
                  onChange={(e) => handleNotificationSettingChange('whatsappPhoneId', e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="WhatsApp To Number"
                  value={notificationSettings.whatsappTo || ''}
                  onChange={(e) => handleNotificationSettingChange('whatsappTo', e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm"
                />
              </div>

              {/* Email Settings */}
              <div className="space-y-2">
                <h5 className="text-gray-400 text-sm font-medium">Email Settings</h5>
                <input
                  type="text"
                  placeholder="SMTP Server (e.g., smtp.gmail.com)"
                  value={notificationSettings.smtpServer || ''}
                  onChange={(e) => handleNotificationSettingChange('smtpServer', e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="SMTP Port (587 for Gmail)"
                  value={notificationSettings.smtpPort || 587}
                  onChange={(e) => handleNotificationSettingChange('smtpPort', parseInt(e.target.value))}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="SMTP Username (your email)"
                  value={notificationSettings.smtpUsername || ''}
                  onChange={(e) => handleNotificationSettingChange('smtpUsername', e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm"
                />
                <input
                  type="password"
                  placeholder="SMTP Password (app password for Gmail)"
                  value={notificationSettings.smtpPassword || ''}
                  onChange={(e) => handleNotificationSettingChange('smtpPassword', e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm"
                />
                <input
                  type="email"
                  placeholder="From Email"
                  value={notificationSettings.emailFrom || ''}
                  onChange={(e) => handleNotificationSettingChange('emailFrom', e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm"
                />
                <input
                  type="email"
                  placeholder="To Email"
                  value={notificationSettings.emailTo || ''}
                  onChange={(e) => handleNotificationSettingChange('emailTo', e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm"
                />
              </div>

              <button
                onClick={handleNotificationSettingsSave}
                className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-colors"
              >
                Save Settings
              </button>
            </div>
          )}
        </div>
        
        {/* System status info */}
        <div className="bg-gray-700 rounded-lg p-3 text-sm">
          <h3 className="text-gray-300 font-medium mb-2">System Information</h3>
          <ul className="space-y-1 text-xs text-gray-400">
            <li className="flex justify-between">
              <span>Status:</span>
              <span className={settings.isSystemArmed ? 'text-green-400' : 'text-red-400'}>
                {settings.isSystemArmed ? 'Monitoring' : 'Standby'}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Detection Level:</span>
              <span>
                {settings.sensitivity < 10 ? 'Low' : settings.sensitivity < 20 ? 'Medium' : 'High'}
              </span>
            </li>
            <li className="flex justify-between">
              <span>WhatsApp:</span>
              <span className={settings.whatsappEnabled ? 'text-green-400' : 'text-gray-500'}>
                {settings.whatsappEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Email:</span>
              <span className={settings.emailEnabled ? 'text-green-400' : 'text-gray-500'}>
                {settings.emailEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;