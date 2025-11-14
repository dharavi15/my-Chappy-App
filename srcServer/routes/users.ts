import { Router } from "express";
import { db, tableName } from "../data/db.js";
import { ScanCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { generateToken } from "../auth/jwt.js";
import { hashPassword } from "../auth/hash.js";
import { authenticateToken, optionalAuth } from "../auth/authMiddleware.js";
import type { AuthenticatedRequest } from "../auth/authMiddleware.js";

import { z } from "zod";
import crypto from "crypto";



const router = Router();


// Zod validation schema
const userSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});


// GET /api/users
// Return list of usernames (for DMList)
router.get("/", async (_req, res) => {
  try {
    const result = await db.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "Pk = :pk",
        ExpressionAttributeValues: { ":pk": "user" },
      })
    );

    const users = result.Items?.map((u: any) => ({
      username: u.username, // do NOT return passwordHash
    }));

    res.send(users || []);
  } catch (err) {
    console.error("Error loading users:", err);
    res.status(500).send({ error: "Server error while loading users" });
  }
});


// POST /api/users/status
// Update online/offline status
router.post("/status", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { online } = req.body as { online: boolean };
    const username = req.user.username;

    await db.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { Pk: "user", Sk: `user#${username}` },
        UpdateExpression: "SET online = :online",
        ExpressionAttributeValues: { ":online": online },
      })
    );

    res.send({ message: "Status updated" });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).send({ error: "Server error while updating status" });
  }
});


// POST /api/users/register
// Create a new user
router.post("/register", async (req, res) => {
  try {
    // Validate with Zod
    const parsed = userSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => e.message);
      return res.status(400).send({ error: errors });
    }

    const { username, password } = parsed.data;
    const hashedPassword = await hashPassword(password);
    const id = crypto.randomUUID();

    // Save user to DynamoDB
    await db.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          Pk: "user",
          Sk: `user#${username}`,
          id,
          username,
          passwordHash: hashedPassword,
          online: false,
        },
      })
    );

    res.status(201).send({ message: "User registered successfully", username });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).send({ error: "Server error while registering user" });
  }
});

export default router;
