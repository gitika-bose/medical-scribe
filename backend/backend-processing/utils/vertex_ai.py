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
            "title": "string", // Title of the appointment or visit, e.g., "Annual Checkup", "Follow-up for Blood Pressure"
            "doctor_name": "string",
            "location": "string",
            "summary": "string", // Short summary of the visit, including key points from the reason for visit, doctor's diagnosis, solution and todos.
            /* Reason for visit as provided by the patient. Don't invent and deviate from the actual reason for visit provided by the patient.  */
            "reason_for_visit": [
                {{
                    "reason": "string", // Reason for visit as provided by the patient, e.g., "Routine checkup", "High blood pressure", "Follow-up on lab results"
                    "description": "string" // Additional details about the reason for visit, e.g., "Daily headaches for the past week", "Blood pressure readings consistently above 140/90"
                }}
            ],
            /* Diagnosis given by the doctor of the problem. Don't invent and deviate from the actual diagnosis provided by the doctor. */
            "diagnosis": {{
                "details": [
                    {{
                        "title": "string", // Title of the diagnosis exactly as mentioned by the doctor, e.g., "Hypertension", "Type 2 Diabetes" 
                        "description": "string", // Description and explaination for diagnosis
                        "severity": "high | medium | low" // As labelled by the doctor. Unless doctor labels the severity, leave it out. Do not invent or assume severity level. E.g. if doctor says "Your blood pressure is a bit high, but we can manage it with lifestyle changes and medication", you can label it as "medium". But if doctor doesn't provide any indication of severity, leave it out.
                    }}
                ]
            }},
            /* Todos are action items for the patient. Don't invent and deviate from the todos provided explicitly by the doctor.  */
            // Todos can be of type "Tests", "Medication", "Procedure", "Others" - ONLY.
            // If there is any relation between todos, mention that. E.g. if the doctor recommends getting a fasting cholesterol level test done at the lab, and based on the results, may recommend starting a cholesterol medication, you can mention that relation in the description of the respective todos. But do not invent any relation that is not explicitly mentioned by the doctor.
            "todos": [
                {{ 
                    // Sample for type test. Group tests that belong together. Eg, Vitamin D and B12 test can be grouped together as they are both vitamin tests
                    "type": "string",
                    "title": "string", // Title of the TEST todo, e.g. "Cholesterol level Test", "Vitamin D and B12", "Immunity Tests (COVID-19, Flu, Strep)"
                    "description": "string", // Description of the TEST todo, e.g. "Get fasting cholesterol level test done at the lab", "Get Vitamin D and B12 levels checked", "Get tested for COVID-19, Flu and Strep as experiencing symptoms of cough, fever and sore throat"
                    "recommended": "boolean", // Whether the todo is recommended by the doctor.
                    "verified": "boolean" // Whether the todo is verified by the doctor reports. False by default.
                }},
                {{
                    // Sample for type medication. 
                    // Keep each medication as a separate todo even if they belong together. Eg, if the doctor recommends starting both Metformin and Glipizide, create 2 separate todos
                    // Add the dosage in the title
                    "type": "string", 
                    "title": "string", // Title of the MEDICATION todo, e.g. "Metformin 500mg", "Glipizide 5mg", "Vitamin D supplement 2000 IU"
                    "dosage": "string", // Dosage for the medication, e.g. "500mg", "5mg"
                    "frequency": "string", // Frequency of the medication, e.g. "Twice a day", "Every 8 hours",
                    "timing": "string", // Timing for the medication, e.g. "Take with meals", "Take on an empty stomach", "Once in the morning and once at night"
                    "duration": "string", // Duration for the medication, e.g. "For 2 weeks", "Indefinitely until next follow-up"
                    // Description reason and instructions for Medication. Or specific note about it e.g. change from previous dosage, side effect to watch for, reaction with other medication or food.
                    // E.g. "Start daily and increase to twice a day after 1 week if no side effects. Watch for signs of low blood sugar such as dizziness, sweating and confusion. Avoid alcohol while on this medication."
                    "description": "string", 
                    "recommended": "boolean",
                    "verified": "boolean"
                }},
                {{
                    // Sample for type procedure. 
                    // Keep each procedure as a separate todo even if they belong together. Eg, if the doctor recommends both colonoscopy and endoscopy, create 2 separate todos
                    "type": "string",
                    "title": "string", // Title of the PROCEDURE todo, e.g. "Colonoscopy", "Knee MRI", "Physical Therapy"
                    "description": "string", // Description, Reason and Instructions for the PROCEDURE todo. Also add any details mentioned for it. E.g. "Patient is over 50 years old.", "Evaluate persistent knee pain and rule out meniscus tear. Avoid strenuous activity until then.", "Improve mobility and strengthen muscles after knee injury. Start in 2 weeks after initial rest and ice treatment."
                    "timeframe": "string", // Timeframe for the procedure, e.g. "Within the next month", "As soon as possible", "Within 2 weeks"
                    "recommended": "boolean",
                    "verified": "boolean"
                }},
                {{
                    // Sample for type Other. Others can be any other type of todo that doesn't fit into Tests, Medication or Procedure.
                    // Eg, Care instructions such as wound care, nasal spray care etc, lifestyle changes suggested such as diet and exercise recommendations etc.
                    // Group insturctions that belong together. E.g. A leg injury might warrant RICE and light stretches, which can be grouped together. But if care instructions for different conditions, keep them separate. Eg, care instructions for leg ulcer and care instructions for nasal congestion should be kept as separate todos even if they are given during the same consultation.
                    "type": "string",
                    "title": "string", // Title of the todo, e.g. "Rest and stretch leg", "Use DASH diet for blood pressure control", "Saline and Flonase spray for nasal congestion",
                    // Description, Reason and Instructions for the OTHER todo. Also add any details mentioned for it. 
                    // E.g. "Clean the wound with saline and apply antibiotic ointment daily until next follow-up.", "Adopt DASH diet which emphasizes fruits, vegetables, whole grains and lean proteins to help with blood pressure control. Limit sodium intake to less than 1500mg per day.", "Use saline spray first to moisturize the nose and reduce side effects of dryness, followed by Flonase to reduce inflammation and control turbinate swelling. Follow up in 1 week if symptoms persist."
                    "description": "string", 
                    "recommended": "boolean",
                    "verified": "boolean"
                }}
            ],
            "follow_up": [
                {{
                    "time_frame": "string", // Time frame for follow-up, e.g. "In 1 month", "In 3 months", "In 1 year"
                    // Description, reason and instructions for follow-up
                    // E.g. "Evaluate blood pressure control and adjust medications as needed.", Repeat blood tests to monitor cholesterol levels.", "Annual checkup and preventive care."
                    "description": "string" 
                }}
            ],
            /* Learnings are concepts or insights given during the consultation. DO NOT invent information, only document what was discussed by the doctor */
            "learnings": [
                {{
                    "title": "string", // Title of the learning, e.g. "Hypertension", "Dandruff", "Use of humidifier for deviated nasal septum"
                    // Description or information shared for the the learning. Keep it short.
                    // DO NOT add anything yourself, only what was shared by the doctor. The patient wants to search the internet for more information later, by themselves.
                    // E.g. "Hypertension is a chronic medical condition where the blood pressure in the arteries is persistently elevated. It can lead to serious complications such as heart attack, stroke and kidney failure if not managed properly.", "Dandruff is a common scalp condition that causes flaky skin. It can be caused by dry skin, sensitivity to hair products and skin conditions such as seborrheic dermatitis.", "A deviated nasal septum can cause nasal obstruction and contribute to snoring. Using a humidifier can help keep the nasal passages moist and reduce congestion."
                    "description": "string" 
                }}
            ]
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
