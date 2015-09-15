#!/bin/bash

for address in `gcloud compute instances list --format json | jq -r '.[] | .networkInterfaces[] | .accessConfigs[] | .natIP'`
do
    echo "Deploying $address"
    curl -X GET -H "Accept:application/json" -H "Authorization: Bearer $DEPLOY_KEY" http://$address:3000/_ah/deploy
    echo -e "\n"
done
