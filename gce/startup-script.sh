#! /bin/bash

# Talk to the metadata server to get the project id
PROJECTID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" -H "Metadata-Flavor: Google")

# Install logging monitor and configure it to pickup application logs
curl -s "https://storage.googleapis.com/signals-agents/logging/google-fluentd-install.sh" | bash

# Fluent-plugin-google-cloud has a fix that hasn't been rolled into the full google-fluentd
# https://github.com/GoogleCloudPlatform/fluent-plugin-google-cloud/pull/20
/usr/sbin/google-fluentd-gem update fluent-plugin-google-cloud

cat >/etc/google-fluentd/config.d/nodeapp.conf << EOF
<source>
  type tail
  format json
  path /opt/app/logs/request.log
  pos_file /var/tmp/fluentd.nodeapp-request.pos
  tag nodeapp-request
</source>

<source>
  type tail
  format json
  path /opt/app/logs/error.log
  pos_file /var/tmp/fluentd.nodeapp-error.pos
  tag nodeapp-error
</source>

<source>
  type tail
  format json
  path /opt/app/logs/general.log
  pos_file /var/tmp/fluentd.nodeapp-general.pos
  tag nodeapp-general
</source>
EOF

service google-fluentd restart &
# [END logging]

# Add nodejs repository (NodeSource)
curl -sL https://deb.nodesource.com/setup_dev | bash -

# Install dependencies from apt
apt-get install -y git nodejs build-essential supervisor tig lame fluidsynth

# Install Datadog agents
DD_API_KEY=7c4ac41f8a83e4841a988805b94b86a9 bash -c "$(curl -L https://raw.githubusercontent.com/DataDog/dd-agent/master/packaging/datadog-agent/source/install_agent.sh)"

# Get the source code
git config --global credential.helper gcloud.sh
git clone https://source.developers.google.com/p/$PROJECTID -b master /opt/app

# Install app dependencies
cd /opt/app
npm install

# Create a nodeapp user. The application will run as this user.
useradd -m -d /home/nodeapp nodeapp
chown -R nodeapp:nodeapp /opt/app

# Configure supervisor to run the node app.
cat >/etc/supervisor/conf.d/node-app.conf << EOF
[program:nodeapp]
directory=/opt/app
command=npm start
autostart=true
autorestart=true
user=nodeapp
environment=HOME="/home/nodeapp",USER="nodeapp",NODE_ENV="production"
EOF

supervisorctl reread
supervisorctl update

# Application should now be running under supervisor
