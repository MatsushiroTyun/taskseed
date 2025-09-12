import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

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

  const get = async (listKey: string) => {
    const Item = await ddbDocClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "listKey = :listKey",
        ExpressionAttributeValues: { ":listKey": listKey },
      })
    );
    return Item;
  };
  //ルーティング
  if (event.httpMethod === "GET" && event.pathParameters?.listKey) {
    // GET /orderList/{listKey}
    const listKey = event.pathParameters.listKey;
    const result = await get(listKey);
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(result.Items),
    };
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Bad Request" }),
    };
  }
};
