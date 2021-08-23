#!/usr/bin/env node
'use strict';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    // Output the request to CloudWatch
    console.log('Lambda@Edge Request: %j', request);
    const headers = request.headers;

    // Do not process if this is not targeting the distribution root file.
    if (request.uri !== "/" && request.uri !== "/index.html") {
        console.log('Ignoring request with URI: %s', request.uri);
        callback(null, request);
        return;
    }

    // Name of cookie to check for. Application will be decided randomly when not present.
    const cookieExperimentA = 'X-Experiment-Name=A';
    const cookieExperimentB = 'X-Experiment-Name=B';
    // Primary application version.
    const pathExperimentA = '/index.html';
    // Experimental application version.
    const pathExperimentB = '/blue/index.html';

    /*
     * Lambda at the Edge headers are array objects.
     *
     * Client may send multiple Cookie headers, i.e.:
     * > GET /viewerRes/test HTTP/1.1
     * > User-Agent: curl/7.18.1 (x86_64-unknown-linux-gnu) libcurl/7.18.1 OpenSSL/1.0.1u zlib/1.2.3
     * > Cookie: First=1; Second=2
     * > Cookie: ClientCode=abc
     * > Host: example.com
     *
     * You can access the first Cookie header at headers["cookie"][0].value
     * and the second at headers["cookie"][1].value.
     *
     * Header values are not parsed. In the example above,
     * headers["cookie"][0].value is equal to "First=1; Second=2"
     */
    let experimentUri;
    if (headers.cookie) {
        for (let i = 0; i < headers.cookie.length; i++) {
            if (headers.cookie[i].value.indexOf(cookieExperimentA) >= 0) {
                console.log('Experiment A cookie found');
                experimentUri = pathExperimentA;
                break;
            } else if (headers.cookie[i].value.indexOf(cookieExperimentB) >= 0) {
                console.log('Experiment B cookie found');
                experimentUri = pathExperimentB;
                break;
            }
        }
    } else {
        // When there is no cookie, then randomly decide which app version will be used.
        if (!experimentUri) {
            console.log('Experiment cookie has not been found. Throwing dice...');
            if (Math.random() < 0.75) {
                experimentUri = pathExperimentA;
                headers.cookie = [{key: 'cookie', value: cookieExperimentA}]
            } else {
                experimentUri = pathExperimentB;
                headers.cookie = [{key: 'cookie', value: cookieExperimentB}]
            }
        }
    }

    if (experimentUri === pathExperimentB) {
        //Generate HTTP redirect response to experimental group.
        request.status = '301';
        request.statusDescription = 'Moved Permanently';
        headers['location'] = [{
            key: 'Location',
            value: pathExperimentB,
        }];
        headers['cache-control'] = [{
            key: 'Cache-Control',
            value: "max-age=3600"
        }];
    }

    // Output the final request URI.
    console.log(`Request uri set to "${experimentUri}"`);
    console.log("Final response: %j", request);
    callback(null, request);
};