#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { CdkVueArtifactStack } from '../lib/cdk-vue-artifact-stack';

const app = new cdk.App();
new CdkVueArtifactStack(app, 'CdkVueArtifactStack', {
    env: {
        region: 'us-east-1'
    }
});
