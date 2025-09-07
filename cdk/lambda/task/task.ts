import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { POSTTaskItem, PUTTaskItem } from "../types/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.TABLE_NAME!;
  const client = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(client);

  const getList = async (memoId: string) => {
    const Item = await ddbDocClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI_ByMemo",
        KeyConditionExpression: "memo = :memo",
        ExpressionAttributeValues: { ":memo": memoId },
      })
    );
    return Item;
  };
  const put = async (data: PUTTaskItem) => {
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
  const post = async (data: POSTTaskItem) => {
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
  if (event.httpMethod === "GET" && event.queryStringParameters?.memoId) {
    // GET /task?memoId={memoId}
    const memoId = event.queryStringParameters.memoId;
    const result = await getList(memoId);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod === "POST") {
    // POST /task
    if (!event.body) {
      return { statusCode: 400, body: "Invalid request: missing body" };
    }
    const data: POSTTaskItem = JSON.parse(event.body);
    const result = await post(data);
    return {
      statusCode: 201,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod === "PUT") {
    // PUT /task/{id}
    if (!event.pathParameters?.id) {
      return { statusCode: 400, body: "Invalid request: missing id parameter" };
    }
    if (!event.body) {
      return { statusCode: 400, body: "Invalid request: missing body" };
    }
    const id = event.pathParameters.id;
    const data = JSON.parse(event.body) as PUTTaskItem;
    if (id !== data.id) {
      return {
        statusCode: 400,
        body: "Invalid request: id in body does not match id in path",
      };
    }
    const result = await put(data);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod === "DELETE" && event.pathParameters?.id) {
    // DELETE /task/{id}
    const id = event.pathParameters.id;
    const result = await del(id);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } else {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
};
