#!/bin/bash
cd /opt/app
git config --global credential.helper gcloud.sh
git clean -f -d
git fetch origin
git reset --hard origin/master
npm install
