import sqlite3

# Connect to SQLite DB (it will create the DB if it doesn't exist)
conn = sqlite3.connect('user_data.db')
cursor = conn.cursor()

# Create the users table if it doesn't exist
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    interests TEXT,
    history TEXT
)
''')



conn.commit()
conn.close()

print("✅ Test user inserted into user_data.db!")




# Insert a sample user with browsing behavior and interests
# cursor.execute('''
# INSERT OR REPLACE INTO users (user_id, interests, history)
# VALUES (?, ?, ?)
# ''', (
#     "66cc0e53afd0e9233ffca889",
#     "tech gadgets, smart watches, noise cancelling headphones",
#     "browsed Apple Watch Series 9, Sony WH-1000XM5, Samsung Galaxy Watch"
# ))