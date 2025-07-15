import tkinter as tk
from tkinter import ttk
import cv2
import datetime
import json
import os
import uuid
from PIL import Image, ImageTk
import threading
from typing import Dict, List
import requests
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
import smtplib
from dotenv import load_dotenv
import winsound  # For Windows
import platform

# Load environment variables
load_dotenv()

class IntruderDetectionSystem:
    def __init__(self, root):
        self.root = root
        self.root.title("SecureView - Intruder Detection")
        self.root.configure(bg='#1a1a1a')
        
        # System state
        self.is_system_armed = True
        self.sensitivity = 15
        self.previous_frame = None
        self.detection_cooldown = False
        self.camera = cv2.VideoCapture(0)
        self.events: List[Dict] = self.load_events()
        
        # Notification settings
        self.whatsapp_enabled = bool(os.getenv('WHATSAPP_ENABLED', 'false').lower() == 'true')
        self.email_enabled = bool(os.getenv('EMAIL_ENABLED', 'false').lower() == 'true')
        
        self.setup_ui()
        self.update_camera()
    
    def setup_ui(self):
        # Main container
        main_container = ttk.Frame(self.root)
        main_container.pack(padx=20, pady=20, fill=tk.BOTH, expand=True)
        
        # Left panel (camera feed and alerts)
        left_panel = ttk.Frame(main_container)
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        # Camera feed
        self.camera_label = ttk.Label(left_panel)
        self.camera_label.pack(fill=tk.BOTH, expand=True)
        
        # Alert label
        self.alert_label = ttk.Label(
            left_panel,
            text="",
            foreground="red",
            font=("Arial", 14, "bold")
        )
        self.alert_label.pack(pady=10)
        
        # Right panel (controls and history)
        right_panel = ttk.Frame(main_container)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH)
        
        # Control panel
        control_panel = ttk.LabelFrame(right_panel, text="Control Panel")
        control_panel.pack(fill=tk.X, pady=(0, 10))
        
        # System arm toggle
        arm_button = ttk.Button(
            control_panel,
            text="Armed" if self.is_system_armed else "Disarmed",
            command=self.toggle_system
        )
        arm_button.pack(pady=5, padx=5, fill=tk.X)
        
        # Sensitivity control
        ttk.Label(control_panel, text="Motion Sensitivity").pack(pady=(5,0))
        self.sensitivity_scale = ttk.Scale(
            control_panel,
            from_=5,
            to=30,
            orient=tk.HORIZONTAL,
            command=self.update_sensitivity
        )
        self.sensitivity_scale.set(self.sensitivity)
        self.sensitivity_scale.pack(pady=5, padx=5, fill=tk.X)
        
        # Notification toggles
        notification_frame = ttk.LabelFrame(control_panel, text="Notifications")
        notification_frame.pack(fill=tk.X, pady=5, padx=5)
        
        # WhatsApp toggle
        self.whatsapp_var = tk.BooleanVar(value=self.whatsapp_enabled)
        ttk.Checkbutton(
            notification_frame,
            text="WhatsApp Notifications",
            variable=self.whatsapp_var,
            command=self.toggle_whatsapp
        ).pack(pady=2, padx=5, fill=tk.X)
        
        # Email toggle
        self.email_var = tk.BooleanVar(value=self.email_enabled)
        ttk.Checkbutton(
            notification_frame,
            text="Email Notifications",
            variable=self.email_var,
            command=self.toggle_email
        ).pack(pady=2, padx=5, fill=tk.X)
        
        # History panel
        history_panel = ttk.LabelFrame(right_panel, text="Detection History")
        history_panel.pack(fill=tk.BOTH, expand=True)
        
        # History list
        self.history_list = tk.Listbox(
            history_panel,
            bg='#2a2a2a',
            fg='white',
            selectmode=tk.SINGLE
        )
        self.history_list.pack(pady=5, padx=5, fill=tk.BOTH, expand=True)
        self.update_history_list()
        
        # Clear history button
        clear_button = ttk.Button(
            history_panel,
            text="Clear History",
            command=self.clear_history
        )
        clear_button.pack(pady=5, padx=5, fill=tk.X)
    
    def play_alarm(self):
        def alarm_thread():
            if platform.system() == 'Windows':
                winsound.Beep(1000, 1000)  # Frequency: 1000Hz, Duration: 1000ms
            else:
                # For Unix-like systems, print ASCII bell character
                print('\a', flush=True)
        
        threading.Thread(target=alarm_thread).start()
    
    def send_whatsapp_notification(self, image_path: str):
        if not self.whatsapp_enabled:
            return
            
        whatsapp_token = os.getenv('WHATSAPP_TOKEN')
        phone_number = os.getenv('WHATSAPP_TO')
        
        if not whatsapp_token or not phone_number:
            print("WhatsApp credentials not configured")
            return
            
        try:
            url = f"https://graph.facebook.com/v17.0/{os.getenv('WHATSAPP_PHONE_ID')}/messages"
            headers = {
                "Authorization": f"Bearer {whatsapp_token}",
                "Content-Type": "application/json"
            }
            
            data = {
                "messaging_product": "whatsapp",
                "to": phone_number,
                "type": "text",
                "text": {
                    "body": f"⚠️ ALERT: Motion detected at {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                }
            }
            
            response = requests.post(url, headers=headers, json=data)
            if response.status_code != 200:
                print(f"WhatsApp notification failed: {response.text}")
        except Exception as e:
            print(f"Error sending WhatsApp notification: {e}")
    
    def send_email_notification(self, image_path: str):
        if not self.email_enabled:
            return
            
        smtp_server = os.getenv('SMTP_SERVER')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        from_email = os.getenv('FROM_EMAIL')
        to_email = os.getenv('TO_EMAIL')
        
        if not all([smtp_server, smtp_username, smtp_password, from_email, to_email]):
            print("Email credentials not configured")
            return
            
        try:
            msg = MIMEMultipart()
            msg['Subject'] = '⚠️ Intruder Alert - Motion Detected'
            msg['From'] = from_email
            msg['To'] = to_email
            
            text = MIMEText(f"Motion was detected at {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            msg.attach(text)
            
            with open(image_path, 'rb') as f:
                img = MIMEImage(f.read())
                img.add_header('Content-Disposition', 'attachment', filename='intruder.jpg')
                msg.attach(img)
            
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
        except Exception as e:
            print(f"Error sending email notification: {e}")
    
    def toggle_whatsapp(self):
        self.whatsapp_enabled = self.whatsapp_var.get()
    
    def toggle_email(self):
        self.email_enabled = self.email_var.get()
    
    def update_camera(self):
        ret, frame = self.camera.read()
        if ret:
            # Convert frame to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Motion detection
            if self.is_system_armed:
                if self.detect_motion(frame_rgb):
                    self.trigger_detection(frame)
            
            # Convert to PhotoImage
            image = Image.fromarray(frame_rgb)
            image = image.resize((640, 480))
            photo = ImageTk.PhotoImage(image=image)
            
            self.camera_label.configure(image=photo)
            self.camera_label.image = photo
        
        self.root.after(10, self.update_camera)
    
    def detect_motion(self, frame):
        if self.detection_cooldown:
            return False

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (15, 15), 0)  # Reduced blur kernel for finer detail
        
        if self.previous_frame is None:
            self.previous_frame = gray
            return False
        
        frame_delta = cv2.absdiff(self.previous_frame, gray)
        thresh = cv2.threshold(frame_delta, 20, 255, cv2.THRESH_BINARY)[1]  # Lowered threshold
        
        thresh = cv2.dilate(thresh, None, iterations=1)  # Reduced dilation
        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        motion_detected = False
        for contour in contours:
            if cv2.contourArea(contour) > (self.sensitivity * 50):  # Reduced area threshold
                motion_detected = True
                break
        
        self.previous_frame = gray
        return motion_detected
    
    def trigger_detection(self, frame):
        if self.detection_cooldown:
            return
            
        self.detection_cooldown = True
        threading.Timer(3.0, self.reset_cooldown).start()  # Reduced cooldown time
        
        # Play alarm sound
        self.play_alarm()
        
        # Save detection event
        timestamp = datetime.datetime.now()
        event_id = str(uuid.uuid4())
        
        # Save frame as image
        if not os.path.exists('detections'):
            os.makedirs('detections')
        
        image_path = f"detections/{event_id}.jpg"
        cv2.imwrite(image_path, frame)
        
        event = {
            'id': event_id,
            'timestamp': timestamp.isoformat(),
            'image_path': image_path
        }
        
        self.events.insert(0, event)
        self.save_events()
        self.update_history_list()
        
        # Send notifications in separate threads
        if self.whatsapp_enabled:
            threading.Thread(target=self.send_whatsapp_notification, args=(image_path,)).start()
        if self.email_enabled:
            threading.Thread(target=self.send_email_notification, args=(image_path,)).start()
        
        # Show alert
        self.alert_label.configure(text="MOTION DETECTED!")
        self.root.after(3000, lambda: self.alert_label.configure(text=""))
    
    def reset_cooldown(self):
        self.detection_cooldown = False
    
    def toggle_system(self):
        self.is_system_armed = not self.is_system_armed
        text = "Armed" if self.is_system_armed else "Disarmed"
        self.root.children['!frame'].children['!frame'].children['!labelframe'].children['!button'].configure(text=text)
    
    def update_sensitivity(self, value):
        self.sensitivity = float(value)
    
    def update_history_list(self):
        self.history_list.delete(0, tk.END)
        for event in self.events:
            timestamp = datetime.datetime.fromisoformat(event['timestamp'])
            self.history_list.insert(0, f"{timestamp.strftime('%Y-%m-%d %H:%M:%S')} - Motion Detected")
    
    def clear_history(self):
        self.events = []
        self.save_events()
        self.update_history_list()
        
        # Remove saved images
        if os.path.exists('detections'):
            for file in os.listdir('detections'):
                os.remove(os.path.join('detections', file))
    
    def load_events(self) -> List[Dict]:
        try:
            if os.path.exists('events.json'):
                with open('events.json', 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading events: {e}")
        return []
    
    def save_events(self):
        try:
            with open('events.json', 'w') as f:
                json.dump(self.events, f)
        except Exception as e:
            print(f"Error saving events: {e}")
    
    def __del__(self):
        self.camera.release()

if __name__ == "__main__":
    root = tk.Tk()
    app = IntruderDetectionSystem(root)
    root.mainloop()