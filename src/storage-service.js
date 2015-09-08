"use strict";

var storage = gcloud.storage(config.gcloud);
var bucket = storage.bucket(config.cloudStorageBucket);
var bucketUpload = Promise.promisify(bucket.upload, bucket);


var uploadFile = function* (location) {
    yield bucketUpload(location);
};

var getPublicUrl = function (filename) {
    return 'https://' + config.cloudStorageBucket + '.storage.googleapis.com/' + filename;
};

module.exports = {
    uploadFile: uploadFile,
    getPublicUrl: getPublicUrl
};
