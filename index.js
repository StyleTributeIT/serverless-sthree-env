module.exports = class SthreeEnvPlugin {
    constructor(serverless, options){
        this._serverless = serverless;
        this._options = options;
        this.hooks = {
            'before:deploy:createDeploymentArtifacts':this.beforeDeployResource.bind(this)
        }
    }

    getSThreeBucket(bucketName, keyName, stage, region) {
        return this._serverless.getProvider(this._serverless.service.provider.name).request('S3', 'getObject', {
            Bucket: bucketName,
            Key: keyName,
        }, stage, region);
    }

    appendEnvironment(currData, data) {
        let obj = {};
        obj = JSON.parse(data);
        //do other stuff later on
        return Object.assign(obj, currData);
    }

    beforeDeployResource() {
        this._serverless.cli.log('SthreeEnvPlugin : ' + 'is running');
        let stage = (this._options.stage ? this._options.stage : this._serverless.service.provider.stage);
        let region = this._serverless.service.provider.region;
        let resourceName = this._serverless.service.service + '-config-' + stage;

        return this.getSThreeBucket(resourceName, 'config.json', stage, region).then(function(data, err){
            this._serverless.cli.log('SthreeEnvPlugin : getting config from bucket '+ resourceName);
            if (err) {
                this._serverless.cli.log('SthreeEnvPlugin : ' + err);
            }
            let body = data.Body;
            try {
                this._serverless.service.provider.environment = this.appendEnvironment(this._serverless.service.provider.environment, body);
                this._serverless.cli.log('SthreeEnvPlugin : env var contains '+ Object.keys(this._serverless.service.provider.environment));
            } catch(e) {
                this._serverless.cli.log('SthreeEnvPlugin : ' + e);
            }
            return true;
        }.bind(this));
    }
};