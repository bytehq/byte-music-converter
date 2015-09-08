#! /bin/bash

set -ex

ZONE=us-central1-f

APP_ID=byte-music-converter

GROUP=$APP_ID
TEMPLATE=$GROUP-tmpl
MACHINE_TYPE=g1-small
STARTUP_SCRIPT=startup-script.sh
SCOPES="userinfo-email,\
logging-write,\
storage-full,\
datastore,\
https://www.googleapis.com/auth/pubsub,\
https://www.googleapis.com/auth/projecthosting"
TAGS=http-server

NUM_INSTANCES=1

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
  --metadata DEPLOY_KEY=$DEPLOY_KEY,\
  API_AUTH_KEY=$BYTE_MUSIC_CONVERTER_AUTH_KEY \
  --metadata-from-file startup-script=$STARTUP_SCRIPT \
  --tags $TAGS

# Create the managed instance group.

gcloud compute instance-groups managed \
  create $GROUP \
  --base-instance-name $GROUP \
  --size $NUM_INSTANCES \
  --template $TEMPLATE \
  --zone $ZONE

gcloud compute instance-groups managed set-named-ports \
  $GROUP \
  --named-port http:3000 \
  --zone $ZONE


#
# Load Balancer Setup
#

# A complete HTTP load balancer is structured as follows:
#
# 1) A global forwarding rule directs incoming requests to a target HTTP proxy.
# 2) The target HTTP proxy checks each request against a URL map to determine the
#    appropriate backend service for the request.
# 3) The backend service directs each request to an appropriate backend based on
#    serving capacity, zone, and instance health of its attached backends. The
#    health of each backend instance is verified using either a health check.
#
# We'll create these resources in reverse order:
# service, health check, backend service, url map, proxy.

# Create a health check
# The load balancer will use this check to keep track of which instances to send traffic to.
# Note that health checks will not cause the load balancer to shutdown any instances.

gcloud compute http-health-checks create ah-health-check \
  --request-path /_ah/health

# Create a backend service, associate it with the health check and instance group.
# The backend service serves as a target for load balancing.
gcloud compute backend-services create $SERVICE \
  --http-health-check ah-health-check

gcloud compute backend-services add-backend $SERVICE \
  --instance-group $GROUP \
  --zone $ZONE

# Create a URL map and web Proxy. The URL map will send all requests to the
# backend service defined above.
gcloud compute url-maps create $SERVICE-map \
  --default-service $SERVICE

gcloud compute target-http-proxies create $SERVICE-proxy \
  --url-map $SERVICE-map

# Create a global forwarding rule to send all traffic to our proxy
gcloud compute forwarding-rules create $SERVICE-http-rule \
  --global \
  --target-http-proxy $SERVICE-proxy \
  --port-range 80
