from flask import Blueprint, request, jsonify
from bson import ObjectId
import os
from pymongo import MongoClient

finance_bp = Blueprint('finance', __name__, url_prefix='/api')
client = MongoClient(os.getenv("MONGO_URI"))  # MongoDB client
db = client["hackfest2k25"]  # Database
teams_collection = db["questions"]  # Collection

@finance_bp.route('/finance_question', methods=['POST'])
def add_finance_question():
    data = request.get_json()
    question = data.get('question')
    answer = data.get('answer')

    if not question or not answer:
        return jsonify({"error": "Please provide question and answer"}), 400

    finance_question_id = teams_collection.insert_one({
        'question': question,
        'answer': answer
    }).inserted_id

    return jsonify({"message": "Finance question added successfully", "finance_question_id": str(finance_question_id)}), 201