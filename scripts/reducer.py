import random, json, math

with open('dump.json', 'r') as f:
    data = json.load(f)

last = len(data)
index = 0

reduced = list()

while index < last:
    reduced.append(data[index])
    index += int(round(random.normalvariate(25, 5)))

with open('docs/data/reduced.json', 'w') as f:
    json.dump(reduced, f)
