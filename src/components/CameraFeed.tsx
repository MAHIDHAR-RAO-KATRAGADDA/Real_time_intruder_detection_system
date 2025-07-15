import React, { useRef, useEffect, useState } from 'react';
import { detectMotion, triggerDetectionWithCooldown, playAlertSound } from '../utils/detectionUtils';
import { saveIntruderEvent } from '../utils/storageUtils';
import { IntruderEvent } from '../types';
import { Camera, RefreshCw } from 'lucide-react';

interface CameraFeedProps {
  sensitivity: number;
  isSystemArmed: boolean;
  onDetection: (event: IntruderEvent) => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ 
  sensitivity, 
  isSystemArmed,
  onDetection 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeDetection, setActiveDetection] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const mountedRef = useRef(true);

  // Get browser-specific permission instructions
  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) {
      return {
        browser: 'Chrome',
        url: 'https://support.google.com/chrome/answer/2693767?hl=en&co=GENIE.Platform%3DDesktop'
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        url: 'https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions'
      };
    } else if (userAgent.includes('safari')) {
      return {
        browser: 'Safari',
        url: 'https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac'
      };
    } else {
      return {
        browser: 'your browser',
        url: 'https://www.digitalcitizen.life/how-allow-or-block-camera-access-your-browser/'
      };
    }
  };

  // Start camera feed
  const startCamera = async () => {
    setIsRetrying(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (mountedRef.current && videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraError(null);
      } else {
        // Clean up stream if component unmounted during permission request
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (mountedRef.current) {
        const { browser, url } = getBrowserInstructions();
        setCameraError(`Camera access denied. You'll need to enable camera permissions for this website in ${browser} to use the security system.`);
      }
    } finally {
      if (mountedRef.current) {
        setIsRetrying(false);
      }
    }
  };

  // Initialize camera on mount
  useEffect(() => {
    mountedRef.current = true;
    startCamera();

    return () => {
      mountedRef.current = false;
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Frame processing and motion detection loop
  useEffect(() => {
    if (!isSystemArmed) {
      setIsDetecting(false);
      return;
    }

    setIsDetecting(true);
    
    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || video.readyState !== 4) {
        requestRef.current = requestAnimationFrame(processFrame);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the image data for motion detection
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Detect motion and handle intruder detection
      if (detectMotion(imageData, sensitivity)) {
        setActiveDetection(true);
        
        triggerDetectionWithCooldown(canvas, (event) => {
          saveIntruderEvent(event);
          onDetection(event);
          playAlertSound();
        });
        
        setTimeout(() => setActiveDetection(false), 1000);
      }
      
      // Continue the processing loop
      requestRef.current = requestAnimationFrame(processFrame);
    };
    
    requestRef.current = requestAnimationFrame(processFrame);
    
    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isSystemArmed, sensitivity, onDetection]);

  const handleRetry = () => {
    if (!isRetrying) {
      startCamera();
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {/* Camera feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
      
      {/* Canvas for processing (hidden) */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {/* Status overlay */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <div className={`flex items-center ${isDetecting ? 'text-green-400' : 'text-gray-400'}`}>
          <div className={`w-3 h-3 rounded-full mr-2 ${isDetecting ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-xs font-medium">
            {isDetecting ? 'Monitoring' : 'Idle'}
          </span>
        </div>
      </div>
      
      {/* Detection indicator */}
      {activeDetection && (
        <div className="absolute inset-0 border-4 border-red-500 animate-pulse rounded-lg flex items-center justify-center">
          <div className="bg-red-500/70 text-white px-4 py-2 rounded-full font-bold text-lg">
            MOTION DETECTED
          </div>
        </div>
      )}
      
      {/* Camera error message */}
      {cameraError && (
        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center text-center p-4">
          <div className="max-w-md">
            <div className="text-red-400 mb-4">
              <Camera size={48} className="mx-auto" />
            </div>
            <div className="text-white text-xl font-semibold mb-3">Camera Access Required</div>
            <p className="text-gray-300 text-sm mb-4">{cameraError}</p>
            <div className="space-y-3">
              <a
                href={getBrowserInstructions().url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                View Permission Instructions
              </a>
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className={`w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 disabled:bg-green-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors duration-200`}
              >
                <RefreshCw size={20} className={`${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Retrying...' : 'Retry Camera Access'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;