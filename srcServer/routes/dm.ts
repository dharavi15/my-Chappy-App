import { Router } from "express";
import { db, tableName } from "../data/db.js";
import { generateToken } from "../auth/jwt.js";
import { hashPassword } from "../auth/hash.js";
import { authenticateToken } from "../auth/authMiddleware.js";
import type { AuthenticatedRequest } from "../auth/authMiddleware.js";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

// Zod schema for sending DMs

const dmSchema = z.object({
  toUser: z.string().min(1, "Recipient username is required"),
  text: z.string().min(1, "Message text cannot be empty"),
});


// GET /api/dm/:username
// Fetch all DMs between logged-in user and selected user

router.get("/:username", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userA = req.user.username.toLowerCase();
    const userB = req.params.username.toLowerCase();

    // Shared sorted partition key
    const users = [userA, userB].sort();
    const dmKey = `dm#${users[0]}#${users[1]}`;

    const result = await db.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "Pk = :pk",
        ExpressionAttributeValues: { ":pk": dmKey },
        ScanIndexForward: true, // oldest → newest
      })
    );

    res.send(result.Items || []);
  } catch (err) {
    console.error("Error fetching DM conversation:", err);
    res.status(500).send({ error: "Server error while fetching DMs" });
  }
});


// POST /api/dm
// Send a new DM between two users
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = dmSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => e.message);
      return res.status(400).send({ error: errors });
    }

    const fromUser = req.user.username.toLowerCase();
    const toUser = parsed.data.toUser.toLowerCase();
    const text = parsed.data.text;

    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();

    // Shared DM thread key
    const users = [fromUser, toUser].sort();
    const dmKey = `dm#${users[0]}#${users[1]}`;

    const newMessage = {
      id,
      Pk: dmKey,
      Sk: `message#${timestamp}`,
      from: fromUser,
      to: toUser,
      text,
      createdAt: timestamp,
    };

    await db.send(
      new PutCommand({ TableName: tableName, Item: newMessage })
    );

    res.status(201).send(newMessage);
  } catch (err) {
    console.error("Error sending DM:", err);
    res.status(500).send({ error: "Server error while sending DM" });
  }
});

export default router;
