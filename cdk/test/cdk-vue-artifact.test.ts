import {expect, haveResource} from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkVueArtifact from '../lib/cdk-vue-artifact-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CdkVueArtifact.CdkVueArtifactStack(app, 'MyTestStack', {
        env: {
            account: 'test',
            region: 'us-east-1'
        }
    });
    expect(stack).to(haveResource('AWS::CodePipeline::Pipeline'))
});
