require('mocha');
var HydraClient = require('./../../functions/hydra')

var assert = require('assert');
describe('hydra client', function() {
    var client = new HydraClient();
    var newClient = null;
    var clientToken = null;
    describe('generateSystemTokenAsync', function() {
        it('should retrieve a system token', function(done) {
            client.generateSystemTokenAsync(function () {
                assert.notEqual(client.systemToken, null, 'no token returned');
                assert.ok(client.systemToken.access_token.length > 0, 'token length not greater than 0.');
                done()
            });
        });
    });

    describe('createClientAsync', function () {
        it('should create a client', function (done) {
            client.createClientAsync('F3C1001', 'Test User', function (result) {
                assert.notEqual(result, null, "client null");
                newClient = result;
                done();
            })
        })
    });

    describe('createClientTokenAsync', function () {
        it('should create a token', function (done) {
            client.createClientTokenAsync(newClient, function (result) {
                clientToken = result;
                assert.notEqual(result.access_token, null, 'client token not generated');
                done();
            });
        });

        it('should append an absolute expires date', function () {
            assert.notEqual(clientToken.expires_absolute, null);
            assert.ok(clientToken.expires_absolute > new Date());
        })
    });

    describe('validateToken', function () {
       it('should return true for a valid token', function (done) {
           assert.notEqual(clientToken, null, 'client token need to be already setup before running this test.');
           client.validateTokenAsync(clientToken, function (result) {
               assert.ok(result.active, 'token not valid but should be.');
               done();
           });
       });

       it('should return true for a valid token that includes bearer sufflix', function (done) {
           assert.notEqual(clientToken, null, 'client token need to be already setup before running this test.');
           var tokenWithBearer = { access_token : 'bearer ' + clientToken.access_token};
           client.validateTokenAsync(tokenWithBearer, function (result) {
               assert.ok(result.active, 'token not valid but should be.');
               done();
           });
       });



       it('should return true for a valid token, and renew system token when expired', function (done) {
           var expiredSystemToken = client.getSystemToken();
           expiredSystemToken.expires_absolute = new Date(); // expire the token
           client.setSystemToken(expiredSystemToken);

           client.validateTokenAsync(clientToken, function (result) {
               assert.notEqual(result, null, 'token was null and not valid')
               assert.ok(result.active, 'token not active but should be.');
               done();
           });
       })
    });

    describe('expired', function () {
       it ('should return true for expired tokens', function () {
           var expired = new Date();
           expired.setSeconds(expired.getSeconds() - 60);
           client.setSystemToken({
               "expires_absolute" : expired
           });

           assert.ok(client.expired(client.getSystemToken()), "Token is expired, but hydra client not correctly recognising this.")
       });

       it ('should return false for token that have not expired', function () {
           var expired = new Date();
           expired.setSeconds(expired.getSeconds() + 60);
           client.setSystemToken({
               "expires_absolute" : expired
           });

           assert.ok(!client.expired(client.getSystemToken()), "Token is expired, but hydra client not correctly recognising this.")
       });

       it ('should return true for a null token', function () {
           assert.ok(client.expired(null));
       })
    });
});