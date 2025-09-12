import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { POSTTagItem, PUTTagItem } from "../types/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
};

const headers = {
  "Content-Type": "application/json",
  ...corsHeaders,
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.TABLE_NAME!;
  const client = new DynamoDBClient({});
  const ddbDocClient = DynamoDBDocumentClient.from(client);

  const getList = async () => {
    const Items = await ddbDocClient.send(
      new ScanCommand({ TableName: tableName })
    );
    return Items;
  };
  const put = async (data: PUTTagItem) => {
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

  const post = async (data: POSTTagItem) => {
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
  if (event.httpMethod === "GET") {
    // GET /tag
    const result = await getList();
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(result.Items),
    };
  } else if (event.httpMethod === "POST") {
    // POST /tag
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Bad Request: Missing body" }),
      };
    }
    const data: POSTTagItem = JSON.parse(event.body);
    const result = await post(data);
    return {
      statusCode: 201,
      headers: headers,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod === "PUT") {
    // PUT /tag/{id}
    if (!event.pathParameters?.id) {
      return { statusCode: 400, body: "Invalid request: missing id parameter" };
    }
    if (!event.body) {
      return { statusCode: 400, body: "Invalid request: missing body" };
    }
    const data: PUTTagItem = JSON.parse(event.body);
    const result = await put(data);
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod === "DELETE") {
    // DELETE /tag/{id}
    if (!event.pathParameters?.id) {
      return { statusCode: 400, body: "Invalid request: missing id parameter" };
    }
    const id = event.pathParameters.id;
    const result = await del(id);
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(result),
    };
  } else {
    return { statusCode: 400, body: "Invalid request" };
  }
};
