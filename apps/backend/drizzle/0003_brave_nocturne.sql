ALTER TABLE "transactions" ADD COLUMN "fee" bigint;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fee_positive" CHECK ("transactions"."fee" IS NULL OR "transactions"."fee" > 0);--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fee_transfer_only" CHECK ("transactions"."type" = 'transfer' OR "transactions"."fee" IS NULL);