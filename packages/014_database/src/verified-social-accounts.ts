import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const verifiedSocialAccounts = pgTable(
  "verified_social_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    address: text("address").notNull(), // world user address

    social: text("social").notNull(), // x, facebook, etc
    username: text("username").notNull(), // social username @etogigi
    name: text("name").notNull(), // social name John Doe
    sub: text("sub").notNull(), // social sub 1234567890

    merkle_root: text("merkle_root"),
    nullifier_hash: text("nullifier_hash"),
    proof: text("proof"),
    verification_level: text("verification_level"),

    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    unique("social_sub_unique").on(table.address, table.social, table.sub),
  ]
);
