#!/usr/bin/env node
'use strict';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    // Output the request to CloudWatch
    console.log('Lambda@Edge Request: %j', request);
    const headers = request.headers;
    const origin = request.origin;

    //Setup the two different origins
    const blueOrigin = request.origin.s3.customHeaders['blue-origin'][0].value;
    const greenOrigin = request.origin.s3.customHeaders['green-origin'][0].value;


    //Determine whether the user has visited before based on a cookie value
    //Grab the 'origin' cookie if it's been set before
    if (headers.cookie) {
        for (let i = 0; i < headers.cookie.length; i++) {
            if (headers.cookie[i].value.indexOf('origin=A') >= 0) {
                console.log('Origin A cookie found');
                headers['host'] = [{key: 'host', value: blueOrigin}];
                origin.s3.domainName = blueOrigin;
                break;
            } else if (headers.cookie[i].value.indexOf('origin=B') >= 0) {
                console.log('Origin B cookie found');
                headers['host'] = [{key: 'host', value: greenOrigin}];
                origin.s3.domainName = greenOrigin;
                break;
            }
        }
    } else {
        //New visitor so no cookie set, roll the dice weight to origin A
        //Could also just choose to return here rather than modifying the request
        if (Math.random() < 0.75) {
            headers['host'] = [{key: 'host', value: blueOrigin}];
            origin.s3.domainName = blueOrigin;
            console.log('Rolled the dice and origin A it is!');
        } else {
            headers['host'] = [{key: 'host', value: greenOrigin}];
            origin.s3.domainName = greenOrigin;
            console.log('Rolled the dice and origin B it is!');
        }
    }

    callback(null, request);
};