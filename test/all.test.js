const Serverless = require('serverless');

const AwsProvider = require('serverless/lib/plugins/aws/provider/awsProvider');

const SthreeEnv = require('../index.js');
const AWS = require('aws-sdk');
AWS.config.update({region: 'ap-southeast-1'});

const TESTNAME = 'st-testing';
const BUCKETNAME = TESTNAME + '-config-dev';

var s3 = new AWS.S3();

beforeEach(function (done) {
    s3.createBucket({
        Bucket: BUCKETNAME
    }, function(err, data) {
        if (err) {
            throw 'error';
        } else {
            s3.putObject({
                Bucket: BUCKETNAME,
                Body: JSON.stringify({
                    "TESTING": 1
                }),
                Key: "config.json"
            }, function(err) {
                if (err){
                    throw 'error';
                } else {
                    done();
                }
            })
        }
    });
});

afterEach(async function(done){
   s3.deleteObject({
       Bucket: BUCKETNAME,
       Key: "config.json"
   }, function(err){
        if (err){
            throw 'error';
        } else {
            s3.deleteBucket({Bucket: BUCKETNAME}, function (err) {
                if (err){
                    throw 'error';
                } else {
                    done();
                }
            });
        }
    });
});

test ('should be able to create env from the given bucket', async function() {
    let serverless = new Serverless();
    let sthreeEnv;

    serverless.service.provider.stage = 'dev';
    serverless.service.provider.region = 'ap-southeast-1';
    serverless.service.service = TESTNAME;
    serverless.service.provider.environment = {
        'previous': 2
    };
    serverless.cli = new serverless.classes.CLI(serverless);

    serverless.service.provider.name = "aws";
    serverless.providers.aws = new AwsProvider(serverless, {
        'stage': 'dev',
        'region': 'ap-southeast-1',
        'profile': 'default'
    });

    sthreeEnv = new SthreeEnv(serverless, {
        'stage': 'dev',
        'region': 'ap-southeast-1'
    });

    await sthreeEnv.beforeDeployResource();

    expect(serverless.service.provider.environment).toEqual({
        'previous': 2,
        'TESTING': 1
    });
});