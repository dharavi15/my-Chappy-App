import express from "express";
import crypto from "crypto";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, tableName } from "../data/db.js";
import { authenticateToken, optionalAuth } from "../auth/authMiddleware.js";
import type { AuthenticatedRequest } from "../auth/authMiddleware.js";
import { z } from "zod";

const router = express.Router();

// Zod schema for messages

const messageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});


// GET /api/messages/:channelName
// guest → can only read open channels
// user  → can read all channels

router.get(
  "/:channelName",
  optionalAuth,
  async (req: AuthenticatedRequest, res: express.Response) => {
    const { channelName } = req.params;

    try {
      const channelResult = await db.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "Pk = :pk AND Sk = :sk",
          ExpressionAttributeValues: {
            ":pk": "channel",
            ":sk": `channel#${channelName}`,
          },
        })
      );

      const channel = channelResult.Items?.[0];

      if (!channel) {
        return res.status(404).send({ error: "Channel not found" });
      }

      if (channel.locked === true && !req.user) {
        return res
          .status(403)
          .send({ error: "Login required for locked channels" });
      }

      const messagesResult = await db.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "Pk = :pk",
          ExpressionAttributeValues: {
            ":pk": `channel#${channelName}`,
          },
        })
      );

      res.status(200).send(messagesResult.Items || []);
    } catch (err) {
      console.error("Error loading messages:", err);
      res.status(500).send({ error: "Server error while loading messages" });
    }
  }
);

// POST /api/messages/:channelName
// guest → can post ONLY in unlocked channels
// user  → can post in all

router.post(
  "/:channelName",
  optionalAuth,
  async (req: AuthenticatedRequest, res: express.Response) => {
    const { channelName } = req.params;

    try {
      const content = req.body.content || req.body.text;

      const parsed = messageSchema.safeParse({ content });
      if (!parsed.success) {
        const errors = parsed.error.issues.map((e) => e.message);
        return res.status(400).send({ error: errors });
      }

      const author = req.user ? req.user.username : "Guest";

      const channelResult = await db.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "Pk = :pk AND Sk = :sk",
          ExpressionAttributeValues: {
            ":pk": "channel",
            ":sk": `channel#${channelName}`,
          },
        })
      );

      const channel = channelResult.Items?.[0];

      if (channel?.locked === true && !req.user) {
        return res.status(403).send({
          error: "Login required to post in locked channels",
        });
      }

      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const messageItem = {
        id,
        Pk: `channel#${channelName}`,
        Sk: `message#${timestamp}`,
        content,
        sender: author,
        from: author,
        createdAt: timestamp,
      };

      await db.send(new PutCommand({ TableName: tableName, Item: messageItem }));

      res.status(201).send({
        message: "Message sent successfully",
        messageItem,
      });
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).send({ error: "Server error while sending message" });
    }
  }
);

// GET /api/messages
// Logged-in users → see ALL messages

router.get("/", authenticateToken, async (_req: AuthenticatedRequest, res: express.Response) => {
  try {
    const result = await db.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "begins_with(Pk, :pk)",
        ExpressionAttributeValues: { ":pk": "channel#" },
      })
    );

    res.send(result.Items || []);
  } catch (err) {
    console.error("Error fetching all messages:", err);
    res.status(500).send({ error: "Server error while fetching all messages" });
  }
});

export default router;
