import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const walletVerifyRequest = pgTable("wallet_verify_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code")
    .$default(() => Math.floor(100000 + Math.random() * 900000).toString())
    .unique(),
  expiredAt: timestamp("expired_at", { withTimezone: true })
    .notNull()
    .default(sql`now() + interval '10 minutes'`),

  worldUsername: text("world_username"),
  worldAddress: text("world_address"),

  chain: text("chain").notNull(),
  address: text("address").notNull(),
  signal: text("signal").notNull(),

  merkle_root: text("merkle_root"),
  nullifier_hash: text("nullifier_hash"),
  proof: text("proof"),
  verification_level: text("verification_level"),
  serverNonce: text("server_nonce"),
  serverDeadline: text("server_deadline"),
  serverSig: text("server_sig"),

  isVerified: boolean("is_verified").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});
