from flask import Blueprint, request, jsonify
import os
import json

recommendations_bp = Blueprint('recommendations', __name__, url_prefix='/api')

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set.")
genai.configure(api_key=api_key)

# Initialize the generative model with a system instruction
def get_stock_recommendations(user_stocks):
    """
    Get stock recommendations based on the user's current holdings
    using Gemini's generative AI capabilities.

    Args:
        user_stocks (list): List of stock symbols/names the user currently owns

    Returns:
        dict: Recommendations from Gemini
    """
    # Format the user stocks into a string
    stocks_str = ", ".join([f'"{stock}"' for stock in user_stocks])
    print(f"User stocks: {stocks_str}")

    # Prepare the prompt for Gemini
    prompt = f"""
    I have investments in the following stocks: {stocks_str}.

    Please analyze these stocks and recommend alternative stocks in similar sectors that
    might perform better. For each recommendation:

    1. Identify the sector of my current stock
    2. Recommend 1-2 alternative stocks in the same sector with potentially better performance
    3. Provide a brief rationale for why these alternatives might outperform my current holdings
    4. Include relevant financial metrics comparison

    Format your response as JSON with the following structure:
    {{
        "recommendations": [
            {{
                "original_stock": "stock_name",
                "sector": "sector_name",
                "alternatives": [
                    {{
                        "symbol": "alt_symbol",
                        "name": "alt_name",
                        "rationale": "brief_rationale",
                        "key_metrics": {{
                            "metric1": "value",
                            "metric2": "value"
                        }}
                    }}
                ]
            }}
        ]
    }}
    """

    # Query Gemini
    model = genai.GenerativeModel('gemini-1.5-pro')
    response = model.generate_content(prompt)
    print(f"Gemini response: {response.text}")

    try:
        # Parse the JSON response from Gemini
        # Look for JSON content in the response text
        response_text = response.text

        # Find JSON structure in the response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1

        if start_idx >= 0 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            recommendations = json.loads(json_str)
            return recommendations
        else:
            # If no JSON structure found, return the raw response
            return {"error": "Could not extract JSON from response", "raw_response": response_text}

    except json.JSONDecodeError:
        # Handle case where response isn't valid JSON
        return {"error": "Invalid JSON response from Gemini", "raw_response": response.text}
    except Exception as e:
        return {"error": str(e), "raw_response": response.text if hasattr(response, 'text') else "No response text"}

@recommendations_bp.route('/recommendations', methods=['POST'])
def recommendations():
    """API endpoint to get stock recommendations"""
    data = request.json
    print(data)

    # Validate input
    if not data or 'stocks' not in data or not data['stocks']:
        return jsonify({'error': 'Please provide a list of stocks'}), 400

    # Get recommendations
    recommendations = get_stock_recommendations(data['stocks'])

    return jsonify(recommendations)