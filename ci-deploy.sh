#!/bin/bash

curl -X GET -H "Accept:application/json" -H "Authorization: Bearer $DEPLOY_KEY" http://104.197.142.237:3000/_ah/deploy
curl -X GET -H "Accept:application/json" -H "Authorization: Bearer $DEPLOY_KEY" http://104.154.68.92:3000/_ah/deploy
