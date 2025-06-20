create sequence "public"."user_settings_id_seq";

create table "public"."bots" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "name" text not null,
    "description" text,
    "system_instruction" text,
    "created_at" timestamp with time zone default now(),
    "instructions" jsonb,
    "updated_at" timestamp with time zone default now()
);


alter table "public"."bots" enable row level security;

create table "public"."chat_sessions" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "title" text,
    "messages" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "bot" jsonb,
    "parentSessionId" text,
    "branchName" text,
    "hub_id" text
);


alter table "public"."chat_sessions" enable row level security;

create table "public"."hubs" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "name" text not null,
    "description" text,
    "files" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."hubs" enable row level security;

create table "public"."intellipulse_sessions" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "title" text,
    "messages" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."intellipulse_sessions" enable row level security;

create table "public"."shared_conversations" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "session_id" uuid,
    "session_type" text,
    "title" text,
    "messages" jsonb default '[]'::jsonb,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
);


alter table "public"."shared_conversations" enable row level security;

create table "public"."user_settings" (
    "id" integer not null default nextval('user_settings_id_seq'::regclass),
    "user_id" uuid not null,
    "settings" jsonb not null,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
);


alter sequence "public"."user_settings_id_seq" owned by "public"."user_settings"."id";

CREATE UNIQUE INDEX bots_pkey ON public.bots USING btree (id);

CREATE UNIQUE INDEX chat_sessions_pkey ON public.chat_sessions USING btree (id);

CREATE UNIQUE INDEX hubs_pkey ON public.hubs USING btree (id);

CREATE INDEX idx_bots_user_id ON public.bots USING btree (user_id);

CREATE INDEX idx_chat_sessions_created_at ON public.chat_sessions USING btree (created_at);

CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions USING btree (user_id);

CREATE INDEX idx_hubs_user_id ON public.hubs USING btree (user_id);

CREATE INDEX idx_intellipulse_sessions_created_at ON public.intellipulse_sessions USING btree (created_at);

CREATE INDEX idx_intellipulse_sessions_user_id ON public.intellipulse_sessions USING btree (user_id);

CREATE INDEX idx_shared_conversations_expires_at ON public.shared_conversations USING btree (expires_at);

CREATE INDEX idx_shared_conversations_user_id ON public.shared_conversations USING btree (user_id);

CREATE UNIQUE INDEX intellipulse_sessions_pkey ON public.intellipulse_sessions USING btree (id);

CREATE UNIQUE INDEX shared_conversations_pkey ON public.shared_conversations USING btree (id);

CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (id);

CREATE UNIQUE INDEX user_settings_user_id_key ON public.user_settings USING btree (user_id);

alter table "public"."bots" add constraint "bots_pkey" PRIMARY KEY using index "bots_pkey";

alter table "public"."chat_sessions" add constraint "chat_sessions_pkey" PRIMARY KEY using index "chat_sessions_pkey";

alter table "public"."hubs" add constraint "hubs_pkey" PRIMARY KEY using index "hubs_pkey";

alter table "public"."intellipulse_sessions" add constraint "intellipulse_sessions_pkey" PRIMARY KEY using index "intellipulse_sessions_pkey";

alter table "public"."shared_conversations" add constraint "shared_conversations_pkey" PRIMARY KEY using index "shared_conversations_pkey";

alter table "public"."user_settings" add constraint "user_settings_pkey" PRIMARY KEY using index "user_settings_pkey";

alter table "public"."bots" add constraint "bots_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."bots" validate constraint "bots_user_id_fkey";

alter table "public"."chat_sessions" add constraint "chat_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_sessions" validate constraint "chat_sessions_user_id_fkey";

alter table "public"."hubs" add constraint "hubs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."hubs" validate constraint "hubs_user_id_fkey";

alter table "public"."intellipulse_sessions" add constraint "intellipulse_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."intellipulse_sessions" validate constraint "intellipulse_sessions_user_id_fkey";

alter table "public"."shared_conversations" add constraint "shared_conversations_session_type_check" CHECK ((session_type = ANY (ARRAY['chat'::text, 'intellipulse'::text]))) not valid;

alter table "public"."shared_conversations" validate constraint "shared_conversations_session_type_check";

alter table "public"."shared_conversations" add constraint "shared_conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."shared_conversations" validate constraint "shared_conversations_user_id_fkey";

alter table "public"."user_settings" add constraint "user_settings_user_id_key" UNIQUE using index "user_settings_user_id_key";

grant delete on table "public"."bots" to "anon";

grant insert on table "public"."bots" to "anon";

grant references on table "public"."bots" to "anon";

grant select on table "public"."bots" to "anon";

grant trigger on table "public"."bots" to "anon";

grant truncate on table "public"."bots" to "anon";

grant update on table "public"."bots" to "anon";

grant delete on table "public"."bots" to "authenticated";

grant insert on table "public"."bots" to "authenticated";

grant references on table "public"."bots" to "authenticated";

grant select on table "public"."bots" to "authenticated";

grant trigger on table "public"."bots" to "authenticated";

grant truncate on table "public"."bots" to "authenticated";

grant update on table "public"."bots" to "authenticated";

grant delete on table "public"."bots" to "service_role";

grant insert on table "public"."bots" to "service_role";

grant references on table "public"."bots" to "service_role";

grant select on table "public"."bots" to "service_role";

grant trigger on table "public"."bots" to "service_role";

grant truncate on table "public"."bots" to "service_role";

grant update on table "public"."bots" to "service_role";

grant delete on table "public"."chat_sessions" to "anon";

grant insert on table "public"."chat_sessions" to "anon";

grant references on table "public"."chat_sessions" to "anon";

grant select on table "public"."chat_sessions" to "anon";

grant trigger on table "public"."chat_sessions" to "anon";

grant truncate on table "public"."chat_sessions" to "anon";

grant update on table "public"."chat_sessions" to "anon";

grant delete on table "public"."chat_sessions" to "authenticated";

grant insert on table "public"."chat_sessions" to "authenticated";

grant references on table "public"."chat_sessions" to "authenticated";

grant select on table "public"."chat_sessions" to "authenticated";

grant trigger on table "public"."chat_sessions" to "authenticated";

grant truncate on table "public"."chat_sessions" to "authenticated";

grant update on table "public"."chat_sessions" to "authenticated";

grant delete on table "public"."chat_sessions" to "service_role";

grant insert on table "public"."chat_sessions" to "service_role";

grant references on table "public"."chat_sessions" to "service_role";

grant select on table "public"."chat_sessions" to "service_role";

grant trigger on table "public"."chat_sessions" to "service_role";

grant truncate on table "public"."chat_sessions" to "service_role";

grant update on table "public"."chat_sessions" to "service_role";

grant delete on table "public"."hubs" to "anon";

grant insert on table "public"."hubs" to "anon";

grant references on table "public"."hubs" to "anon";

grant select on table "public"."hubs" to "anon";

grant trigger on table "public"."hubs" to "anon";

grant truncate on table "public"."hubs" to "anon";

grant update on table "public"."hubs" to "anon";

grant delete on table "public"."hubs" to "authenticated";

grant insert on table "public"."hubs" to "authenticated";

grant references on table "public"."hubs" to "authenticated";

grant select on table "public"."hubs" to "authenticated";

grant trigger on table "public"."hubs" to "authenticated";

grant truncate on table "public"."hubs" to "authenticated";

grant update on table "public"."hubs" to "authenticated";

grant delete on table "public"."hubs" to "service_role";

grant insert on table "public"."hubs" to "service_role";

grant references on table "public"."hubs" to "service_role";

grant select on table "public"."hubs" to "service_role";

grant trigger on table "public"."hubs" to "service_role";

grant truncate on table "public"."hubs" to "service_role";

grant update on table "public"."hubs" to "service_role";

grant delete on table "public"."intellipulse_sessions" to "anon";

grant insert on table "public"."intellipulse_sessions" to "anon";

grant references on table "public"."intellipulse_sessions" to "anon";

grant select on table "public"."intellipulse_sessions" to "anon";

grant trigger on table "public"."intellipulse_sessions" to "anon";

grant truncate on table "public"."intellipulse_sessions" to "anon";

grant update on table "public"."intellipulse_sessions" to "anon";

grant delete on table "public"."intellipulse_sessions" to "authenticated";

grant insert on table "public"."intellipulse_sessions" to "authenticated";

grant references on table "public"."intellipulse_sessions" to "authenticated";

grant select on table "public"."intellipulse_sessions" to "authenticated";

grant trigger on table "public"."intellipulse_sessions" to "authenticated";

grant truncate on table "public"."intellipulse_sessions" to "authenticated";

grant update on table "public"."intellipulse_sessions" to "authenticated";

grant delete on table "public"."intellipulse_sessions" to "service_role";

grant insert on table "public"."intellipulse_sessions" to "service_role";

grant references on table "public"."intellipulse_sessions" to "service_role";

grant select on table "public"."intellipulse_sessions" to "service_role";

grant trigger on table "public"."intellipulse_sessions" to "service_role";

grant truncate on table "public"."intellipulse_sessions" to "service_role";

grant update on table "public"."intellipulse_sessions" to "service_role";

grant delete on table "public"."shared_conversations" to "anon";

grant insert on table "public"."shared_conversations" to "anon";

grant references on table "public"."shared_conversations" to "anon";

grant select on table "public"."shared_conversations" to "anon";

grant trigger on table "public"."shared_conversations" to "anon";

grant truncate on table "public"."shared_conversations" to "anon";

grant update on table "public"."shared_conversations" to "anon";

grant delete on table "public"."shared_conversations" to "authenticated";

grant insert on table "public"."shared_conversations" to "authenticated";

grant references on table "public"."shared_conversations" to "authenticated";

grant select on table "public"."shared_conversations" to "authenticated";

grant trigger on table "public"."shared_conversations" to "authenticated";

grant truncate on table "public"."shared_conversations" to "authenticated";

grant update on table "public"."shared_conversations" to "authenticated";

grant delete on table "public"."shared_conversations" to "service_role";

grant insert on table "public"."shared_conversations" to "service_role";

grant references on table "public"."shared_conversations" to "service_role";

grant select on table "public"."shared_conversations" to "service_role";

grant trigger on table "public"."shared_conversations" to "service_role";

grant truncate on table "public"."shared_conversations" to "service_role";

grant update on table "public"."shared_conversations" to "service_role";

grant delete on table "public"."user_settings" to "anon";

grant insert on table "public"."user_settings" to "anon";

grant references on table "public"."user_settings" to "anon";

grant select on table "public"."user_settings" to "anon";

grant trigger on table "public"."user_settings" to "anon";

grant truncate on table "public"."user_settings" to "anon";

grant update on table "public"."user_settings" to "anon";

grant delete on table "public"."user_settings" to "authenticated";

grant insert on table "public"."user_settings" to "authenticated";

grant references on table "public"."user_settings" to "authenticated";

grant select on table "public"."user_settings" to "authenticated";

grant trigger on table "public"."user_settings" to "authenticated";

grant truncate on table "public"."user_settings" to "authenticated";

grant update on table "public"."user_settings" to "authenticated";

grant delete on table "public"."user_settings" to "service_role";

grant insert on table "public"."user_settings" to "service_role";

grant references on table "public"."user_settings" to "service_role";

grant select on table "public"."user_settings" to "service_role";

grant trigger on table "public"."user_settings" to "service_role";

grant truncate on table "public"."user_settings" to "service_role";

grant update on table "public"."user_settings" to "service_role";

create policy "Users can delete own bots"
on "public"."bots"
as permissive
for delete
to public
using (( SELECT (auth.uid() = bots.user_id)));


create policy "Users can insert own bots"
on "public"."bots"
as permissive
for insert
to public
with check (( SELECT (auth.uid() = bots.user_id)));


create policy "Users can update own bots"
on "public"."bots"
as permissive
for update
to public
using (( SELECT (auth.uid() = bots.user_id)));


create policy "Users can delete own chat sessions"
on "public"."chat_sessions"
as permissive
for delete
to public
using (( SELECT (auth.uid() = chat_sessions.user_id)));


create policy "Users can insert own chat sessions"
on "public"."chat_sessions"
as permissive
for insert
to public
with check (( SELECT (auth.uid() = chat_sessions.user_id)));


create policy "Users can update own chat sessions"
on "public"."chat_sessions"
as permissive
for update
to public
using (( SELECT (auth.uid() = chat_sessions.user_id)));


create policy "Users can view own chat sessions"
on "public"."chat_sessions"
as permissive
for select
to public
using (( SELECT (auth.uid() = chat_sessions.user_id)));


create policy "Users can insert their own chat streams"
on "public"."chat_streams"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM chat_sessions cs
  WHERE ((cs.id = chat_streams.chat_id) AND (cs.user_id = auth.uid())))));


create policy "Users can read their own chat streams"
on "public"."chat_streams"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM chat_sessions cs
  WHERE ((cs.id = chat_streams.chat_id) AND (cs.user_id = auth.uid())))));


create policy "Users can delete own hubs"
on "public"."hubs"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own hubs"
on "public"."hubs"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own hubs"
on "public"."hubs"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own hubs"
on "public"."hubs"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete own intellipulse sessions"
on "public"."intellipulse_sessions"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own intellipulse sessions"
on "public"."intellipulse_sessions"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own intellipulse sessions"
on "public"."intellipulse_sessions"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own intellipulse sessions"
on "public"."intellipulse_sessions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Anyone can view non-expired shared conversations"
on "public"."shared_conversations"
as permissive
for select
to public
using (((expires_at IS NULL) OR (expires_at > now())));


create policy "Users can delete own shared conversations"
on "public"."shared_conversations"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own shared conversations"
on "public"."shared_conversations"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own shared conversations"
on "public"."shared_conversations"
as permissive
for update
to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON public.bots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hubs_updated_at BEFORE UPDATE ON public.hubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intellipulse_sessions_updated_at BEFORE UPDATE ON public.intellipulse_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


