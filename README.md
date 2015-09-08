# byte-music-converter

Convert Byte music to MIDI, WAV, or MP3.

<a href="https://clyp.it/u40dl3tr">Here's what it sounds like.</a>


## Status

Works well, but needs cleanup. Here's what's remaining:

- Allow command line import of any Byte post or Byte music object
- Add command line arg for loop count
- Error handling
- Tests


## Setup

Byte Music Converter requires <a href="http://www.fluidsynth.org">FluidSynth</a> (with libsndfile) and <a href="http://lame.sourceforge.net">LAME</a>.

```
$ brew install fluid-synth --with-libsndfile
$ brew install lame
```

Then, to run:

```
$ npm install
$ npm run
```


## Tests

To run tests:

```
$ npm test
```


## Shipping Code
Make sure you run `npm start` before committing any code. If jshint shows any errors, you must clean these up before shipping your code. You must also have a clean test run (`npm test`).


## Infrastructure
Infrastructure can be viewed under Compute->Compute Engine->Instance Groups on the developer console.

`byte-music-converter` is the main cluster of VMs. This is manually scaled, and more VM instances can be added at Compute->Compute Engine->Instance Groups->byte-music-converter->Edit Group->Number of Instances.

This infrastructure was built up using the script `./gce/deploy.sh`. This probably won't ever need to be run again, but it's a good resource for inspecting how the infrastructure is arranged.

Occasionally, changes need to be made to the VM instances (i.e. adding a new library using `apt-get`). To make these changes, you need to modify `./gce/startup-script.sh`. Read this carefully and make any desired changes. To deploy these changes, you need to create a new version of the instance template (managed by `./gce/add-new-instance-template.sh`). To do this:

* Set the environment variable `$DEPLOY_KEY` (or CI will fail)
* Manually set the `TEMPLATE` name at `add-new-instance-template.sh:10` (using the current date is a good pattern)
* Set the current project name: `gcloud --project byte-music-converter`
* Run the script: `./add-new-instance-template.sh`
* Edit the Instance Group to use the new template at Compute->Compute Engine->Instance Groups->byte-music-converter->Edit Group->Instance Template

Any new VM instances will now be built using this new instance template. Minor changes (i.e. package installs) can be applied by simply restart the VM instances one at a time (making sure enough instances are alive to handle the current load). More significant changes will require a re–creation, using the following as a template:
`gcloud preview --project "byte-music-converter" managed-instance-groups --zone "us-central1-c" recreate-instances "byte-music-converter" --instance "byte-music-converter-9xnn"

## Deployment
Deployment is handled by CircleCI. On a successful build, the deployment endpoints are fired (from `circle.yml`):

```yaml
deployment:
  production:
    branch: master
    commands:
      - curl -X GET -H "Accept:application/json" -H "Authorization: Bearer $DEPLOY_KEY" http://146.148.37.66:3000/_ah/deploy
      - curl -X GET -H "Accept:application/json" -H "Authorization: Bearer $DEPLOY_KEY" http://104.154.51.185:3000/_ah/deploy
```

This list is currently manually managed. When adding new instances, a new line must be added here for CI to continue working. This should eventually be modified to automatically pull the list of instances using `gcloud`.

DEPLOY_KEY and API_ACCESS_KEY can be found in the team 1Password vault.

Troubleshooting:

* Is `$DEPLOY_KEY` set on CircleCI?
* Does each VM instance have the `DEPLOY_KEY` set as metadata? (Compute->Compute Engine->Instance Groups->byte-music-converter-><instance name>->Custom Metadata)
* Is the instance missing from the deployment list in `circle.yml`?
* Does triggering a manual deploy on each instance get things back to normal?


## Manual Deployment
To manually deploy code changes on a box, select the byte-music-converter instance group and click SSH on the desired instance. Then run the following:

```
cd /opt/app
sudo ./git-deploy
sudo supervisorctl restart nodeapp
```
