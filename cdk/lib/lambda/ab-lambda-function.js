#!/usr/bin/env node
'use strict';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    // Output the request to CloudWatch
    console.log('Lambda@Edge Request: %j', request);
    const headers = request.headers;

    // Do not process if this is not targeting the distribution root file.
    if (request.uri.startsWith('/blue')) {
        console.log('Ignoring request with URI: %s', request.uri);
        callback(null, request);
        return;
    }

    // Name of cookie to check for. Application will be decided randomly when not present.
    const cookieExperimentA = 'X-Experiment-Name=A';
    const cookieExperimentB = 'X-Experiment-Name=B';

    // Check for cookie header to determine if experimental group has been previously selected
    let selectedExperiment;
    if (headers.cookie) {
        for (let i = 0; i < headers.cookie.length; i++) {
            if (headers.cookie[i].value.indexOf(cookieExperimentA) >= 0) {
                console.log('Experiment A cookie found');
                selectedExperiment = cookieExperimentA;
                break;
            } else if (headers.cookie[i].value.indexOf(cookieExperimentB) >= 0) {
                console.log('Experiment B cookie found');
                selectedExperiment = cookieExperimentB;
                break;
            }
        }
    } else {
        // When there is no cookie, then randomly decide which app version will be used.
        console.log('Experiment cookie has not been found. Throwing dice...');
        if (Math.random() < 0.75) {
            headers['set-cookie'] = [{key: 'set-cookie', value: cookieExperimentA}]
        } else {
            headers['set-cookie'] = [{key: 'set-cookie', value: cookieExperimentB}]
        }
    }

    if (selectedExperiment === cookieExperimentB) {
        //Generate HTTP redirect response to experimental group.
        console.log('Experimental group is selected: %s', selectedExperiment);
        request.status = '302';
        request.statusDescription = 'Found';
        headers['location'] = [{
            key: 'location',
            value: '/blue/index.html',
        }];
    }

    // Output the final request.
    console.log("Final response: %j", request);
    callback(null, request);
};