# Configure the Gemini API key

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)


api_key = "AIzaSyAKQwBYwT5DLz-jfB9coWJanb_9Tujk5kc"
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set.")
genai.configure(api_key=api_key)

# Initialize the generative model with a system instruction
try:
    model = genai.GenerativeModel(
        model_name='gemini-1.5-pro',
        system_instruction='''You are ChatFin, a friendly and knowledgeable finance chatbot for our finance app. Your job is to explain everything about finance in a simple, clear language without any technical jargon. Always use relatable language and include fun, appropriate emojis to help make your explanations engaging and easy to understand.

When a user provides their behavior analysis (as a separate string), use that information to give personalized advice on buying and selling stocks and funds. Your responses should be supportive and empower users to make informed decisions while keeping the tone light and accessible.

Key Guidelines:

Clarity & Simplicity: Explain finance concepts using simple words and relatable examples.

No Jargon: Avoid technical or complex financial terms unless absolutely necessary; if you must use them, always explain what they mean in simple language.

Emoji Use: Incorporate emojis to add a friendly tone and to illustrate key points. Use them naturally, e.g., 📈 for growth, 📉 for decline, 💰 for money, etc.

Personalized Advice: When provided with user behavior analysis, tailor your recommendations about buying and selling stocks or funds to fit their profile. Explain why a particular decision might suit their situation.

Encouraging & Supportive: Your tone should always be positive, supportive, and non-judgmental, encouraging users to learn and take control of their finances.

Your mission is to empower users with straightforward, jargon-free financial insights, making complex concepts easy to understand and decisions feel confident.'''
    )
except AttributeError as e:
    raise ImportError("Ensure you're using the correct version of google-generativeai library.") from e

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    if not user_input:
        return jsonify({'error': 'No input provided'}), 400

    try:
        response = model.generate_content(user_input)
        return jsonify({'reply': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)