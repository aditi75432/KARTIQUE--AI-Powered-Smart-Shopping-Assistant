import ollama
# First install ollama package:
# pip install ollama
model_name = "mistral"
prompt = "Explain what a recommendation agent does in AI."

response = ollama.chat(model=model_name, messages=[{"role": "user", "content": prompt}])

print("AI Response:", response["message"]["content"])
