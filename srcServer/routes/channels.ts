import { Router } from "express";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, tableName } from "../data/db.js";
import { authenticateToken, optionalAuth } from "../auth/authMiddleware.js";
import type { AuthenticatedRequest } from "../auth/authMiddleware.ts";

import { z } from "zod";
import crypto from "crypto";

const router = Router();

// Zod schema for creating channels
const channelSchema = z.object({
  name: z.string().min(2, "Channel name must be at least 2 characters"),
  locked: z.boolean().optional(), // true = locked channel
});



// GET /api/channels
// Guests → only open channels
// Users → ALL channels
router.get("/", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await db.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "Pk = :pk",
        ExpressionAttributeValues: { ":pk": "channel" },
      })
    );

    const allChannels = result.Items || [];

    // Guest → only unlocked channels
    if (!req.user) {
      const open = allChannels.filter((ch: any) => ch.locked !== true);
      return res.send(open);
    }

    // Logged-in users → ALL channels (open + locked)
    return res.send(allChannels);

  } catch (err) {
    console.error("Error fetching channels:", err);
    res.status(500).send({ error: "Server error while fetching channels" });
  }
});



// GET /api/channels/all
// Users only
router.get("/all", authenticateToken, async (_req: AuthenticatedRequest, res) => {
  try {
    const result = await db.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "Pk = :pk",
        ExpressionAttributeValues: { ":pk": "channel" },
      })
    );

    res.send(result.Items || []);
  } catch (err) {
    console.error("Error fetching all channels:", err);
    res.status(500).send({ error: "Server error while fetching all channels" });
  }
});


// POST /api/channels
// Create a new channel
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = channelSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => e.message);
      return res.status(400).send({ error: errors });
    }

    const { name, locked } = parsed.data;
    const id = crypto.randomUUID();

    await db.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          Pk: "channel",
          Sk: `channel#${name}`,
          id,
          name,
          locked: locked || false, // default open channel
        },
      })
    );

    res.status(201).send({ message: "Channel created successfully" });
  } catch (err) {
    console.error("Error creating channel:", err);
    res.status(500).send({ error: "Server error while creating channel" });
  }
});

export default router;
