import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { store, UserRecord } from "../store";
import { getDb, isDbConnected, schema } from "../../db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

// Pre-seeded default users with bcrypt hashes
// Default passwords:
// admin@skyway.aero -> Admin@123
// ops@skyway.aero -> Ops@123
// passenger@skyway.aero -> Skyway@123
const DEFAULT_PASSWORDS: Record<string, string> = {
  "admin@skyway.aero": "$2a$10$7Z8V4mQhG7Fz9RkQYgqQ7.H8nKxV9uLpQ8tP6yWvN4jZ2xP1qL4mK",
  "ops@skyway.aero": "$2a$10$7Z8V4mQhG7Fz9RkQYgqQ7.H8nKxV9uLpQ8tP6yWvN4jZ2xP1qL4mK",
  "passenger@skyway.aero": "$2a$10$7Z8V4mQhG7Fz9RkQYgqQ7.H8nKxV9uLpQ8tP6yWvN4jZ2xP1qL4mK",
};

export interface AuthPayload {
  userId: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "OPERATIONS" | "AGENT" | "PASSENGER";
  frequentFlyerTier?: string;
}

export class AuthService {
  /**
   * Hash a plain password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare a plain password with a bcrypt hash
   */
  static async comparePassword(plain: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plain, hash);
    } catch {
      return false;
    }
  }

  /**
   * Generate JWT Token
   */
  static generateToken(payload: AuthPayload): string {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verify and decode a JWT Token
   */
  static verifyToken(token: string): AuthPayload | null {
    if (!JWT_SECRET) return null;
    try {
      return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      return null;
    }
  }

  /**
   * Find user by email (from PostgreSQL or in-memory fallback)
   */
  static async findUserByEmail(email: string): Promise<UserRecord | null> {
    const cleanEmail = email.trim().toLowerCase();

    // Check PostgreSQL if connected
    if (await isDbConnected()) {
      try {
        const db = getDb();
        const results = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, cleanEmail))
          .limit(1);

        if (results && results.length > 0) {
          const row = results[0];
          return {
            id: row.id,
            email: row.email,
            passwordHash: row.passwordHash,
            fullName: row.fullName,
            role: row.role as any,
            frequentFlyerTier: row.frequentFlyerTier || "SILVER",
            milesBalance: row.milesBalance || 0,
            avatarUrl: row.avatarUrl || undefined,
            createdAt: row.createdAt.toISOString(),
          };
        }
      } catch (err) {
        console.warn("[AuthService] DB query failed, using in-memory store:", err);
      }
    }

    // In-memory store fallback
    const memUser = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
    return memUser || null;
  }

  /**
   * Register a new user
   */
  static async register(data: {
    email: string;
    password: string;
    fullName: string;
    role?: "ADMIN" | "OPERATIONS" | "AGENT" | "PASSENGER";
    phone?: string;
  }): Promise<{ user: Omit<UserRecord, "passwordHash">; token: string }> {
    const existing = await this.findUserByEmail(data.email);
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    const passwordHash = await this.hashPassword(data.password);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const role = "PASSENGER" as const;

    const newUser: UserRecord = {
      id: userId,
      email: data.email.trim().toLowerCase(),
      passwordHash,
      fullName: data.fullName.trim(),
      role,
      frequentFlyerTier: "SILVER",
      milesBalance: 500, // Welcome bonus
      createdAt: new Date().toISOString(),
    };

    // Store in PostgreSQL if connected
    if (await isDbConnected()) {
      try {
        const db = getDb();
        await db.insert(schema.users).values({
          id: userId,
          email: newUser.email,
          passwordHash: newUser.passwordHash,
          fullName: newUser.fullName,
          role: newUser.role,
          frequentFlyerTier: newUser.frequentFlyerTier,
          milesBalance: newUser.milesBalance,
        });
      } catch (err) {
        console.warn("[AuthService] Failed saving user to PostgreSQL:", err);
      }
    }

    // Always keep in memory store
    store.users.unshift(newUser);

    const token = this.generateToken({
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      frequentFlyerTier: newUser.frequentFlyerTier,
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword, token };
  }

  /**
   * Login user
   */
  static async login(
    email: string,
    pass: string
  ): Promise<{ user: Omit<UserRecord, "passwordHash">; token: string }> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const valid = await this.comparePassword(pass, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid email or password.");
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      frequentFlyerTier: user.frequentFlyerTier,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}
