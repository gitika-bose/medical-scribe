import vertexai
from vertexai.preview.generative_models import GenerativeModel, GenerationConfig, HarmCategory, HarmBlockThreshold, FinishReason
import json
import re

class VertexAIService:
    """Service for interacting with Vertex AI (Gemini)"""
    
    def __init__(self, project_id: str, location: str, model_name: str = "gemini-1.5-pro"):
        vertexai.init(project=project_id, location=location)
        self.model = GenerativeModel(model_name)
    
    def _extract_json_from_response(self, text: str) -> str:
        """
        Extract JSON content from response text, handling markdown code blocks
        
        Args:
            text: Raw response text that may contain markdown
            
        Returns:
            Clean JSON string
        """
        text = text.strip()
        
        # Try to extract JSON from markdown code blocks
        # Pattern: ```json\n...\n``` or ```\n...\n```
        json_match = re.search(r'```(?:json)?\s*\n(.*?)\n```', text, re.DOTALL)
        if json_match:
            return json_match.group(1).strip()
        
        # If no code block, return as is
        return text
    
    def generate_questions(self, transcript: str) -> list:
        """
        Generate 2-3 potential questions a patient could ask based on the transcript
        
        Args:
            transcript: The current transcript of the medical conversation
            
        Returns:
            List of question strings
        """
        
        prompt = f"""This task is for informational note-taking only.
It does not provide medical advice, diagnosis, or treatment.
The output must not present an opinion.
        
Based on the following medical conversation transcript, generate 0-3 relevant questions that a patient might want to ask their healthcare provider. 
        
These questions should be:
- Relevant to the information discussed
- Common questions patients typically have
- DO NOT hallucinate outside the transcript, and don't make any assumptions or suggestions. 

The objective is just to find points from the transcript that might need further clarification. If there are no such clarifying questions, DO NOT return anything.

Transcript:
{transcript}

Return ONLY a JSON array of question strings, nothing else. Format: ["question 1", "question 2", "question 3"]
"""
        
        try:
            # Configure safety settings to allow medical content
            # Using BLOCK_NONE for medical application - medical discussions are legitimate
            safety_settings = {
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            }
            
            response = self.model.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=2048,  # Increased to avoid hitting token limit
                ),
                safety_settings=safety_settings
            )
            
            # Check if generation was blocked or incomplete
            if not response.candidates:
                raise Exception("Model response was blocked or had no candidates")
            
            candidate = response.candidates[0]
            
            # Get the response text (works for both complete and partial responses)
            response_text = None
            
            # Check finish reason - only STOP means successful completion
            if hasattr(candidate, 'finish_reason') and candidate.finish_reason != FinishReason.STOP:
                # Get safety ratings for debugging
                safety_info = ""
                if hasattr(candidate, 'safety_ratings'):
                    safety_info = "\nSafety Ratings: " + str([
                        f"{rating.category.name}: {rating.probability.name}" 
                        for rating in candidate.safety_ratings
                    ])
                
                # Finish reason name for debugging
                finish_reason_name = candidate.finish_reason.name if hasattr(candidate.finish_reason, 'name') else str(candidate.finish_reason)
                
                # If MAX_TOKENS, we can't get complete JSON - return empty list
                if candidate.finish_reason == FinishReason.MAX_TOKENS:
                    print(f"Warning: Hit max tokens during question generation. Returning empty list.")
                    return []  # Return empty list instead of trying to parse incomplete JSON
                else:
                    # For other finish reasons (SAFETY, RECITATION, OTHER), raise exception
                    if hasattr(candidate.content, 'parts') and candidate.content.parts:
                        partial_text = candidate.content.parts[0].text
                        raise Exception(f"Generation incomplete. Finish reason: {finish_reason_name}{safety_info}\nPartial content: {partial_text[:200]}")
                    raise Exception(f"Generation incomplete. Finish reason: {finish_reason_name}{safety_info}")
            
            # Check if response has text
            if not response or not hasattr(response, 'text') or not response.text:
                raise Exception("Model returned empty response")
            
            # Extract and parse the JSON response
            json_text = self._extract_json_from_response(response.text)
            
            if not json_text:
                raise Exception("No JSON content found in response")
            
            questions = json.loads(json_text)
            
            # Ensure we have a list and limit to 3 questions
            if isinstance(questions, list):
                return questions[:3]
            else:
                return []
        
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON response. Error: {str(e)}. Response text: {response.text if response and hasattr(response, 'text') else 'No response'}")
        except Exception as e:
            raise Exception(f"Failed to generate questions: {str(e)}")
    
    def process_transcript_to_soap(self, raw_transcript: str) -> dict:
        """
        Process raw transcript to SOAP format, removing fillers and organizing content
        
        Args:
            raw_transcript: The raw, unprocessed transcript
            
        Returns:
            Dictionary with SOAP format and other notes
        """
        
#         prompt = f"""You are a medical transcription AI. Process the following transcript of a conversation between doctor and patient. 
#         First, identify which of the two speakers is the doctor and patient. Treat the doctor's words as ground truth for this.
#         Then, organize it into a structured note format and categorize it in SOAP.

# SOAP Format:
# - Subjective: Patient-reported symptoms, history, concerns, and feelings. DON'T RETURN THIS IN THE RESPONSE.
# - Objective: Observable findings, vital signs, physical examination results. DON'T RETURN THIS IN THE RESPONSE.
# - Assessment: Clinical interpretation, diagnosis, and evaluation. RETURN THIS.
# - Plan: Treatment plans, follow-up instructions, prescriptions, and next steps. RETURN THIS.

# Additional Requirements:
# 1. Remove all filler words (um, uh, like, you know, etc.) and clean up the text for clarity
# 3. If there's relevant information that doesn't fit SOAP, include it in "OtherNotes"
# 4. Maintain HIPAA compliance - use clear, professional language
# 5. Avoid subjective opinions entirely and do not hallucinate - stick to facts
# 7. DO NOT add any knowledge outside of the transcript while summarizing
# 8. To make it patient friendly, use simple language and structure into bullet points 
# 10. Leave a section blank or short if there are less (or no) relevant details. Do not repeat details.

# Raw Transcript:
# {raw_transcript}

# Return ONLY a valid JSON object with bullet points structured as arrays. Use this exact structure:
# {{
#     "Assessment": {{
#         "diagnosis": ["diagnosis 1", "diagnosis 2"]
#     }},
#     "Plan": {{
#         "medications": ["medication 1", "medication 2"],
#         "treatments": ["treatment 1", "treatment 2"],
#         "followUp": ["follow-up instruction 1", "follow-up instruction 2"],
#         "lifestyle": ["lifestyle recommendation 1", "lifestyle recommendation 2"],
#         "additionalInstructions": ["instruction 1", "instruction 2"]
#     }},
#     "OtherNotes": "any additional relevant information"
# }}

# If a subsection has no information, use an empty array [] or empty string "". Do not omit fields.
# """
        prompt = f"""You are a medical transcription AI. Process the following transcript of a conversation between doctor and patient. 
        First, identify which of the two speakers is the doctor and patient. Treat the doctor's words as ground truth for this.
        Then, organize it into a structured format as below.
        Additional Requirements:
        1. Remove all filler words (um, uh, like, you know, etc.) and clean up the text for clarity
        3. If there's relevant information that doesn't fit SOAP, include it in "OtherNotes"
        4. Maintain HIPAA compliance - use clear, professional language
        5. Avoid subjective opinions entirely and do not hallucinate - stick to facts
        7. DO NOT add any knowledge outside of the transcript while summarizing
        8. To make it patient friendly, use simple language and be concise.
        10. Leave sections BLANK if there are no relevant details. 
        11. Do not repeat points or details anywhere. If it is relevant to 2 sections, pick one.

        Raw Transcript:
        {raw_transcript}

        Return ONLY a valid JSON object. Use this exact structure:
        {{
            "diagnosis": [ // List of differential diagnoses. If multiple problems lead to the same diagnosis, include all the problems in the description for the one diagnosis.
                {{
                    "diagnosis_name": "string",
                    "description": "string", // Description or reasoning for diagnosis
                    "severity": "high | medium | low", // Optional, relative ranking
                    "key_takeaway": "string" // One-sentence summary of what matters most right now
                }}
            ],
            "plan": {{
                "actions": {{
                    "tests": [ // What tests should the patient plan to take, if any
                        {{
                            "type": "string", // Lab Test, Imaging, Other
                            "diagnostic_name": "string",
                            "description": "string",
                            "recommended": "boolean", // Default true if recording only
                            "verified": "boolean" // Default false if recording only. True if found in uploaded records.
                            // Verified takes precedence over recommended
                        }}
                    ],
                    "procedures": [ // What procedures should the patient schedule, if any
                        {{
                            "type": "string", // consultation, surgery, therapy, other
                            "procedure_name": "string",
                            "description": "string", // Description or reasoning for procedure
                            "procedure_timeframe": "string", // Optional When the procedure is to be done. Can be specific date or duration like '2 weeks'
                            "recommended": "boolean",
                            "verified": "boolean"
                        }}
                    ],
                    "medications": [ // What medications should the patient take, if any
                        {{
                            "medication_name": "string",
                            "dosage": "string",
                            "frequency": "string",
                            "duration": "string", // How long. Can be specific date or duration like '2 weeks'
                            "description": "string", // Description or reasoning for medication
                            "recommended": "boolean",
                            "verified": "boolean"
                        }}
                    ]
                }},
                "next_steps": {{ // Do not repeat anything covered in the actions section
                    "follow_up": [
                        {{
                            "time_frame": "string", // When the follow-up should occur. Can be specific date or duration like '2 weeks'
                            "description": "string" // Description or reasoning for follow-up
                        }}
                    ],
                    "watch_for": [
                        {{
                            "symptom": "string",
                            "what_to_do": "string" // call clinic, go to ER, mention at follow-up
                        }}
                    ]
                }},
                "guidance": {{ // Do not repeat anything covered in the guidance section
                    "education": [ // Eg. lifestyle changes, disease information, problem explanation, resources etc.
                        {{
                            "topic": "string",
                            "description": "string"
                        }}
                    ],
                    "instructions": [ // Specific instructions for the patient
                        {{
                            "topic": "string",
                            "description": "string"
                        }}
                    ]
                }},
                "open_questions": [ // Things that were NOT clear after the appointment. Only important questions to address.
                    {{
                        "question": "string",
                        "reason": "string"
                    }}
                ]
            }}
        }}
        """
        
        try:
            # Configure safety settings to allow medical content
            # Using BLOCK_NONE for medical application - medical discussions are legitimate
            safety_settings = {
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            }
            
            response = self.model.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    temperature=0.3,  # Lower temperature for more consistent output
                    max_output_tokens=65000,  # Maximum allowed for Gemini models
                ),
                safety_settings=safety_settings
            )
            
            # Check if generation was blocked or incomplete
            if not response.candidates:
                print("Response generation blocked")
                raise Exception("Model response was blocked or had no candidates")
            
            candidate = response.candidates[0]
            
            # Check finish reason
            if hasattr(candidate, 'finish_reason') and candidate.finish_reason != FinishReason.STOP:
                print("Response stopped incomplete")
                finish_reason_name = candidate.finish_reason.name if hasattr(candidate.finish_reason, 'name') else str(candidate.finish_reason)
                
                # If MAX_TOKENS, raise specific error
                if candidate.finish_reason == FinishReason.MAX_TOKENS:
                    raise Exception(f"Transcript too long for SOAP processing. Please try with a shorter conversation or increase token limits. Finish reason: {finish_reason_name}")
                else:
                    # For other finish reasons
                    if hasattr(candidate.content, 'parts') and candidate.content.parts:
                        partial_text = candidate.content.parts[0].text
                        raise Exception(f"SOAP generation incomplete. Finish reason: {finish_reason_name}\nPartial content: {partial_text[:200]}")
                    raise Exception(f"SOAP generation incomplete. Finish reason: {finish_reason_name}")
            
            # Check if response has text
            if not response or not hasattr(response, 'text') or not response.text:
                raise Exception("Model returned empty response")
            
            # Extract and parse the JSON response
            json_text = self._extract_json_from_response(response.text)
            
            if not json_text:
                print("No json")
                raise Exception("No JSON content found in response")
            
            soap_notes = json.loads(json_text)

            return soap_notes
            # # Validate the structure
            # required_keys = ["Assessment", "Plan", "OtherNotes"]
            # if all(key in soap_notes for key in required_keys):
            #     return soap_notes
            # else:
            #     raise ValueError("Invalid SOAP format returned")
        
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON response. Error: {str(e)}. Response text: {response.text if response and hasattr(response, 'text') else 'No response'}")
        except Exception as e:
            raise Exception(f"Failed to process transcript to SOAP: {str(e)}")
