import { Router } from "express";
import { db, tableName } from "../data/db.js";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { generateToken } from "../auth/jwt.js";
import { hashPassword, comparePassword } from "../auth/hash.js";

import { z } from "zod";
import crypto from "crypto";

const router = Router();


// Zod validation schema
const authSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});


// POST /api/auth/register
// Create a new user + return JWT

router.post("/register", async (req, res) => {
  try {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => e.message);
      return res.status(400).send({ error: errors });
    }

    const { username, password } = parsed.data;

    // Check if user exists
    const existingUser = await db.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "Pk = :pk AND Sk = :sk",
        ExpressionAttributeValues: {
          ":pk": "user",
          ":sk": `user#${username}`,
        },
      })
    );

    if (existingUser.Items && existingUser.Items.length > 0) {
      return res.status(400).send({ error: "Username already exists" });
    }

    // Create new user
    const hashedPassword = await hashPassword(password);
    const id = crypto.randomUUID();

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
          lastActive: new Date().toISOString(),
        },
      })
    );

    // Generate JWT so user logs in immediately
    const token = generateToken(username);

    res.status(201).send({
      message: "User registered successfully",
      token,
      username,
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).send({ error: "Server error while registering user" });
  }
});


// POST /api/auth/login
// Validate user + generate JWT

router.post("/login", async (req, res) => {
  try {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => e.message);
      return res.status(400).send({ error: errors });
    }

    const { username, password } = parsed.data;

    // Find user
    const result = await db.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "Pk = :pk AND Sk = :sk",
        ExpressionAttributeValues: {
          ":pk": "user",
          ":sk": `user#${username}`,
        },
      })
    );

    const user = result.Items?.[0];
    if (!user) return res.status(401).send({ error: "User not found" });

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return res.status(401).send({ error: "Invalid password" });

    const token = generateToken(username);

    res.send({ message: "Login successful", token, username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({ error: "Server error while logging in" });
  }
});


// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).send({ error: "Username required" });

    res.send({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).send({ error: "Server error while logging out" });
  }
});

export default router;
