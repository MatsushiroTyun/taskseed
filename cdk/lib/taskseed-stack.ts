import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";

export class TaskseedStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //s3リソースの定義
    const destinationBucket = new s3.Bucket(this, "FrontendBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //CloudFrontディストリビューションの定義
    const distribution = new cloudfront.Distribution(
      this,
      "WebsiteDistribution",
      {
        defaultRootObject: "index.html",
        defaultBehavior: {
          origin:
            origins.S3BucketOrigin.withOriginAccessControl(destinationBucket),
        },
      }
    );

    //S3デプロイの定義
    const siteAssetPath = path.resolve(
      __dirname,
      "..",
      "..",
      "frontend",
      "out"
    );
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [s3deploy.Source.asset(siteAssetPath)],
      destinationBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    //DynamoDBリソースの定義
    const preMemoTable = new dynamodb.Table(this, "preMemo", {
      tableName: "preMemo",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskTable = new dynamodb.Table(this, "task", {
      tableName: "task",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    taskTable.addGlobalSecondaryIndex({
      indexName: "GSI_ByMemo",
      partitionKey: {
        name: "memo",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "createdAt",
        type: dynamodb.AttributeType.STRING,
      },
    });

    const childTaskTable = new dynamodb.Table(this, "childTask", {
      tableName: "childTask",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    childTaskTable.addGlobalSecondaryIndex({
      indexName: "GSI_ByParent",
      partitionKey: {
        name: "parent",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "createdAt",
        type: dynamodb.AttributeType.STRING,
      },
    });

    const orderListTable = new dynamodb.Table(this, "orderList", {
      tableName: "orderList",
      partitionKey: {
        name: "listKey",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const tagTable = new dynamodb.Table(this, "tag", {
      tableName: "tag",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const colorTable = new dynamodb.Table(this, "color", {
      tableName: "color",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambdaリソースの定義
    const preMemoFunction = new lambda.Function(this, "PreMemoFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda/preMemo"),
      handler: "preMemo.handler",
      environment: {
        TABLE_NAME: preMemoTable.tableName,
      },
    });
    preMemoTable.grantReadWriteData(preMemoFunction);

    const taskFunction = new lambda.Function(this, "TaskFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "task.handler",
      environment: {
        TABLE_NAME: taskTable.tableName,
        CHILD_TABLE_NAME: childTaskTable.tableName,
        ORDER_TABLE_NAME: orderListTable.tableName,
      },
    });
    taskTable.grantReadWriteData(taskFunction);
    orderListTable.grantReadWriteData(taskFunction);

    const childTaskFunction = new lambda.Function(this, "ChildTaskFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "childTask.handler",
      environment: {
        TABLE_NAME: childTaskTable.tableName,
        ORDER_TABLE_NAME: orderListTable.tableName,
      },
    });
    childTaskTable.grantReadWriteData(childTaskFunction);
    orderListTable.grantReadWriteData(childTaskFunction);

    const orderListFunction = new lambda.Function(this, "OrderListFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "orderList.handler",
      environment: {
        TABLE_NAME: orderListTable.tableName,
      },
    });
    orderListTable.grantReadWriteData(orderListFunction);

    const tagFunction = new lambda.Function(this, "TagFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "tag.handler",
      environment: {
        TABLE_NAME: tagTable.tableName,
      },
    });
    tagTable.grantReadWriteData(tagFunction);

    const colorFunction = new lambda.Function(this, "ColorFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "color.handler",
      environment: {
        TABLE_NAME: colorTable.tableName,
      },
    });
    colorTable.grantReadWriteData(colorFunction);

    // API Gatewayリソースの定義
    const api = new apigateway.RestApi(this, "TaskseedApi", {
      restApiName: "Taskseed Service",
      description: "This service serves taskseed.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // /preMemoエンドポイントの定義
    const preMemoResource = api.root.addResource("preMemo");
    const preMemoById = preMemoResource.addResource("{id}");
    preMemoResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(preMemoFunction)
    );
    preMemoResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(preMemoFunction)
    );
    preMemoById.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(preMemoFunction)
    );
    preMemoById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(preMemoFunction)
    );

    // /taskエンドポイントの定義
    const taskResource = api.root.addResource("task");
    const taskById = taskResource.addResource("{id}");

    taskResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(taskFunction)
    );
    taskResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(taskFunction)
    );
    taskById.addMethod("PUT", new apigateway.LambdaIntegration(taskFunction));
    taskById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(taskFunction)
    );

    // /childTaskエンドポイントの定義
    const childTaskResource = api.root.addResource("childTask");
    const childTaskById = childTaskResource.addResource("{id}");
    childTaskResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(childTaskFunction)
    );
    childTaskResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(childTaskFunction)
    );
    childTaskById.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(childTaskFunction)
    );
    childTaskById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(childTaskFunction)
    );

    // /orderListエンドポイントの定義
    const orderListResource = api.root.addResource("orderList");
    const orderListById = orderListResource.addResource("{listKey}");
    orderListById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(orderListFunction)
    );

    // /tagエンドポイントの定義
    const tagResource = api.root.addResource("tag");
    const tagById = tagResource.addResource("{id}");
    tagResource.addMethod("GET", new apigateway.LambdaIntegration(tagFunction));
    tagResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(tagFunction)
    );
    tagById.addMethod("PUT", new apigateway.LambdaIntegration(tagFunction));
    tagById.addMethod("DELETE", new apigateway.LambdaIntegration(tagFunction));

    // /colorエンドポイントの定義
    const colorResource = api.root.addResource("color");
    const colorById = colorResource.addResource("{id}");
    colorResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(colorFunction)
    );
    colorResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(colorFunction)
    );
    colorById.addMethod("PUT", new apigateway.LambdaIntegration(colorFunction));
    colorById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(colorFunction)
    );

    // Outputs
    new cdk.CfnOutput(this, "SiteURL", {
      value: `https://${distribution.domainName}`,
      description: "CloudFront URL for the frontend",
    });
    new cdk.CfnOutput(this, "ApiBaseUrl", {
      value: api.url,
      description: "Invoke URL for API Gateway",
    });
  }
}
