"""
Layer 2: Audio Processing for Video Analysis
- Speech transcription (Whisper)
- Audio event detection
- Audio-visual fusion
"""

import whisper
import librosa
import numpy as np
import subprocess
import os
from typing import Dict, List, Tuple
import json

class AudioProcessor:
    def __init__(self):
        print("\n🎤 Loading Audio Models...")
        print("-" * 70)
        
        # Load Whisper model (base is good balance of speed/accuracy)
        print("Loading Whisper (Speech Recognition)...")
        self.whisper_model = whisper.load_model("base")  # Options: tiny, base, small, medium, large
        print("   ✓ Whisper-Base loaded (Speech transcription)")
        
        # Audio event categories to detect
        self.audio_events = {
            'speech': 'human_speech',
            'music': 'background_music',
            'vehicle': 'car_engine_horn',
            'alarm': 'alarm_siren',
            'impact': 'crash_bang_break',
            'nature': 'animal_sounds',
            'mechanical': 'machine_beep'
        }
        
        print("   ✓ Audio event detector ready")
        print("-" * 70 + "\n")
    
    def extract_audio_from_video(self, video_path: str, audio_path: str) -> bool:
        """
        Extract audio track from video using ffmpeg
        """
        try:
            print(f"📤 Extracting audio from video...")
            
            command = [
                'ffmpeg',
                '-i', video_path,
                '-vn',  # No video
                '-acodec', 'pcm_s16le',  # Audio codec
                '-ar', '16000',  # Sample rate (Whisper uses 16kHz)
                '-ac', '1',  # Mono
                '-y',  # Overwrite
                audio_path
            ]
            
            result = subprocess.run(
                command, 
                capture_output=True,
                text=True,
                timeout=60  # 60 second timeout
            )
            
            if result.returncode == 0:
                print(f"   ✓ Audio extracted to {audio_path}")
                return True
            else:
                print(f"   ⚠️  No audio track in video (silent video)")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"   ✗ Audio extraction timeout")
            return False
        except FileNotFoundError:
            print(f"   ✗ FFmpeg not found - install FFmpeg first")
            return False
        except Exception as e:
            print(f"   ✗ Audio extraction failed: {e}")
            return False
    
    def transcribe_speech(self, audio_path: str) -> Dict:
        """
        Transcribe speech using Whisper
        Returns: {full_text, segments: [{start, end, text, confidence}]}
        """
        print(f"\n🗣️  Transcribing speech...")
        
        try:
            result = self.whisper_model.transcribe(
                audio_path,
                language='en',  # Or None for auto-detect
                task='transcribe',
                word_timestamps=True,
                fp16=False  # Use False for CPU
            )
            
            # Extract segments with timestamps
            segments = []
            for segment in result['segments']:
                segments.append({
                    'start': round(segment['start'], 2),
                    'end': round(segment['end'], 2),
                    'text': segment['text'].strip(),
                    'confidence': 1.0 - segment.get('no_speech_prob', 0.0)
                })
            
            print(f"   ✓ Transcribed {len(segments)} speech segments")
            
            return {
                'full_text': result['text'].strip(),
                'language': result.get('language', 'en'),
                'segments': segments
            }
            
        except Exception as e:
            print(f"   ✗ Transcription failed: {e}")
            return {
                'full_text': '',
                'language': 'unknown',
                'segments': []
            }
    
    def detect_audio_events(self, audio_path: str, duration: float) -> List[Dict]:
        """
        Detect audio events (non-speech sounds)
        Returns: [{timestamp, event_type, confidence, description}]
        """
        print(f"\n🔊 Detecting audio events...")
        
        try:
            # Load audio
            y, sr = librosa.load(audio_path, sr=16000)
            
            events = []
            
            # Analyze in 2-second windows
            window_size = 2.0  # seconds
            hop_size = 1.0     # seconds
            
            window_samples = int(window_size * sr)
            hop_samples = int(hop_size * sr)
            
            for i in range(0, len(y) - window_samples, hop_samples):
                timestamp = i / sr
                
                # Extract window
                window = y[i:i + window_samples]
                
                # Detect events in this window
                event = self._analyze_audio_window(window, sr, timestamp)
                
                if event:
                    events.append(event)
            
            print(f"   ✓ Detected {len(events)} audio events")
            return events
            
        except Exception as e:
            print(f"   ✗ Audio event detection failed: {e}")
            return []
    
    def _analyze_audio_window(self, window: np.ndarray, sr: int, timestamp: float) -> Dict:
        """
        Analyze a single audio window for events
        """
        # Calculate features
        rms = np.sqrt(np.mean(window**2))  # Volume/energy
        zcr = librosa.feature.zero_crossing_rate(window)[0].mean()  # Zero crossing rate
        spectral_centroid = librosa.feature.spectral_centroid(y=window, sr=sr)[0].mean()
        
        # Thresholds for event detection
        silence_threshold = 0.01
        loud_threshold = 0.1
        
        # Detect event type
        if rms < silence_threshold:
            return None  # Silence
        
        event_type = None
        confidence = 0.0
        description = ""
        
        # Loud sudden sound (crash, bang, alarm)
        if rms > loud_threshold:
            if zcr > 0.15:  # High zero crossing = sharp/harsh sound
                event_type = "loud_event"
                description = "Loud impact or alarm"
                confidence = min(rms * 5, 1.0)
            else:
                event_type = "loud_sound"
                description = "Loud continuous sound"
                confidence = min(rms * 4, 1.0)
        
        # Medium volume with low frequency (vehicle, rumble)
        elif spectral_centroid < 1000 and rms > 0.03:
            event_type = "low_frequency"
            description = "Engine or mechanical sound"
            confidence = 0.6
        
        # Medium volume with high frequency (beep, alarm)
        elif spectral_centroid > 3000 and rms > 0.03:
            event_type = "high_frequency"
            description = "Beep or electronic sound"
            confidence = 0.7
        
        if event_type:
            return {
                'timestamp': round(timestamp, 2),
                'event_type': event_type,
                'confidence': round(confidence, 2),
                'description': description,
                'energy': round(float(rms), 3)
            }
        
        return None
    
    def fuse_audio_visual(self, visual_detections: List[Dict], 
                          speech_transcript: Dict,
                          audio_events: List[Dict]) -> Dict:
        """
        Combine audio and visual information for enhanced understanding
        """
        print(f"\n🔗 Fusing audio and visual data...")
        
        fused_timeline = []
        confirmations = 0
        
        # Group visual detections by timestamp (1-second buckets)
        visual_by_time = {}
        for det in visual_detections:
            time_bucket = int(det['timestamp'])
            if time_bucket not in visual_by_time:
                visual_by_time[time_bucket] = []
            visual_by_time[time_bucket].append(det)
        
        # Process each time bucket
        for time_bucket in sorted(visual_by_time.keys()):
            visual_at_time = visual_by_time[time_bucket]
            
            # Find audio at this time
            speech_at_time = [
                s for s in speech_transcript.get('segments', [])
                if s['start'] <= time_bucket < s['end']
            ]
            
            events_at_time = [
                e for e in audio_events
                if abs(e['timestamp'] - time_bucket) < 1.0
            ]
            
            # Count objects
            object_counts = {}
            for det in visual_at_time:
                cls = det['class_name']
                object_counts[cls] = object_counts.get(cls, 0) + 1
            
            # Audio-visual confirmation
            confirmed_objects = []
            for obj_type, count in object_counts.items():
                # Check if audio confirms this visual detection
                confirmed = self._check_audio_confirmation(
                    obj_type, 
                    speech_at_time, 
                    events_at_time
                )
                if confirmed:
                    confirmations += 1
                    confirmed_objects.append(obj_type)
            
            # Create timeline entry
            timeline_entry = {
                'timestamp': time_bucket,
                'visual': {
                    'objects': object_counts,
                    'total': len(visual_at_time)
                },
                'audio': {
                    'speech': speech_at_time[0]['text'] if speech_at_time else None,
                    'events': [e['description'] for e in events_at_time]
                },
                'confirmed_by_audio': confirmed_objects
            }
            
            fused_timeline.append(timeline_entry)
        
        print(f"   ✓ Created fused timeline with {len(fused_timeline)} moments")
        print(f"   ✓ Audio confirmed {confirmations} visual detections")
        
        return {
            'timeline': fused_timeline,
            'full_transcript': speech_transcript.get('full_text', ''),
            'total_speech_segments': len(speech_transcript.get('segments', [])),
            'total_audio_events': len(audio_events),
            'audio_confirmations': confirmations
        }
    
    def _check_audio_confirmation(self, object_type: str, 
                                   speech_segments: List[Dict],
                                   audio_events: List[Dict]) -> bool:
        """
        Check if audio confirms visual detection
        """
        # Keywords that confirm object types
        confirmations = {
            'car': ['car', 'vehicle', 'drive', 'driving', 'engine', 'horn'],
            'person': ['person', 'people', 'someone', 'man', 'woman', 'he', 'she'],
            'phone': ['phone', 'call', 'calling', 'mobile', 'hello'],
            'dog': ['dog', 'puppy', 'bark', 'woof', 'pet'],
            'cat': ['cat', 'kitten', 'meow', 'kitty'],
            'door': ['door', 'knock', 'enter', 'open', 'close'],
            'tv': ['tv', 'television', 'watch', 'show', 'channel'],
        }
        
        # Check speech for confirmation
        for segment in speech_segments:
            text = segment['text'].lower()
            keywords = confirmations.get(object_type, [])
            if any(keyword in text for keyword in keywords):
                return True
        
        # Check audio events for confirmation
        event_confirmations = {
            'car': ['low_frequency', 'engine'],
            'door': ['loud_event', 'impact'],
        }
        
        for event in audio_events:
            event_type = event['event_type']
            event_desc = event['description'].lower()
            
            confirm_types = event_confirmations.get(object_type, [])
            if event_type in confirm_types or any(ct in event_desc for ct in confirm_types):
                return True
        
        return False
    
    def process_video_audio(self, video_path: str, 
                           visual_detections: List[Dict],
                           duration: float) -> Dict:
        """
        Complete audio processing pipeline
        """
        print(f"\n{'='*70}")
        print(f"🎤 LAYER 2: AUDIO-VISUAL FUSION")
        print(f"{'='*70}")
        
        # Extract audio
        audio_path = video_path.replace('.mp4', '_audio.wav')
        has_audio = self.extract_audio_from_video(video_path, audio_path)
        
        if not has_audio:
            return {
                'has_audio': False,
                'message': 'No audio track in video'
            }
        
        # Process audio
        transcript = self.transcribe_speech(audio_path)
        audio_events = self.detect_audio_events(audio_path, duration)
        
        # Fuse with visual
        fused_data = self.fuse_audio_visual(
            visual_detections,
            transcript,
            audio_events
        )
        
        # Cleanup audio file
        if os.path.exists(audio_path):
            os.remove(audio_path)
        
        print(f"\n{'='*70}")
        print(f"✅ AUDIO-VISUAL FUSION COMPLETE")
        print(f"{'='*70}\n")
        
        return {
            'has_audio': True,
            'transcript': transcript,
            'audio_events': audio_events,
            'fused_data': fused_data
        }
