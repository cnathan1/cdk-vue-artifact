#!/usr/bin/env node
'use strict';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    // Output the request to CloudWatch
    console.log('Lambda@Edge Request: %j', request);
    const headers = request.headers;

    // Do not process when already targeting group B.
    if (request.uri.startsWith('/blue')) {
        console.log('Ignoring request with URI: %s', request.uri);
        callback(null, request);
        return;
    }

    // Name of cookie to check for. Application will be decided randomly when not present.
    const cookieExperimentA = 'X-Experiment-Name=A';
    const cookieExperimentB = 'X-Experiment-Name=B';

    // Check for cookie header to determine if experimental group has been previously selected
    let selectedExperiment = cookieExperimentA;
    if (headers.cookie) {
        for (let i = 0; i < headers.cookie.length; i++) {
            if (headers.cookie[i].value.indexOf(cookieExperimentA) >= 0) {
                console.log('Experiment A cookie found');
                break;
            } else if (headers.cookie[i].value.indexOf(cookieExperimentB) >= 0) {
                console.log('Experiment B cookie found');
                selectedExperiment = cookieExperimentB;
                //Generate HTTP redirect response to experimental group.
                console.log('Experimental group is selected: %s', selectedExperiment);
                const response = {
                    headers: {
                        'location': [{
                            key: 'Location',
                            value: '/blue/index.html'
                        }],
                        'set-cookie': [{
                            key: 'Set-Cookie',
                            value: selectedExperiment
                        }]
                    },
                    status: '302',
                    statusDescription: 'Found'
                };
                callback(null, response);
            }
        }
    } else {
        // When there is no cookie, then randomly decide which app version will be used.
        console.log('Experiment cookie has not been found. Throwing dice...');
        if (Math.random() < 0.75) {
            selectedExperiment = cookieExperimentA;
            //Generate HTTP redirect response to experimental group B.
            console.log('Experimental group is selected: %s', selectedExperiment);
            const response = {
                headers: {
                    'location': [{
                        key: 'Location',
                        value: '/index.html'
                    }],
                    'set-cookie': [{
                        key: 'Set-Cookie',
                        value: selectedExperiment
                    }]
                },
                status: '302',
                statusDescription: 'Found'
            };
            callback(null, response);
        } else {
            selectedExperiment = cookieExperimentB;
        }
    }

    if (selectedExperiment === cookieExperimentB) {
        //Generate HTTP redirect response to experimental group B.
        console.log('Experimental group is selected: %s', selectedExperiment);
        const response = {
            headers: {
                'location': [{
                    key: 'Location',
                    value: '/blue/index.html'
                }],
                'set-cookie': [{
                    key: 'Set-Cookie',
                    value: selectedExperiment
                }]
            },
            status: '302',
            statusDescription: 'Found'
        };
        callback(null, response);
    }

    // Response for group A
    console.log("Final response: %j", request);
    callback(null, request);
};