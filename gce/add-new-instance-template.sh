#! /bin/bash

set -ex

ZONE=us-central1-c

APP_ID=byte-music-converter

GROUP=$APP_ID
TEMPLATE=$GROUP-tmpl-150908
MACHINE_TYPE=g1-small
STARTUP_SCRIPT=startup-script.sh
SCOPES="logging-write \
storage-rw \
https://www.googleapis.com/auth/projecthosting \
https://www.googleapis.com/auth/cloud-platform \
https://www.googleapis.com/auth/userinfo.email"
TAGS=http-server

SERVICE=$APP_ID-service

#
# Instance group setup
#

# First we have to create an instance template.
# This template will be used by the instance group
# to create new instances.

gcloud compute instance-templates create $TEMPLATE \
  --machine-type $MACHINE_TYPE \
  --scopes $SCOPES \
  --metadata DEPLOY_KEY=$DEPLOY_KEY \
  --metadata API_AUTH_KEY=$BYTE_MUSIC_CONVERTER_AUTH_KEY \
  --metadata-from-file startup-script=$STARTUP_SCRIPT \
  --tags $TAGS
