import requests

API_VERSION = "v25.0"
PHONE_NUMBER_ID = "YOUR_PHONE_NUMBER_ID"

url = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages"

headers = {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Content-Type": "application/json",
}

data = {
    "messaging_product": "whatsapp",
    "to": "919233054806",
    "type": "template",
    "template": {
        "name": "hello_world",
        "language": {
            "code": "en_US"
        },
    }
}

response = requests.post(
    url,
    headers=headers,
    json=data,
    timeout=30
)

print(response.json())