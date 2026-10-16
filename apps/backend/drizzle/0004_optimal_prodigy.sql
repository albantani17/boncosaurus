CREATE TYPE "public"."counterparty_kind" AS ENUM('person', 'institution');--> statement-breakpoint
CREATE TYPE "public"."debt_direction" AS ENUM('payable', 'receivable');--> statement-breakpoint
CREATE TYPE "public"."debt_origin" AS ENUM('cash', 'split', 'purchase');--> statement-breakpoint
CREATE TYPE "public"."debt_source_type" AS ENUM('personal', 'paylater', 'installment', 'credit_card', 'online_loan', 'bank_loan', 'other');--> statement-breakpoint
CREATE TYPE "public"."debt_status" AS ENUM('active', 'settled', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."debt_transaction_role" AS ENUM('principal', 'charge');--> statement-breakpoint
CREATE TABLE "counterparties" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "counterparty_kind" NOT NULL,
	"note" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "counterparties_workspace_id_unique" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"direction" "debt_direction" NOT NULL,
	"source_type" "debt_source_type" NOT NULL,
	"origin" "debt_origin" NOT NULL,
	"counterparty_id" uuid NOT NULL,
	"title" text NOT NULL,
	"currency" char(3) NOT NULL,
	"principal" bigint NOT NULL,
	"originated_at" timestamp with time zone NOT NULL,
	"due_date" date,
	"status" "debt_status" DEFAULT 'active' NOT NULL,
	"closed_at" timestamp with time zone,
	"written_off_amount" bigint,
	"note" text,
	"category_id" uuid,
	"disbursement_transaction_id" uuid,
	"origin_transaction_id" uuid,
	"created_by" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "debts_workspace_id_unique" UNIQUE("workspace_id","id"),
	CONSTRAINT "debts_principal_positive" CHECK ("debts"."principal" > 0),
	CONSTRAINT "debts_written_off_amount_positive" CHECK ("debts"."written_off_amount" IS NULL OR "debts"."written_off_amount" > 0),
	CONSTRAINT "debts_cash_shape" CHECK ("debts"."origin" <> 'cash' OR ("debts"."disbursement_transaction_id" IS NOT NULL AND "debts"."origin_transaction_id" IS NULL AND "debts"."category_id" IS NULL)),
	CONSTRAINT "debts_split_shape" CHECK ("debts"."origin" <> 'split' OR ("debts"."direction" = 'receivable' AND "debts"."origin_transaction_id" IS NOT NULL AND "debts"."disbursement_transaction_id" IS NULL AND "debts"."category_id" IS NULL)),
	CONSTRAINT "debts_purchase_shape" CHECK ("debts"."origin" <> 'purchase' OR ("debts"."direction" = 'payable' AND "debts"."category_id" IS NOT NULL AND "debts"."disbursement_transaction_id" IS NULL AND "debts"."origin_transaction_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "debt_installments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"debt_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"due_date" date NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "debt_installments_debt_sequence_unique" UNIQUE("debt_id","sequence"),
	CONSTRAINT "debt_installments_amount_positive" CHECK ("debt_installments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "debt_payments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"debt_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"amount" bigint NOT NULL,
	"principal_amount" bigint NOT NULL,
	"extra_amount" bigint NOT NULL,
	"repayment_transaction_id" uuid,
	"charge_transaction_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "debt_payments_amounts" CHECK ("debt_payments"."amount" > 0 AND "debt_payments"."principal_amount" >= 0 AND "debt_payments"."extra_amount" >= 0 AND "debt_payments"."amount" = "debt_payments"."principal_amount" + "debt_payments"."extra_amount"),
	CONSTRAINT "debt_payments_transactions" CHECK (("debt_payments"."principal_amount" = 0) = ("debt_payments"."repayment_transaction_id" IS NULL) AND ("debt_payments"."extra_amount" = 0) = ("debt_payments"."charge_transaction_id" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_workspace_id_unique" UNIQUE("workspace_id","id");--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "debt_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "debt_role" "debt_transaction_role";--> statement-breakpoint
ALTER TABLE "counterparties" ADD CONSTRAINT "counterparties_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_counterparty_fk" FOREIGN KEY ("workspace_id","counterparty_id") REFERENCES "public"."counterparties"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_category_fk" FOREIGN KEY ("workspace_id","category_id") REFERENCES "public"."categories"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_disbursement_transaction_fk" FOREIGN KEY ("workspace_id","disbursement_transaction_id") REFERENCES "public"."transactions"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_origin_transaction_fk" FOREIGN KEY ("workspace_id","origin_transaction_id") REFERENCES "public"."transactions"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_installments" ADD CONSTRAINT "debt_installments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_installments" ADD CONSTRAINT "debt_installments_debt_fk" FOREIGN KEY ("workspace_id","debt_id") REFERENCES "public"."debts"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debt_fk" FOREIGN KEY ("workspace_id","debt_id") REFERENCES "public"."debts"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_account_fk" FOREIGN KEY ("workspace_id","account_id") REFERENCES "public"."accounts"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_repayment_transaction_fk" FOREIGN KEY ("workspace_id","repayment_transaction_id") REFERENCES "public"."transactions"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_charge_transaction_fk" FOREIGN KEY ("workspace_id","charge_transaction_id") REFERENCES "public"."transactions"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "counterparties_workspace_name_unique" ON "counterparties" USING btree ("workspace_id",lower("name"));--> statement-breakpoint
CREATE INDEX "debts_workspace_status_idx" ON "debts" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "debts_counterparty_idx" ON "debts" USING btree ("counterparty_id");--> statement-breakpoint
CREATE INDEX "debts_origin_transaction_idx" ON "debts" USING btree ("origin_transaction_id");--> statement-breakpoint
CREATE INDEX "debt_payments_debt_idx" ON "debt_payments" USING btree ("debt_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_debt_fk" FOREIGN KEY ("workspace_id","debt_id") REFERENCES "public"."debts"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_debt_idx" ON "transactions" USING btree ("debt_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_debt_link" CHECK (("transactions"."debt_id" IS NULL) = ("transactions"."debt_role" IS NULL));--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_debt_principal_shape" CHECK ("transactions"."debt_role" IS DISTINCT FROM 'principal' OR ("transactions"."type" <> 'transfer' AND "transactions"."category_id" IS NULL));