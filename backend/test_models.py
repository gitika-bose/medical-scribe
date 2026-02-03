#!/usr/bin/env python3
"""
Test script to check which Vertex AI models are available in your project.
Run this to find the correct model name for your GCP project.
"""

import vertexai
from vertexai.preview.generative_models import GenerativeModel
import os
from dotenv import load_dotenv

load_dotenv()

project_id = os.getenv('GCP_PROJECT_ID')
location = os.getenv('GCP_LOCATION', 'us-central1')

print(f"Testing Vertex AI models in project: {project_id}")
print(f"Location: {location}\n")

# List of common Gemini models to try
models_to_test = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002",
    "gemini-pro-001",
    "gemini-3-pro-preview"
]

vertexai.init(project=project_id, location=location)

for model_name in models_to_test:
    try:
        print(f"Testing: {model_name}...", end=" ")
        model = GenerativeModel(model_name)
        response = model.generate_content("Say 'Hello' in one word.")
        print(f"✅ SUCCESS - Response: {response.text.strip()}")
    except Exception as e:
        error_msg = str(e)
        if "404" in error_msg:
            print("❌ Not found")
        elif "403" in error_msg:
            print("❌ No permission")
        else:
            print(f"❌ Error: {error_msg[:50]}...")

print("\nUse one of the successful models in your .env file.")
