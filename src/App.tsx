import React, { useState, useEffect } from 'react';
import { Shield, Menu, X } from 'lucide-react';
import CameraFeed from './components/CameraFeed';
import HistoryLog from './components/HistoryLog';
import ControlPanel from './components/ControlPanel';
import { IntruderEvent, DetectionSettings } from './types';
import { getIntruderEvents, clearIntruderEvents, getDetectionSettings, saveDetectionSettings } from './utils/storageUtils';

function App() {
  const [events, setEvents] = useState<IntruderEvent[]>([]);
  const [settings, setSettings] = useState<DetectionSettings>(getDetectionSettings());
  const [showSidebar, setShowSidebar] = useState(false);
  const [latestEvent, setLatestEvent] = useState<IntruderEvent | null>(null);

  // Load events from storage
  useEffect(() => {
    setEvents(getIntruderEvents());
  }, []);

  // Save settings when changed
  useEffect(() => {
    saveDetectionSettings(settings);
  }, [settings]);

  // Handle new intruder detection
  const handleIntruderDetection = (event: IntruderEvent) => {
    setEvents(prevEvents => [event, ...prevEvents]);
    setLatestEvent(event);
    
    // Auto-hide latest event after 10 seconds
    setTimeout(() => {
      setLatestEvent(null);
    }, 10000);
  };

  // Clear all history
  const handleClearHistory = () => {
    clearIntruderEvents();
    setEvents([]);
  };

  // Update settings
  const handleSettingsChange = (newSettings: DetectionSettings) => {
    setSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold">SecureView</h1>
          </div>
          
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            {showSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Camera Feed Column */}
          <div className="w-full md:w-2/3">
            <div className="mb-6">
              <CameraFeed 
                sensitivity={settings.sensitivity}
                isSystemArmed={settings.isSystemArmed}
                onDetection={handleIntruderDetection}
              />
            </div>

            {/* Latest Event Alert (conditionally rendered) */}
            {latestEvent && (
              <div className="mb-6 bg-red-500/10 border border-red-500 rounded-lg p-4 animate-pulse">
                <div className="flex items-start">
                  <div className="bg-red-500 rounded-full p-2 mr-3">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-red-400 font-semibold">Intruder Detected!</h3>
                    <p className="text-gray-300 text-sm">
                      Motion detected at {new Date(latestEvent.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* History Log */}
            <HistoryLog events={events} onClearHistory={handleClearHistory} />
          </div>

          {/* Control Panel Column (responsive) */}
          <div className={`md:w-1/3 ${showSidebar ? 'block' : 'hidden md:block'}`}>
            <ControlPanel 
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>SecureView Intruder Detection System</p>
          <p className="text-xs mt-1">All detection data is stored locally on your device</p>
        </div>
      </footer>
    </div>
  );
}

export default App;