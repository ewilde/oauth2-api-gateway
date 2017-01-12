process.on('uncaughtException', function (err) {
    console.log('uncaughtException:', (err instanceof Error) && err.stack || err);
});

var HydraClient = require('./hydra');
var client = new HydraClient();

const generatePolicy = (principalId, effect, resource) => {
    const authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        const policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        const statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    return authResponse;
};

module.exports.auth = (event, context) => {
    client.validateTokenAsync({
        'access_token': event.authorizationToken
    }, function (result) {
        if (result == null) {
            console.log(event.authorizationToken + ': did not get a result back from token validation');
            context.fail('Error: Invalid token');
        } else if (!result.active) {
            console.log(event.authorizationToken + ': token no longer active');
            context.fail('Unauthorized');
        } else {
            console.log(event.authorizationToken + ': token is active will allow.');
            console.log('principle: ' + result.client_id + ' methodArm: ' + event.methodArn);
            var policy = generatePolicy('user|' + result.client_id, 'allow', event.methodArn);
            console.log('policy: ' + JSON.stringify(policy));
            context.succeed(policy);
        }
    });
};