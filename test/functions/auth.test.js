var constants = require('./../../functions/constants');
require('mocha');
require('./../../functions/hydra')

var assert = require('assert');
describe('auth', function() {
    describe('request', function () {
        it('should make an ssl get request', function (done) {
            var request = require('request');
            request.get(
                {
                    url: constants.base_auth_url + '/health',
                    agentOptions: {
                        ca: constants.mycompany_public_cert
                    }
                },
                function (error, response, body) {
                    //console.log('done auth request:' + error)
                    if (!error && response.statusCode >= 200 && response.statusCode < 300) {
                        done()
                    }
                    else
                    {
                        done(error)
                    }
                })

        })
    })

    describe('post', function () {
        it('should make an ssl post request', function (done) {
            var request = require('request');
            request.post(
                {
                    url: constants.base_auth_url + '/oauth2/token',
                    agentOptions: {
                        ca: constants.mycompany_public_cert
                    },
                    auth: {
                        user: constants.system_client_id,
                        pass: constants.system_client_secret
                    },
                    form: {
                        grant_type: 'client_credentials',
                        scope: 'hydra hydra.clients'
                    }
                },
                function (error, response, body) {
                    if (!error && response.statusCode >= 200 && response.statusCode < 300) {
                        done();
                    }
                    else {
                        assert.fail(response.statusCode + ':' + response.body);
                        done();
                    }
                });

        })
    })
});