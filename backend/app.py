from flask import Flask, request, jsonify
from flask_cors import CORS
from gemini import generate_gemini_reply, return_dynamic_prices, return_wholesale_orders, return_seasonal_items, load_week_data
from database import get_profile, update_profile
import json, os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# cache to store insights per week so gemini only need to be called once / week.
insights_cache = {}

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")
    week = data.get("week", 1)
    print(f"Received from frontend: {user_message} (week {week})")
    try:
        reply = generate_gemini_reply(user_message, week)
        return jsonify({"reply": reply})
    except Exception as e:
        print("Error:", e)
        return jsonify({"reply": "Error: Could not connect to Gemini."}), 500

@app.route("/api/data", methods=["GET"])
def get_data():
    week = int(request.args.get("week", 1))
    try:
        data = load_week_data(week)
        return jsonify(data)
    except Exception as e:
        print("Error loading data:", e)
        return jsonify({"error": "Failed to load week data"}), 500

@app.route("/api/insights", methods=["GET"])
def get_insights():
    week = int(request.args.get("week", 1))

    if week in insights_cache:
        print(f"Returning cached insights for week {week}")
        return jsonify(insights_cache[week])

    try:
        insights_data = {
            "dynamic_pricing": return_dynamic_prices(week),
            "wholesale_suggestion": return_wholesale_orders(week),
            "seasonal_suggestions": return_seasonal_items(week),
        }
        #save to cache before printing
        insights_cache[week] = insights_data
        return jsonify(insights_data)
    except Exception as e:
        print("Error generating insights:", e)
        return jsonify({"error": "Failed to generate insights"}), 500
    
#counts number of weeks of json files, updats as more files uploaded
@app.route("/api/weeks", methods=["GET"])
def get_weeks():
    week = 1
    while os.path.exists(os.path.join(BASE_DIR, f"week{week}.json")):
        week += 1
    return jsonify({"total_weeks": week - 1})

#read + save profile edits
@app.route("/api/profile", methods=["GET", "POST"])
def profile():
    if request.method == "GET":
        return jsonify(get_profile())
    
    if request.method == "POST":
        data = request.get_json()
        update_profile(
            business_name=data.get("business_name", ""),
            owner_name=data.get("owner_name", ""),
            business_type=data.get("business_type", ""),
            email=data.get("email", "")
        )
        return jsonify({"success": True})
    
@app.route("/api/upload-week", methods=["POST"])
def upload_week():
    #checks for file
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    
    try:
        #checks validity of file (if has inv, budget, sales)
        data = json.load(file)
        required_keys = ["inventory", "budget", "sales"]
        for key in required_keys:
            if key not in data:
                return jsonify({"error": f"Missing required field: {key}"}), 400
    except Exception:
        return jsonify({"error": "Invalid JSON file"}), 400

    #finds next weeks number + saves uploaded file as next week JSON
    week = 1
    while os.path.exists(os.path.join(BASE_DIR, f"week{week}.json")):
        week += 1
    
    save_path = os.path.join(BASE_DIR, f"week{week}.json")
    with open(save_path, "w") as f:
        json.dump(data, f, indent=2)
    
    return jsonify({"success": True, "week": week})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
