import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { POSTChildTaskItem, PUTChildTaskItem } from "../types/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.TABLE_NAME!;
  const client = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(client);

  const getList = async (parentId: string) => {
    const Items = await ddbDocClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI_ByParent",
        KeyConditionExpression: "parent = :parent",
        ExpressionAttributeValues: { ":parent": parentId },
      })
    );
    return Items;
  };

  const put = async (data: PUTChildTaskItem) => {
    const updatedAt = new Date().toISOString();
    const item = { ...data, updatedAt };
    await ddbDocClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );
    return item;
  };

  const post = async (data: POSTChildTaskItem) => {
    const id = randomUUID();
    const updatedAt = new Date().toISOString();
    const createdAt = updatedAt;
    const item = { id, ...data, createdAt, updatedAt };
    await ddbDocClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );
    return item;
  };
  const del = async (id: string) => {
    await ddbDocClient.send(
      new DeleteCommand({ TableName: tableName, Key: { id } })
    );
    return { id };
  };

  //ルーティング
  if (event.httpMethod === "GET" && event.queryStringParameters?.parentId) {
    // PUT /childTask?parentId={parentId}
    const parentId = event.queryStringParameters.parentId;
    const result = await getList(parentId);
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } else if (event.httpMethod === "PUT") {
    // PUT /childTask/{id}
    if (!event.pathParameters?.id) {
      return { statusCode: 400, body: "Invalid request: missing id parameter" };
    }
    if (!event.body) {
      return { statusCode: 400, body: "Invalid request: missing body" };
    }
    const data: PUTChildTaskItem = JSON.parse(event.body);
    const result = await put(data);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod === "POST") {
    // POST /childTask
    if (!event.body) {
      return { statusCode: 400, body: "Invalid request: missing body" };
    }
    const data: POSTChildTaskItem = JSON.parse(event.body);
    const result = await post(data);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod === "DELETE" && event.pathParameters?.id) {
    // DELETE /childTask/{id}
    const id = event.pathParameters.id;
    const result = await del(id);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } else {
    return { statusCode: 400, body: "Invalid request" };
  }
};
