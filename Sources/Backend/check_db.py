import urllib.request
import json

try:
    url = "http://localhost:8081/api/feedbacks/public?page=0&size=50"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        res_body = response.read().decode("utf-8")
        data = json.loads(res_body)
        feedbacks = data.get("content", [])
        print(f"Total elements: {data.get('totalElements', 0)}")
        print(f"Number of feedbacks fetched: {len(feedbacks)}")
        for fb in feedbacks:
            print(f"ID: {fb.get('id')}, Title: {fb.get('title')}, Status: {fb.get('status')}, CategoryCode: {fb.get('categoryCode')}, CategoryName: {fb.get('categoryName')}, WardID: {fb.get('wardId')}, WardName: {fb.get('wardName')}, CreatedAt: {fb.get('createdAt')}")
except Exception as e:
    print("Error:", e)
