import requests

API_VERSION = "v25.0"
PHONE_NUMBER_ID = "YOUR_PHONE_NUMBER_ID"

url = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages"

headers = {
    "Authorization": "Bearer EAA3lacKOE3wBRbnZCNdHLRZBGtASPPZBVvOrgZCWp1d9MkzdXqluxZAMNfAEqNyeap5Uy8X9wxQJfHpTzOLbUNhujJRS0x0ZCdBDyGvWbRQXsZCiXgA2lzpKFSsvSsKAuZAkZA0LugRcQ4Rfu3eAzOlCMrejNA0mMo4mvkOdSZBQyFsj9KDYGY7jx307JRgy3Ch0E09dUfq4EIQDB2IzTycpM7Y7qZBnObqtaHMeTvrjnPwDCsk5pcAPcjaZBWgWJL4HLIF28JQdZC9bYH76mcqoiMdDu",
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