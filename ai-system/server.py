from flask import Flask, request, jsonify
import ollama
import sqlite3

app = Flask(__name__)

@app.route('/api/recommend', methods=['GET'])
def recommend():
    user_id = request.args.get('user_id')

    # Load user behavior from SQLite
    conn = sqlite3.connect('user_data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT interests, history FROM users WHERE user_id=?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    # if not row:
    #     return jsonify({'error': 'User not found'}), 404

    # ✅ Fallback if user is not found
    if not row:
        return jsonify({
            'user_id': user_id,
            'recommended_products': [
                "Apple AirPods Pro 2",
                "Samsung Galaxy Watch",
                "Sony WH-1000XM5",
                "Fitbit Charge 6",
                "Echo Dot with Clock"
            ],
            'note': 'Fallback recommendations used.'
        }), 200


    interests, history = row
    # prompt = f"Given the user's interests: {interests} and browsing history: {history}, recommend 5 products with names only."
    prompt = (
    f"Act as a product recommendation expert. Based on the user's interests: {interests} "
    f"and past browsing history: {history}, recommend 5 trending and relevant products. "
    "Give only the product names as bullet points.")


    # Query the LLM (e.g., mistral)
    response = ollama.chat(model='mistral', messages=[
        {"role": "user", "content": prompt}
    ])

    recommendations = response['message']['content']

    return jsonify({
        'user_id': user_id,
        'recommended_products': recommendations.strip().split('\n')
    })
  


if __name__ == '__main__':
    app.run(port=8000)
