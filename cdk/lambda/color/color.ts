import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { POSTColorItem, PUTColorItem } from "../types/types";

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

  const put = async (data: PUTColorItem) => {
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
  const post = async (data: POSTColorItem) => {
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
    // GET /color
    const result = await getList();
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(result.Items),
    };
  } else if (event.httpMethod === "PUT") {
    // PUT /color
    if (!event.pathParameters?.id) {
      return { statusCode: 400, body: "Invalid request: no id in path" };
    }
    if (!event.body) {
      return { statusCode: 400, body: "Invalid request: no body" };
    }
    const id = event.pathParameters.id;
    const data: PUTColorItem = JSON.parse(event.body);
    if (id !== data.id) {
      return {
        statusCode: 400,
        body: "Invalid request: id in body does not match id in path",
      };
    }
    const result = await put(data);
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod === "POST") {
    // POST /color
    if (!event.body) {
      return { statusCode: 400, body: "Invalid request: no body" };
    }
    const data = JSON.parse(event.body) as POSTColorItem;
    const result = await post(data);
    return {
      statusCode: 201,
      headers: headers,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod === "DELETE") {
    // DELETE /color/{id}
    if (!event.pathParameters?.id) {
      return { statusCode: 400, body: "Invalid request: no id in path" };
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
