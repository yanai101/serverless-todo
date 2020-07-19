import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apiGw from "@aws-cdk/aws-apigateway";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as cf from "@aws-cdk/aws-cloudfront";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import { AuthorizationType } from "@aws-cdk/aws-apigateway";

interface EvnStackProps extends cdk.StackProps {
  prod: boolean;
}

export class TodoAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: EvnStackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    let tableName, lambdaConst, apiGetWayName, dynamoDbReadWrite, concurrency;
    if (props?.prod) {
      dynamoDbReadWrite = 200;
      concurrency = 100;
      tableName = "prod-cdk-todo";
      lambdaConst = { TABLE_NAME: tableName };
      apiGetWayName = "prod-api-gw";
    } else {
      dynamoDbReadWrite = 5;
      concurrency = 5;
      tableName = "staging-cdk-todo";
      lambdaConst = { TABLE_NAME: tableName };
      apiGetWayName = "staging-api-gw";
    }

    // --- lambda function ---
    // @ts-ignore
    const welcomeLambda = new lambda.Function(this, "helloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset("lambda"),
      environment: lambdaConst,
      handler: "hello.handler",
    });

    // api-gw
    //@ts-ignore
    const api = new apiGw.RestApi(this, apiGetWayName, {
      defaultCorsPreflightOptions: {
        allowOrigins: apiGw.Cors.ALL_ORIGINS,
        allowMethods: apiGw.Cors.ALL_METHODS,
      },
    });
    // getter lambda integration api gw
    const apiHelloInt = new apiGw.LambdaIntegration(welcomeLambda);
    const apiHello = api.root.addResource("hello");
    apiHello.addMethod("GET", apiHelloInt, {
      authorizationType: AuthorizationType.NONE,
    });

    //dynamodb
    //@ts-ignore
    const table = new dynamodb.Table(this, "todos", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: tableName,
      readCapacity: dynamoDbReadWrite,
      billingMode: dynamodb.BillingMode.PROVISIONED,
    });

    // s3 for site...
    //@ts-ignore
    const myBucket = new s3.Bucket(this, "todoApp", {
      versioned: false,
      bucketName: "todo-s3-sample",
      // encryption: BucketEncryption.KMS_MANAGED,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    });
    const deployment = new s3Deployment.BucketDeployment(
      //@ts-ignore
      this,
      "deployStaticWebsite",
      {
        sources: [s3Deployment.Source.asset("./webSite/my-project/dist")],
        destinationBucket: myBucket,
      }
    );

    //CF
    const distribution = new cf.CloudFrontWebDistribution(
      // @ts-ignore
      this,
      "CfToDoDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: myBucket,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );

    // --- todo CRUD lambdas ---
    //@ts-ignore
    const readLambda = new lambda.Function(this, "ReadHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("lambda"),
      environment: lambdaConst,
      reservedConcurrentExecutions: concurrency,
      handler: "readTodos.handler",
    });

    // user read lambda integration
    const apiGetInteg = new apiGw.LambdaIntegration(readLambda);
    const todosApi = api.root.addResource("todos");
    todosApi.addMethod("GET", apiGetInteg);

    // --- table permissions ---
    table.grantReadData(readLambda);

    //@ts-ignore
    const getTodoLambda = new lambda.Function(this, "GetTodoHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("lambda"),
      environment: lambdaConst,
      reservedConcurrentExecutions: concurrency,
      handler: "getTodo.handler",
    });

    // user read lambda integration
    const getTodoLambdaAPi = new apiGw.LambdaIntegration(getTodoLambda);
    const todoApi = todosApi.addResource("{id}");
    todoApi.addMethod("GET", getTodoLambdaAPi);
    todoApi.addMethod("DELETE");

    // --- table permissions ---
    table.grantReadData(getTodoLambda);
  }
}
