from flask import Blueprint, request, jsonify, session
from bson import ObjectId
import bcrypt
import os
from pymongo import MongoClient
from dotenv import load_dotenv

auth_bp = Blueprint('auth', __name__, url_prefix='/api')

client = MongoClient(os.getenv("MONGO_URI"))  # MongoDB client
db = client["hackfest2k25"]  # Database
teams_collection = db["teams"]  # Collection

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    full_name = data.get('fullName')
    password = data.get('password')

    if not email or not full_name or not password:
        return jsonify({"error": "Please provide all fields"}), 400

    if teams_collection.find_one({'email': email}):
        return jsonify({"error": "User already exists"}), 409

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user_id = teams_collection.insert_one({
        'email': email,
        'fullName': full_name,
        'password': hashed_pw
    }).inserted_id

    return jsonify({"message": "Registered successfully", "user_id": str(user_id)}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Please provide email and password"}), 400

    user = teams_collection.find_one({'email': email})

    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "message": "Login successful",
        "user_id": str(user['_id']),
        "fullName": user['fullName']
    })

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"})
