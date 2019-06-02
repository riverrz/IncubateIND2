from flask import Flask,request,jsonify
import json
from math import sin, cos, sqrt, atan2, radians, acos
import networkx as nx
import numpy as np
import pandas as pd

df = pd.read_csv('static/data/dataset1.csv')
# print(df.head(5))
# approximate radius of earth in km
R = 6373.0


def getDistance(lat1, lon1, lat2, lon2) :


    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c

    return distance



latitude = np.array([])
longitude = np.array([])
longitude = df['Longitude'].values
latitude = df['Latitude'].values

G = nx.Graph()


# print(df['Problem'].head(5))
# G=nx.path_graph(20)
# print(nx.dijkstra_path(G,3,1, weight='20'))
def initt():
    for i in range(latitude.size):
        lat1 = latitude[i]
        long1 = longitude[i]
        for j in range(i + 1, latitude.size):
            lat2 = latitude[j]
            long2 = longitude[j]
            distance = getDistance(lat1, long1, lat2, long2)

            G.add_edge(i, j, weight=distance)
            G.add_edge(j, i, weight=distance)


def getPath(src, dest):
    for i in range(latitude.size):
        curr_dist = getDistance(latitude[i], longitude[i], dest[0], dest[1])
        if (curr_dist < 150):

            G.add_edge(i, latitude.size, weight=1)
    mx_dist = 100000000000
    myidx = -1
    cnt = 0
    for i in range(latitude.size):
        curr_dist = getDistance(latitude[i], longitude[i], src[0], src[1])
        flag = 0
        if (curr_dist < 200):

            try:

                dist = nx.dijkstra_path_length(G, i, latitude.size) + curr_dist
            except:
                flag = 1
                dist = 100000000000

            if (flag == 0 ):
                dist = nx.dijkstra_path_length(G, i, latitude.size) + curr_dist
                if dist < mx_dist :
                    mx_dist = dist
                    myidx = i

        # print(curr_dist)
    # print(cnt)

    if myidx != -1:
        arr = nx.dijkstra_path(G, myidx, latitude.size)
    for i in range(latitude.size):
        curr_dist = getDistance(latitude[i], longitude[i], dest[0], dest[1])
        if (curr_dist < 150):
            G.remove_edge(i, latitude.size)
    if myidx == -1:
        return -1
    for i in range(len(arr) - 1):
        arr[i] = (latitude[arr[i]], longitude[arr[i]])
    return arr[:-1]


initt()
srcc = (51.884003,-9.589482)
destt = (54.422202,-6.44012)
print(getPath(srcc, destt))

# print (getDistance(srcc[0], srcc[1],destt[0], destt[1]))