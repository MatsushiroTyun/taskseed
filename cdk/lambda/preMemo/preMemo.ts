import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { POSTPreMemoItem, PUTPreMemoItem } from "../types/types";
import { randomUUID } from "crypto";

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

  const get = async (id: string) => {
    const Item = await ddbDocClient.send(
      new GetCommand({ TableName: tableName, Key: { id } })
    );
    return Item;
  };

  const put = async (data: PUTPreMemoItem) => {
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

  const post = async (data: POSTPreMemoItem) => {
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
    // GET /preMemo
    const result = await getList();
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } else if (event.httpMethod === "POST") {
    // POST /preMemo
    if (!event.body) {
      return { statusCode: 400, body: "Invalid request: no body" };
    }
    const data = JSON.parse(event.body) as POSTPreMemoItem;
    const result = await post(data);
    return {
      statusCode: 201,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod === "PUT") {
    // PUT /preMemo/{id}
    if (!event.pathParameters?.id) {
      return { statusCode: 400, body: "Invalid request: missing id parameter" };
    }
    if (!event.body) {
      return { statusCode: 400, body: "Invalid request: no body" };
    }
    const id = event.pathParameters.id;
    const data = JSON.parse(event.body) as PUTPreMemoItem;
    if (id !== data.id) {
      return { statusCode: 400, body: "Invalid request: id mismatch" };
    }
    const result = await put(data);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod === "DELETE" && event.pathParameters?.id) {
    // DELETE /preMemo/{id}
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
