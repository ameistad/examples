import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
import * as sst from "@serverless-stack/resources";

export default class MyStack extends sst.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { account, region } = sst.Stack.of(this);

    // Create Api
    const api = new sst.Api(this, "Api", {
      defaultAuthorizationType: "AWS_IAM",
      routes: {
        "GET /private": "src/private.main",
        "GET /public": {
          authorizationType: "NONE",
          function: "src/public.main",
        },
      },
    });

    // Create auth provider
    const auth = new sst.Auth(this, "Auth", {
      facebook: { appId: "419718329085014" },
    });

    // Allow authenticated users invoke API
    auth.attachPermissionsForAuthUsers([
      new iam.PolicyStatement({
        actions: ["execute-api:Invoke"],
        effect: iam.Effect.ALLOW,
        resources: [
          `arn:aws:execute-api:${region}:${account}:${api.httpApi.httpApiId}/*`,
        ],
      }),
    ]);

    // Show API endpoint in output
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: api.httpApi.apiEndpoint,
    });
    new cdk.CfnOutput(this, "IdentityPoolId", {
      value: auth.cognitoCfnIdentityPool.ref,
    });
  }
}
