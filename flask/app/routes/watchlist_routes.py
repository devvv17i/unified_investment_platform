from flask import Blueprint, request, jsonify
from bson import ObjectId
import os
from pymongo import MongoClient

watchlist_bp = Blueprint('watchlist', __name__, url_prefix='/api')
client = MongoClient(os.getenv("MONGO_URI"))  # MongoDB client
db = client["hackfest2k25"]  # Database
teams_collection = db["teams"]  # Collection

@watchlist_bp.route('/addToWatchList', methods=['POST'])
def add_to_watchlist():
    data = request.get_json()
    user_id = data.get('user_id')
    symbol = data.get('symbol')

    if not user_id or not symbol:
        return jsonify({"error": "Please provide user_id and symbol"}), 400

    user = teams_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    if symbol in user.get('watchlist', []):
        return jsonify({"error": "Symbol already in watchlist"}), 409

    teams_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$addToSet': {'watchlist': symbol}}
    )

    return jsonify({"message": "Added to watchlist successfully"})
