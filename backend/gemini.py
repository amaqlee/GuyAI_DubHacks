import os
from google import genai
from google.genai import types
import json

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(BASE_DIR, "model config.json")

with open(config_path, "r") as f:
    config = json.load(f)

chat = client.chats.create(
    model="gemini-2.5-flash",
    config=types.GenerateContentConfig(
        system_instruction=config.get("system_instruction"),
        temperature=config.get("temperature"),
        max_output_tokens=config.get("maxOutputTokens"),
    ),
)

# ── Data loader ──────────────────────────────────────────────────────────────

def load_week_data(week: int = 1) -> dict:
    path = os.path.join(BASE_DIR, f"week{week}.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"week{week}.json not found")
    with open(path) as f:
        return json.load(f)

# ── Chat ─────────────────────────────────────────────────────────────────────

def generate_gemini_reply(user_message: str, week: int = 1) -> str:
    data = load_week_data(week)
    context = f"[Week {week} business data: {json.dumps(data)}]\n\nUser: {user_message}"
    response = chat.send_message(context)
    return response.text

# ── Analysis helpers ─────────────────────────────────────────────────────────

def get_item_name(item: dict) -> str:
    """Handle the typo 'iten_name' present in some data files."""
    return item.get("item_name") or item.get("iten_name") or "Unknown"

def dynamic_pricing(sales, inventory):
    adjustments = []
    for sale in sales:
        item_name = get_item_name(sale)
        current_price = sale.get("current_price", 0)
        units_sold = sale.get("units_sold", 0)
        inv_count = next(
            (i["count"] for i in inventory if i.get("item_name") == item_name), 0
        )
        demand_ratio = units_sold / inv_count if inv_count > 0 else 1.0
        proposed_price = current_price * (1 + 0.1 * demand_ratio)
        max_increase = current_price * 0.15
        min_price = current_price * 0.5
        proposed_price = min(current_price + max_increase, max(min_price, proposed_price))
        adjustments.append({
            "item": item_name,
            "current_price": current_price,
            "proposed_price": round(proposed_price, 2),
            "reasoning": f"Units sold: {units_sold}, Remaining inventory: {inv_count - units_sold}, adjusted within legal limits.",
        })
    return adjustments

def wholesale_suggestion(sales, inventory):
    suggestions = []
    for item in inventory:
        item_name = item.get("item_name", "")
        sold = next(
            (s.get("units_sold", 0) for s in sales if get_item_name(s) == item_name), 0
        )
        remaining = item["count"] - sold
        projected_needed = int(sold * 1.2)
        if projected_needed > remaining:
            suggestions.append({
                "item": item_name,
                "order_qty": projected_needed - remaining,
                "reasoning": f"Sold {sold}, stock remaining {remaining}, order covers next week at projected demand.",
            })
    return suggestions

def seasonal_suggestions(sales, product_info):
    suggestions = []
    for s in sales:
        item_name = get_item_name(s)
        units = s.get("units_sold", 0)
        if units > 150:
            response = chat.send_message(
                f"Suggest a seasonal variant of '{item_name}' I can sell in my café. One or two sentences only."
            )
            suggestions.append({"item": item_name, "reasoning": response.text})
    return suggestions

def calculate_revenue(sales, budget):
    total_sales = sum(s.get("current_price", 0) * s.get("units_sold", 0) for s in sales)
    total_expenses = budget["total_weekly_budget"]
    current_profit = total_sales - total_expenses
    avg_units = sum(s.get("units_sold", 0) for s in sales) / len(sales)
    projected_sales = sum(
        s.get("units_sold", 0) * (1 + (s.get("units_sold", 0) / avg_units - 1) * 0.1) * s.get("current_price", 0)
        for s in sales
    )
    projected_profit = projected_sales - total_expenses
    breakdown = [
        f"- {get_item_name(s)}: {s.get('units_sold',0)} units × ${s.get('current_price',0):.2f} = ${s.get('current_price',0)*s.get('units_sold',0):.2f}"
        for s in sales
    ]
    reasoning = "\n".join(breakdown)
    reasoning += f"\nTotal Revenue = ${total_sales:.2f}\nCosts = ${total_expenses:.2f}\nProfit = ${current_profit:.2f}\nProjected = ${projected_profit:.2f}"
    return current_profit, projected_profit, reasoning

# ── Public API (called by app.py) ─────────────────────────────────────────────

def return_dynamic_prices(week: int = 1):
    data = load_week_data(week)
    return dynamic_pricing(data["sales"], data["inventory"])

def return_wholesale_orders(week: int = 1):
    data = load_week_data(week)
    return wholesale_suggestion(data["sales"], data["inventory"])

def return_seasonal_items(week: int = 1):
    data = load_week_data(week)
    return seasonal_suggestions(data["sales"], data["product_information"])
