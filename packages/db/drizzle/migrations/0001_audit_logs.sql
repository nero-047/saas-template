CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid,
	"user_id" uuid,
	"action" varchar(150) NOT NULL,
	"resource_type" varchar(150) NOT NULL,
	"resource_id" varchar(255),
	"request_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_organization_fk" FOREIGN KEY ("workspace_id","organization_id") REFERENCES "public"."workspaces"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_organization_created_at_idx" ON "audit_logs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_organization_workspace_created_at_idx" ON "audit_logs" USING btree ("organization_id","workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_organization_action_created_at_idx" ON "audit_logs" USING btree ("organization_id","action","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_organization_resource_idx" ON "audit_logs" USING btree ("organization_id","resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_created_at_idx" ON "audit_logs" USING btree ("user_id","created_at");