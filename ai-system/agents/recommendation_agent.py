import ollama
import sqlite3
import json
import numpy as np

def fetch_user_behavior(user_id):
    conn = sqlite3.connect("user_data.db")
    cursor = conn.cursor()
    cursor.execute("SELECT product_id FROM user_behavior WHERE user_id = ?", (user_id,))
    products = [row[0] for row in cursor.fetchall()]
    conn.close()
    return products

def get_embedding(text):
    response = ollama.embeddings(model="mistral", prompt=text)
    return response['embedding']

def fetch_all_product_embeddings():
    conn = sqlite3.connect("user_data.db")
    cursor = conn.cursor()
    cursor.execute("SELECT product_id, embedding FROM product_embeddings")
    data = [(row[0], json.loads(row[1])) for row in cursor.fetchall()]
    conn.close()
    return data

def recommend_products(user_id):
    recent_products = fetch_user_behavior(user_id)
    if not recent_products:
        return []

    all_embeddings = fetch_all_product_embeddings()
    interest_vector = np.mean([get_embedding(pid) for pid in recent_products], axis=0)

    def cosine_similarity(v1, v2):
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    scores = [(pid, cosine_similarity(interest_vector, np.array(emb))) for pid, emb in all_embeddings]
    scores.sort(key=lambda x: x[1], reverse=True)
    return [pid for pid, _ in scores[:5]]  # top 5

if __name__ == "__main__":
    user_id = user_id
    print(recommend_products(user_id))