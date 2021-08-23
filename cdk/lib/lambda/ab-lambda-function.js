#!/usr/bin/env node
'use strict';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    // Output the request to CloudWatch
    console.log('Lambda@Edge Request: %j', request);
    const headers = request.headers;
    const origin = request.origin;

    //Setup the two different origins
    const blueOrigin = origin.s3.domainName.replace('green', 'blue');
    const greenOrigin = origin.s3.domainName;


    //Determine whether the user has visited before based on a cookie value
    //Grab the 'origin' cookie if it's been set before
    if (headers.cookie) {
        for (let i = 0; i < headers.cookie.length; i++) {
            if (headers.cookie[i].value.indexOf('origin=BLUE') >= 0) {
                console.log('Blue origin cookie found');
                headers['host'] = [{key: 'host', value: blueOrigin}];
                origin.s3.domainName = blueOrigin;
                headers.cookie['origin'] = 'origin=BLUE';
                break;
            } else if (headers.cookie[i].value.indexOf('origin=GREEN') >= 0) {
                console.log('Green origin cookie found');
                headers['host'] = [{key: 'host', value: greenOrigin}];
                origin.s3.domainName = greenOrigin;
                headers.cookie['origin'] = 'origin=GREEN';
                break;
            }
        }
    } else {
        //New visitor so no cookie set, roll the dice weight to origin A
        //Could also just choose to return here rather than modifying the request
        if (Math.random() > 0.75) {
            headers['host'] = [{key: 'host', value: blueOrigin}];
            origin.s3.domainName = blueOrigin;
            headers.cookie = [{key: 'origin', value: 'origin=BLUE'}];
            console.log('Rolled the dice and the blue origin was selected!');
        } else {
            headers['host'] = [{key: 'host', value: greenOrigin}];
            origin.s3.domainName = greenOrigin;
            headers.cookie = [{key: 'origin', value: 'origin=GREEN'}];
            console.log('Rolled the dice and the green origin was selected!');
        }
    }

    callback(null, request);
};