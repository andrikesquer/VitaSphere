import pymongo
import os

url = os.environ.get("url")
client = pymongo.MongoClient(url)
db = client["VitaSphere"] 
