var constants = require('./constants');

function HydraClient() {
    this.systemToken = null;
}

HydraClient.prototype.expired = function (token) {
    if (!token) {
        console.log('token expired');
        return true;
    }

    var currentDate = new Date();
    return token.expires_absolute <= currentDate;
}

HydraClient.prototype.getSystemToken = function () {
    return this.systemToken;
}

HydraClient.prototype.setSystemToken = function (token) {
    this.systemToken = token;
}

HydraClient.prototype.generateSystemTokenAsync = function (callback) {
    try {
        console.log('generating system token');
        var request = require('request');
        var that = this;
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
                    var token = JSON.parse(body);
                    var expires_date = new Date();
                    expires_date.setSeconds(expires_date.getSeconds() + Number(token.expires_in));
                    Object.defineProperty(token, "expires_absolute", {value : expires_date,
                        writable : true,
                        enumerable : true,
                        configurable : true});
                    that.setSystemToken(token);
                    console.log('system token acquired');
                }
                else {
                    console.log(body);
                }

                callback();
            });
    } catch (error) {
        console.log(error)
    }
}

/*
curl -k -X POST -H 'Authorization: bearer fIyy-W3j2cmNSP40GK9HmQ9wlmhzFpdcxia64JHN3po.ww3Ob46pPaj1tz_XfXG80BAnLy5XbwuLqSjmwnqh6Ks' \
    -d '{"id":"F3C1001","client_name":"Test User","grant_types":["client_credentials"],"response_types":["code"],"public":false}' \
    https://localhost:4444/clients

Returns

 {
     "id": "F3C1001",
     "client_name": "Test User",
     "client_secret": "(SDk!*ximQS*",
     "redirect_uris": null,
     "grant_types": [
     "client_credentials"
     ],
     "response_types": [
     "code"
     ],
     "scope": "",
     "owner": "",
     "policy_uri": "",
     "tos_uri": "",
     "client_uri": "",
     "logo_uri": "",
     "contacts": null,
     "public": false
 }
 */
HydraClient.prototype.createClientAsync = function (clientId, clientName, callback) {
    try {
        var request = require('request');
        request.post(
            {
                url: constants.base_auth_url + '/clients',
                agentOptions: {
                    ca: constants.mycompany_public_cert
                },
                headers: {
                    'Authorization' : 'bearer ' + this.getSystemToken().access_token
                },
                json: true,
                body: {
                    "id": clientId,
                    "client_name": clientName,
                    "grant_types":["client_credentials"],
                    "response_types":["code"],
                    "public":false
                },
            },
            function (error, response, body) {
                if (!error && response.statusCode >= 200 && response.statusCode < 300) {
                    callback(body);
                }
                else {
                    console.log(body);
                    callback(null);
                }
            });
    } catch (error) {
        return false;
    }
};

/*
* curl -k -X POST -H 'Authorization: bearer fIyy-W3j2cmNSP40GK9HmQ9wlmhzFpdcxia64JHN3po.ww3Ob46pPaj1tz_XfXG80BAnLy5XbwuLqSjmwnqh6Ks' \
*     https://localhost:4444/oauth2/introspect -d 'token=1z4Bb_r8lgmUKaD1FyOgP0tBJ_UIafhX2-QyIvUgLN8.NHdZ3zm4Ly6mepP7flGJQMN6-YfKox3OyPPZiiMg-mk'
*
* Returns:
* result: {"active":true,"client_id":"F3C1001","sub":"F3C1001","exp":1482739092,"iat":1482735492,"aud":"F3C1001"}
 * */
HydraClient.prototype.validateTokenAsync = function (token, callback) {
    if (this.expired(token)) {
        callback(null);
        return;
    }

    if (this.expired(this.systemToken)) {
        console.log('System token expired or null');
        var that = this;
        this.generateSystemTokenAsync(function () {
            validateToken(that.systemToken, token, callback);
        });
        return;
    }

    validateToken(this.systemToken, token, callback);
};

function validateToken(systemToken, clientToken, callback) {
    var tokenParsed = clientToken.access_token.replace('bearer ', '');
    console.log('Validating client token:' + tokenParsed);

    var request = require('request');
    request.post(
        {
            url: constants.base_auth_url + '/oauth2/introspect',
            agentOptions: {
                ca: constants.mycompany_public_cert
            },
            headers: {
                'Authorization' : 'bearer ' + systemToken.access_token
            },
            form: {
                token: tokenParsed
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode >= 200 && response.statusCode < 300) {
                var result = JSON.parse(body);
                callback(result);
            }
            else {
                console.log(response);
                console.log(body);
                console.log(error);
                callback(null);
            }
        });
}

/*
 curl -k -X POST -d grant_type=client_credentials -u 'F3C1001:(SDk!*ximQS*' https://localhost:4444/oauth2/token

 Returns:
 {
 "access_token": "1z4Bb_r8lgmUKaD1FyOgP0tBJ_UIafhX2-QyIvUgLN8.NHdZ3zm4Ly6mepP7flGJQMN6-YfKox3OyPPZiiMg-mk",
 "expires_in": 3599,
 "expires_absolute":"2016-12-26T08:05:22.509Z",
 "scope": "",
 "token_type": "bearer"
 }
  */
HydraClient.prototype.createClientTokenAsync = function (clientDetails, callback) {
  if (!clientDetails.id) {
      throw new Error({'PropertyMissing':'clientDetails.id is required'});
  }

  if (!clientDetails.client_secret) {
      throw new Error({'PropertyMissing':'clientDetails.client_secret is required'});
  }
    var request = require('request');
    request.post(
        {
            url: constants.base_auth_url + '/oauth2/token',
            agentOptions: {
                ca: constants.mycompany_public_cert
            },
            auth: {
                user: clientDetails.id,
                pass: clientDetails.client_secret
            },
            form: {
                grant_type: 'client_credentials'
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode >= 200 && response.statusCode < 300) {
                var token = JSON.parse(body);
                var expires_date = new Date();
                expires_date.setSeconds(expires_date.getSeconds() + Number(token.expires_in));
                Object.defineProperty(token, "expires_absolute", {value : expires_date,
                    writable : true,
                    enumerable : true,
                    configurable : true});
                callback(token);
            }
            else {
                console.log(body);
                callback(null);
            }
        });
};

module.exports = HydraClient;