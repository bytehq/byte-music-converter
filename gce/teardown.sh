#! /bin/bash

set -x

ZONE=us-central1-f
gcloud config set compute/zone $ZONE

APP_ID=byte-music-converter

GROUP=$APP_ID
TEMPLATE=$GROUP-tmpl
SERVICE=$APP_ID-service


gcloud compute forwarding-rules delete $SERVICE-http-rule --global

gcloud compute target-http-proxies delete $SERVICE-proxy

gcloud compute url-maps delete $SERVICE-map

gcloud compute backend-services delete $SERVICE

gcloud compute http-health-checks delete ah-health-check

gcloud compute instance-groups managed delete $GROUP

gcloud compute instance-templates delete $TEMPLATE
