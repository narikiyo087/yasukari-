import { GetCommand } from "@aws-sdk/lib-dynamodb";

import { getDocumentClient } from "./dynamodb";

const USER_TABLE = process.env.USER_TABLE ?? "yasukariUserMain";

export async function fetchMemberEmail(userId: string): Promise<string | null> {
  if (!userId.trim()) return null;

  try {
    const client = getDocumentClient();
    const response = await client.send(
      new GetCommand({
        TableName: USER_TABLE,
        Key: { user_id: userId },
        ProjectionExpression: "email",
      })
    );

    const email = response.Item?.email;
    return typeof email === "string" && email.includes("@") ? email : null;
  } catch (error) {
    console.error("[memberContact] Failed to fetch member email", { userId, error });
    return null;
  }
}
