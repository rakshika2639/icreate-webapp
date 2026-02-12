import requests

try:
    response = requests.get('http://localhost:5001/api/stats')
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response:", response.json())
    else:
        print("Error:", response.text)
except Exception as e:
    print("Error:", e)
