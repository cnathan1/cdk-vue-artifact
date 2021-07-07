#!/usr/bin/env node
import {App} from '@aws-cdk/core';
import {CdkVueApplicationPipeline} from '../lib/cdk-vue-application-pipeline';

const app = new App();
new CdkVueApplicationPipeline(app, 'CdkVueApplicationPipelineStack', {
    env: {
        region: 'us-east-1'
    }
});
