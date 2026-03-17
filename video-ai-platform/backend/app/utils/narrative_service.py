"""
Narrative Generation Service
Uses Claude AI to generate natural language narratives from video detections
"""

import os
from typing import Dict, List, Optional
from anthropic import Anthropic
import json


class NarrativeService:
    def __init__(self):
        """Initialize Anthropic client"""
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"  # Latest Sonnet model
    
    def generate_narrative(
        self, 
        video_metadata: Dict,
        detections: List[Dict],
        audio_analysis: Optional[Dict] = None
    ) -> Dict:
        """
        Generate a natural language narrative from video detections
        
        Args:
            video_metadata: Video info (duration, resolution, etc.)
            detections: List of object detections with timestamps
            audio_analysis: Optional audio transcription and events
        
        Returns:
            Dict with narrative, key_moments, and summary
        """
        
        # Prepare detection summary
        detection_summary = self._summarize_detections(detections)
        
        # Create prompt for Claude
        prompt = self._create_narrative_prompt(
            video_metadata,
            detection_summary,
            audio_analysis
        )
        
        # Call Claude API
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            # Parse response
            narrative_text = response.content[0].text
            
            # Structure the response
            result = {
                "narrative": narrative_text,
                "key_moments": self._extract_key_moments(detections, audio_analysis),
                "summary": self._generate_summary(detection_summary, audio_analysis),
                "confidence": "high" if len(detections) > 50 else "medium"
            }
            
            return result
            
        except Exception as e:
            print(f"Error generating narrative: {e}")
            return {
                "narrative": "Unable to generate narrative at this time.",
                "error": str(e)
            }
    
    def _summarize_detections(self, detections: List[Dict]) -> Dict:
        """Summarize detections by class and timeline"""
        
        # Count by class
        by_class = {}
        for det in detections:
            cls = det.get('class_name', det.get('class'))
            if cls:
                by_class[cls] = by_class.get(cls, 0) + 1
        
        # Sort by frequency
        top_objects = sorted(by_class.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Create timeline (group by 5-second buckets)
        timeline = {}
        for det in detections:
            timestamp = det.get('timestamp', 0)
            bucket = int(timestamp // 5) * 5  # Round to nearest 5 seconds
            
            if bucket not in timeline:
                timeline[bucket] = []
            
            timeline[bucket].append({
                'class': det.get('class_name', det.get('class')),
                'confidence': det.get('confidence', 0)
            })
        
        return {
            'total_detections': len(detections),
            'unique_classes': len(by_class),
            'top_objects': top_objects,
            'timeline': timeline
        }
    
    def _create_narrative_prompt(
        self,
        video_metadata: Dict,
        detection_summary: Dict,
        audio_analysis: Optional[Dict]
    ) -> str:
        """Create prompt for Claude to generate narrative"""
        
        duration = video_metadata.get('duration', 0)
        
        prompt = f"""You are a video analysis AI creating a natural language narrative from video detections.

VIDEO DETAILS:
- Duration: {duration:.1f} seconds
- Total detections: {detection_summary['total_detections']}
- Unique objects: {detection_summary['unique_classes']}

TOP DETECTED OBJECTS:
{self._format_top_objects(detection_summary['top_objects'])}

TIMELINE OF EVENTS:
{self._format_timeline(detection_summary['timeline'])}
"""

        # Add audio if available
        if audio_analysis and audio_analysis.get('has_audio'):
            transcript = audio_analysis.get('transcript', {})
            full_text = transcript.get('full_text', '')
            
            if full_text:
                prompt += f"""
AUDIO TRANSCRIPT:
"{full_text}"

AUDIO EVENTS:
{self._format_audio_events(audio_analysis.get('audio_events', []))}
"""

        prompt += """
TASK:
Generate a natural, flowing narrative that describes what happens in this video. 

REQUIREMENTS:
1. Write in present tense, third person
2. Include specific timestamps for key events
3. Integrate audio transcript naturally if available
4. Focus on main actions and interactions
5. Keep it concise (3-5 sentences for short videos, 1-2 paragraphs for longer videos)
6. Make it readable and engaging

EXAMPLE FORMAT:
"A person enters the frame from the left at 2 seconds and approaches a parked car. They retrieve their keys and open the driver's side door at 5 seconds. The person enters the vehicle and closes the door behind them at 8 seconds."

Generate the narrative now:"""

        return prompt
    
    def _format_top_objects(self, top_objects: List[tuple]) -> str:
        """Format top objects for prompt"""
        lines = []
        for obj, count in top_objects:
            lines.append(f"- {obj}: {count} detections")
        return "\n".join(lines) if lines else "- No objects detected"
    
    def _format_timeline(self, timeline: Dict) -> str:
        """Format timeline for prompt"""
        lines = []
        for bucket in sorted(timeline.keys()):
            objects = timeline[bucket]
            # Count unique objects in this bucket
            unique = {}
            for obj in objects:
                cls = obj['class']
                unique[cls] = unique.get(cls, 0) + 1
            
            obj_str = ", ".join([f"{count} {cls}" for cls, count in unique.items()])
            lines.append(f"- {bucket}s: {obj_str}")
        
        return "\n".join(lines) if lines else "- No timeline data"
    
    def _format_audio_events(self, events: List[Dict]) -> str:
        """Format audio events for prompt"""
        if not events:
            return "- No audio events detected"
        
        lines = []
        for event in events[:5]:  # Top 5 events
            timestamp = event.get('timestamp', 0)
            event_type = event.get('event_type', 'unknown')
            description = event.get('description', '')
            lines.append(f"- {timestamp:.1f}s: {description or event_type}")
        
        return "\n".join(lines)
    
    def _extract_key_moments(
        self,
        detections: List[Dict],
        audio_analysis: Optional[Dict]
    ) -> List[Dict]:
        """Extract key moments from detections"""
        
        key_moments = []
        
        # Group detections by timestamp (every 5 seconds)
        timeline = {}
        for det in detections:
            timestamp = det.get('timestamp', 0)
            bucket = int(timestamp // 5) * 5
            
            if bucket not in timeline:
                timeline[bucket] = []
            timeline[bucket].append(det)
        
        # Create key moments
        for bucket in sorted(timeline.keys()):
            dets = timeline[bucket]
            
            # Get most common objects
            by_class = {}
            for det in dets:
                cls = det.get('class_name', det.get('class'))
                if cls:
                    by_class[cls] = by_class.get(cls, 0) + 1
            
            top_object = max(by_class.items(), key=lambda x: x[1])[0] if by_class else "activity"
            
            key_moments.append({
                'timestamp': bucket,
                'description': f"{top_object} detected",
                'object_count': len(dets),
                'main_objects': list(by_class.keys())[:3]
            })
        
        return key_moments[:10]  # Top 10 moments
    
    def _generate_summary(
        self,
        detection_summary: Dict,
        audio_analysis: Optional[Dict]
    ) -> str:
        """Generate a brief summary"""
        
        total = detection_summary['total_detections']
        unique = detection_summary['unique_classes']
        top_objects = detection_summary['top_objects'][:3]
        
        summary = f"Video contains {total} detections across {unique} object types. "
        
        if top_objects:
            obj_names = [obj[0] for obj in top_objects]
            summary += f"Most frequent: {', '.join(obj_names)}. "
        
        if audio_analysis and audio_analysis.get('has_audio'):
            segments = len(audio_analysis.get('transcript', {}).get('segments', []))
            if segments > 0:
                summary += f"Audio includes {segments} speech segments."
        
        return summary