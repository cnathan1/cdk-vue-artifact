#!/usr/bin/env node
'use strict';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    // Output the request to CloudWatch
    console.log('Lambda@Edge Request: %j', request);
    const headers = request.headers;
    const origin = request.origin;

    //Setup the two different origins
    const originA = process.env.BLUE_ORIGIN;
    const originB = process.env.GREEN_ORIGIN;


    //Determine whether the user has visited before based on a cookie value
    //Grab the 'origin' cookie if it's been set before
    if (headers.cookie) {
        for (let i = 0; i < headers.cookie.length; i++) {
            if (headers.cookie[i].value.indexOf('origin=A') >= 0) {
                console.log('Origin A cookie found');
                headers['host'] = [{key: 'host', value: originA}];
                origin.s3.domainName = originA;
                break;
            } else if (headers.cookie[i].value.indexOf('origin=B') >= 0) {
                console.log('Origin B cookie found');
                headers['host'] = [{key: 'host', value: originB}];
                origin.s3.domainName = originB;
                break;
            }
        }
    } else {
        //New visitor so no cookie set, roll the dice weight to origin A
        //Could also just choose to return here rather than modifying the request
        if (Math.random() < 0.75) {
            headers['host'] = [{key: 'host', value: originA}];
            origin.s3.domainName = originA;
            console.log('Rolled the dice and origin A it is!');
        } else {
            headers['host'] = [{key: 'host', value: originB}];
            origin.s3.domainName = originB;
            console.log('Rolled the dice and origin B it is!');
        }
    }

    callback(null, request);
};