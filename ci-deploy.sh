#!/bin/bash

curl -X GET -H "Accept:application/json" -H "Authorization: Bearer $DEPLOY_KEY" http://146.148.37.66:3000/_ah/deploy
curl -X GET -H "Accept:application/json" -H "Authorization: Bearer $DEPLOY_KEY" http://104.154.51.185:3000/_ah/deploy
