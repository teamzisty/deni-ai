

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "system_instruction" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "instructions" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" "text",
    "messages" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "bot" "jsonb",
    "parentSessionId" "text",
    "branchName" "text",
    "hub_id" "text"
);


ALTER TABLE "public"."chat_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hubs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "files" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hubs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intellipulse_action_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "key_value" character varying(255) NOT NULL,
    "is_active" boolean DEFAULT true,
    "usage_count" integer DEFAULT 0,
    "expires_at" timestamp with time zone,
    "last_used_at" timestamp with time zone,
    "last_validated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."intellipulse_action_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intellipulse_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" "text",
    "messages" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."intellipulse_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shared_conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "session_id" "uuid",
    "session_type" "text",
    "title" "text",
    "messages" "jsonb" DEFAULT '[]'::"jsonb",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "shared_conversations_session_type_check" CHECK (("session_type" = ANY (ARRAY['chat'::"text", 'intellipulse'::"text"])))
);


ALTER TABLE "public"."shared_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "settings" "text" NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_streams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "chat_id" "text" NOT NULL,
    "stream_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_streams" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bots"
    ADD CONSTRAINT "bots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_streams"
    ADD CONSTRAINT "chat_streams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_streams"
    ADD CONSTRAINT "chat_streams_stream_id_key" UNIQUE ("stream_id");



ALTER TABLE ONLY "public"."hubs"
    ADD CONSTRAINT "hubs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intellipulse_action_keys"
    ADD CONSTRAINT "intellipulse_action_keys_key_value_key" UNIQUE ("key_value");



ALTER TABLE ONLY "public"."intellipulse_action_keys"
    ADD CONSTRAINT "intellipulse_action_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intellipulse_sessions"
    ADD CONSTRAINT "intellipulse_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shared_conversations"
    ADD CONSTRAINT "shared_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_setting_key_key" UNIQUE ("user_id", "settings");



CREATE INDEX "idx_bots_user_id" ON "public"."bots" USING "btree" ("user_id");



CREATE INDEX "idx_chat_sessions_created_at" ON "public"."chat_sessions" USING "btree" ("created_at");



CREATE INDEX "idx_chat_sessions_user_id" ON "public"."chat_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_hubs_user_id" ON "public"."hubs" USING "btree" ("user_id");



CREATE INDEX "idx_intellipulse_action_keys_is_active" ON "public"."intellipulse_action_keys" USING "btree" ("is_active");



CREATE INDEX "idx_intellipulse_action_keys_key_value" ON "public"."intellipulse_action_keys" USING "btree" ("key_value");



CREATE INDEX "idx_intellipulse_action_keys_user_id" ON "public"."intellipulse_action_keys" USING "btree" ("user_id");



CREATE INDEX "idx_intellipulse_sessions_created_at" ON "public"."intellipulse_sessions" USING "btree" ("created_at");



CREATE INDEX "idx_intellipulse_sessions_user_id" ON "public"."intellipulse_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_shared_conversations_expires_at" ON "public"."shared_conversations" USING "btree" ("expires_at");



CREATE INDEX "idx_shared_conversations_user_id" ON "public"."shared_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_user_settings_user_id" ON "public"."user_settings" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_bots_updated_at" BEFORE UPDATE ON "public"."bots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chat_sessions_updated_at" BEFORE UPDATE ON "public"."chat_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_hubs_updated_at" BEFORE UPDATE ON "public"."hubs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_intellipulse_action_keys_updated_at" BEFORE UPDATE ON "public"."intellipulse_action_keys" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_intellipulse_sessions_updated_at" BEFORE UPDATE ON "public"."intellipulse_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."bots"
    ADD CONSTRAINT "bots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hubs"
    ADD CONSTRAINT "hubs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intellipulse_action_keys"
    ADD CONSTRAINT "intellipulse_action_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intellipulse_sessions"
    ADD CONSTRAINT "intellipulse_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_conversations"
    ADD CONSTRAINT "shared_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view non-expired shared conversations" ON "public"."shared_conversations" FOR SELECT USING ((("expires_at" IS NULL) OR ("expires_at" > "now"())));



CREATE POLICY "Users can delete own bots" ON "public"."bots" FOR DELETE USING (( SELECT ("auth"."uid"() = "bots"."user_id")));



CREATE POLICY "Users can delete own chat sessions" ON "public"."chat_sessions" FOR DELETE USING (( SELECT ("auth"."uid"() = "chat_sessions"."user_id")));



CREATE POLICY "Users can delete own hubs" ON "public"."hubs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own intellipulse sessions" ON "public"."intellipulse_sessions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own settings" ON "public"."user_settings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own shared conversations" ON "public"."shared_conversations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own action keys" ON "public"."intellipulse_action_keys" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own bots" ON "public"."bots" FOR INSERT WITH CHECK (( SELECT ("auth"."uid"() = "bots"."user_id")));



CREATE POLICY "Users can insert own chat sessions" ON "public"."chat_sessions" FOR INSERT WITH CHECK (( SELECT ("auth"."uid"() = "chat_sessions"."user_id")));



CREATE POLICY "Users can insert own hubs" ON "public"."hubs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own intellipulse sessions" ON "public"."intellipulse_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own settings" ON "public"."user_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own shared conversations" ON "public"."shared_conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own action keys" ON "public"."intellipulse_action_keys" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own bots" ON "public"."bots" FOR UPDATE USING (( SELECT ("auth"."uid"() = "bots"."user_id")));



CREATE POLICY "Users can update own chat sessions" ON "public"."chat_sessions" FOR UPDATE USING (( SELECT ("auth"."uid"() = "chat_sessions"."user_id")));



CREATE POLICY "Users can update own hubs" ON "public"."hubs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own intellipulse sessions" ON "public"."intellipulse_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own settings" ON "public"."user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own shared conversations" ON "public"."shared_conversations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own action keys" ON "public"."intellipulse_action_keys" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own chat sessions" ON "public"."chat_sessions" FOR SELECT USING (( SELECT ("auth"."uid"() = "chat_sessions"."user_id")));



CREATE POLICY "Users can view own hubs" ON "public"."hubs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own intellipulse sessions" ON "public"."intellipulse_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own settings" ON "public"."user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own action keys" ON "public"."intellipulse_action_keys" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."bots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hubs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intellipulse_action_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intellipulse_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shared_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."bots" TO "anon";
GRANT ALL ON TABLE "public"."bots" TO "authenticated";
GRANT ALL ON TABLE "public"."bots" TO "service_role";



GRANT ALL ON TABLE "public"."chat_sessions" TO "anon";
GRANT ALL ON TABLE "public"."chat_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."hubs" TO "anon";
GRANT ALL ON TABLE "public"."hubs" TO "authenticated";
GRANT ALL ON TABLE "public"."hubs" TO "service_role";



GRANT ALL ON TABLE "public"."intellipulse_action_keys" TO "anon";
GRANT ALL ON TABLE "public"."intellipulse_action_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."intellipulse_action_keys" TO "service_role";



GRANT ALL ON TABLE "public"."intellipulse_sessions" TO "anon";
GRANT ALL ON TABLE "public"."intellipulse_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."intellipulse_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."shared_conversations" TO "anon";
GRANT ALL ON TABLE "public"."shared_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."shared_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























--
-- Indexes for chat_streams table for better performance
--

CREATE INDEX IF NOT EXISTS "idx_chat_streams_chat_id" ON "public"."chat_streams" USING "btree" ("chat_id");

CREATE INDEX IF NOT EXISTS "idx_chat_streams_created_at" ON "public"."chat_streams" USING "btree" ("created_at");


RESET ALL;
