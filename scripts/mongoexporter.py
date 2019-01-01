import pymongo, json

client = pymongo.MongoClient('server.local', 27017)

points = client.air_data.points

data = list()
count = 0
print('Fetching:')
for item in points.find():
    if count % 1000 == 0:
        print(count)
    count += 1
    del item['_id']
    del item['date']
    data.append(item)

with open('dump.json', 'w') as f:
    json.dump(data, f)