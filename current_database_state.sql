--
-- PostgreSQL database dump
--

\restrict LdWQWrem9dYRgbIqc1uuqAlx6MFsbIHpJlracFXzhEQOoJxgQWT3TGvipKgoQpN

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AdminUsers; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."AdminUsers" (
    "Id" uuid NOT NULL,
    "Username" character varying(256) NOT NULL,
    "PasswordHash" character varying(512) NOT NULL,
    "IsActive" boolean DEFAULT true NOT NULL,
    "IsSuperAdmin" boolean DEFAULT false NOT NULL,
    "Permissions" jsonb NOT NULL,
    "CreatedAt" timestamp with time zone DEFAULT '-infinity'::timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "LastStatusChangedAt" timestamp with time zone,
    "LastStatusChangedBy" text,
    "RefreshToken" text,
    "RefreshTokenExpiryTime" timestamp with time zone
);


ALTER TABLE public."AdminUsers" OWNER TO olmies_user;

--
-- Name: Announcements; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."Announcements" (
    "Id" uuid NOT NULL,
    "Title" text,
    "Message" text,
    "ImageUrl" text,
    "TargetAudience" text,
    "CreatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Announcements" OWNER TO olmies_user;

--
-- Name: DevicePushTokens; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."DevicePushTokens" (
    "Id" uuid NOT NULL,
    "Username" text,
    "ExpoToken" text,
    "LastActiveAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."DevicePushTokens" OWNER TO olmies_user;

--
-- Name: InstitutionConfigs; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."InstitutionConfigs" (
    "Id" uuid NOT NULL,
    "InstitutionName" text,
    "PrimaryColorHex" text,
    "AccentColorHex" text,
    "LogoUrl" text,
    "HeroImageUrl" text
);


ALTER TABLE public."InstitutionConfigs" OWNER TO olmies_user;

--
-- Name: LecturerAssignments; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."LecturerAssignments" (
    "AssignmentId" uuid NOT NULL,
    "LecturerId" character varying(100) NOT NULL,
    "ModuleOfferingId" uuid NOT NULL,
    "Role" character varying(50)
);


ALTER TABLE public."LecturerAssignments" OWNER TO olmies_user;

--
-- Name: ModuleOfferings; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."ModuleOfferings" (
    "ModuleOfferingId" uuid NOT NULL,
    "ModuleCode" character varying(20) NOT NULL,
    "ModuleName" character varying(255),
    "Semester" character varying(10) NOT NULL,
    "Year" integer NOT NULL,
    "Section" character varying(50)
);


ALTER TABLE public."ModuleOfferings" OWNER TO olmies_user;

--
-- Name: ResponseAnswers; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."ResponseAnswers" (
    "AnswerId" uuid NOT NULL,
    "ResponseHeaderId" uuid NOT NULL,
    "QuestionId" uuid NOT NULL,
    "NumericValue" numeric(10,2),
    "TextValue" character varying(4000)
);


ALTER TABLE public."ResponseAnswers" OWNER TO olmies_user;

--
-- Name: ResponseHeaders; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."ResponseHeaders" (
    "ResponseId" uuid NOT NULL,
    "SurveyWindowId" uuid NOT NULL,
    "SurveyVersionId" uuid NOT NULL,
    "SubmittedAt" timestamp with time zone NOT NULL,
    "ResponderType" text NOT NULL,
    "AuthProvider" text NOT NULL,
    "HashedResponderId" character varying(256),
    "ModuleOfferingId" uuid,
    "LecturerId" character varying(100)
);


ALTER TABLE public."ResponseHeaders" OWNER TO olmies_user;

--
-- Name: StudentEnrollment; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."StudentEnrollment" (
    "EnrollmentId" uuid NOT NULL,
    "StudentId" character varying(255) NOT NULL,
    "ModuleOfferingId" uuid NOT NULL
);


ALTER TABLE public."StudentEnrollment" OWNER TO olmies_user;

--
-- Name: SurveyQuestions; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."SurveyQuestions" (
    "QuestionId" uuid NOT NULL,
    "QuestionText" character varying(500) NOT NULL,
    "QuestionKey" character varying(100),
    "Type" text NOT NULL,
    "LikertMin" integer,
    "LikertMax" integer,
    "LikertLabels" text,
    "Choices" text,
    "OrderIndex" integer DEFAULT 0 NOT NULL,
    "SectionId" uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);


ALTER TABLE public."SurveyQuestions" OWNER TO olmies_user;

--
-- Name: SurveySections; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."SurveySections" (
    "SectionId" uuid NOT NULL,
    "SurveyVersionId" uuid NOT NULL,
    "Title" character varying(200) NOT NULL,
    "Instructions" character varying(1000),
    "OrderIndex" integer NOT NULL
);


ALTER TABLE public."SurveySections" OWNER TO olmies_user;

--
-- Name: SurveyTemplates; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."SurveyTemplates" (
    "SurveyTemplateId" uuid NOT NULL,
    "Name" character varying(255) NOT NULL,
    "Description" character varying(1000)
);


ALTER TABLE public."SurveyTemplates" OWNER TO olmies_user;

--
-- Name: SurveyVersions; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."SurveyVersions" (
    "SurveyVersionId" uuid NOT NULL,
    "SurveyTemplateId" uuid NOT NULL,
    "MinResponsesToPublish" integer DEFAULT 5 NOT NULL,
    "ResultsVisibilityPolicy" text DEFAULT 'AdminOnly'::text NOT NULL,
    "IsLocked" boolean DEFAULT false NOT NULL,
    "Semester" character varying(10) NOT NULL,
    "Year" integer NOT NULL,
    "ModuleOfferingId" uuid,
    "LecturerAssignmentId" uuid,
    "Status" text DEFAULT 'Draft'::text NOT NULL,
    "AccessPolicyType" text DEFAULT 'PublicAnonymous'::text
);


ALTER TABLE public."SurveyVersions" OWNER TO olmies_user;

--
-- Name: SurveyWindowAudits; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."SurveyWindowAudits" (
    "WindowId" uuid NOT NULL,
    "PerformedAt" timestamp with time zone NOT NULL,
    "Action" text NOT NULL,
    "PerformedBy" character varying(100) NOT NULL,
    "OldOpensAt" timestamp with time zone,
    "OldClosesAt" timestamp with time zone,
    "NewOpensAt" timestamp with time zone,
    "NewClosesAt" timestamp with time zone,
    "Reason" character varying(500)
);


ALTER TABLE public."SurveyWindowAudits" OWNER TO olmies_user;

--
-- Name: SurveyWindows; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."SurveyWindows" (
    "WindowId" uuid NOT NULL,
    "SurveyVersionId" uuid NOT NULL,
    "Semester" character varying(10) NOT NULL,
    "Year" integer NOT NULL,
    "OpensAt" timestamp with time zone NOT NULL,
    "ClosesAt" timestamp with time zone NOT NULL,
    "Enabled" boolean DEFAULT true NOT NULL,
    "ClosedAt" timestamp with time zone,
    "ReopenAllowedDays" integer,
    "ReopenedCount" integer DEFAULT 0 NOT NULL,
    "LastReopenedAt" timestamp with time zone,
    "ScopeType" text NOT NULL,
    "ScopeId" character varying(100)
);


ALTER TABLE public."SurveyWindows" OWNER TO olmies_user;

--
-- Name: VendorAds; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."VendorAds" (
    "Id" uuid NOT NULL,
    "VendorName" text,
    "OfferText" text,
    "BannerImageUrl" text,
    "ExpiresAt" timestamp with time zone,
    "IsActive" boolean NOT NULL
);


ALTER TABLE public."VendorAds" OWNER TO olmies_user;

--
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: public; Owner: olmies_user
--

CREATE TABLE public."__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL
);


ALTER TABLE public."__EFMigrationsHistory" OWNER TO olmies_user;

--
-- Data for Name: AdminUsers; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."AdminUsers" ("Id", "Username", "PasswordHash", "IsActive", "IsSuperAdmin", "Permissions", "CreatedAt", "CreatedBy", "LastStatusChangedAt", "LastStatusChangedBy", "RefreshToken", "RefreshTokenExpiryTime") FROM stdin;
13b87a2d-5322-488c-b1cd-0ba015e4f27b	superadmin	40+SogUyqHPLMYQ5gHC0uCqPopz0hXLCA9xfD6YVgjE=	t	t	["ManageAdmins", "ManageSurveys"]	2026-03-15 23:46:54.296983+00	System	\N	\N	\N	\N
\.


--
-- Data for Name: Announcements; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."Announcements" ("Id", "Title", "Message", "ImageUrl", "TargetAudience", "CreatedAt") FROM stdin;
\.


--
-- Data for Name: DevicePushTokens; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."DevicePushTokens" ("Id", "Username", "ExpoToken", "LastActiveAt") FROM stdin;
\.


--
-- Data for Name: InstitutionConfigs; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."InstitutionConfigs" ("Id", "InstitutionName", "PrimaryColorHex", "AccentColorHex", "LogoUrl", "HeroImageUrl") FROM stdin;
\.


--
-- Data for Name: LecturerAssignments; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."LecturerAssignments" ("AssignmentId", "LecturerId", "ModuleOfferingId", "Role") FROM stdin;
\.


--
-- Data for Name: ModuleOfferings; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."ModuleOfferings" ("ModuleOfferingId", "ModuleCode", "ModuleName", "Semester", "Year", "Section") FROM stdin;
28c22ca3-3a68-46a3-96bb-e101f64fedda	MATH2010	Linear Algebra	Semester 1	2026	\N
ddfdb856-03ce-4e2d-be02-8bba163a16f1	COMP3012	Advanced Web Development	Semester 1	2026	\N
\.


--
-- Data for Name: ResponseAnswers; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."ResponseAnswers" ("AnswerId", "ResponseHeaderId", "QuestionId", "NumericValue", "TextValue") FROM stdin;
00993d4f-4ea2-49d6-85f4-95ae227044db	35bc0bcb-a355-485f-8a90-afc029eff66d	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	Needs better pacing.
02490236-165b-4898-9505-b25c1a19bf9f	33bdd564-c212-453f-bc91-35f2759aaba4	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Tutorials
04273691-189d-4f9a-8247-e44b18d66b30	57de6a27-93bf-4644-9c08-cf0c13b632ec	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
06074a39-3970-42eb-9b77-e1cc8d0d3703	f2848535-92bf-44d4-a1e8-461334616339	1fcae0da-f766-4d69-ba23-534f04c08fa0	2.00	\N
06a6163d-1a9f-4fe6-872b-9219bca576cf	a859808d-b9bc-4b0a-b2c8-3793010e2cd6	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	Would love more practical examples.
09326552-a6a3-45bc-8c4a-1f3c0b734464	f3ea344c-116e-4ebe-86a8-2d6af6c2875a	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	Would love more practical examples.
098f625e-2498-4251-b24b-a3a15dd29cd0	28fa2eac-135b-45be-b1bc-e39256c7b86e	1fcae0da-f766-4d69-ba23-534f04c08fa0	2.00	\N
09ec059d-72ef-478c-a276-70dfe5dadecd	ad79126a-3635-4af4-a270-1160b8a53ee1	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
0acbc779-317d-40cb-aaa3-98920b0ca988	147ed716-58b4-42de-b0c7-0af46e5222c4	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
0b77b024-3598-4f0f-8aec-2268874f46be	2c5122a8-af74-4b35-b07c-44b38fd04417	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
0c8ca7e2-b608-42e2-b6b8-4bf6b5374012	b4a1e222-4d19-4ea8-9d21-ff20920e9118	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Tutorials
0d3799ae-3040-416c-af5f-e0f3d0d98062	6354eb40-5a51-4e5d-b762-d363a5b03b46	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
0dbf913f-8650-48ea-8f4d-fc9355d237a8	f3ea344c-116e-4ebe-86a8-2d6af6c2875a	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Slide Decks
0e1055d9-453c-4aa0-a204-ef83e5c8ba7d	6354eb40-5a51-4e5d-b762-d363a5b03b46	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
0e343ad2-bb27-469a-97d0-f7d9c57aadd5	57de6a27-93bf-4644-9c08-cf0c13b632ec	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
0e9ac67e-6bc1-4b80-9e0f-d44b6d7c0cb0	35bc0bcb-a355-485f-8a90-afc029eff66d	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Slide Decks
1119e3de-c1f2-48e9-a73b-0ebb91a06a55	e073e7f0-c467-4837-9248-a6f464bddda3	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
120e9e27-6d75-4a16-9850-36d05c30bc14	eec2bd96-904c-45be-b155-9161869cde89	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
1235edd8-759a-48bf-bcb2-760c5d992297	33bdd564-c212-453f-bc91-35f2759aaba4	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
14ecfea0-0538-43ed-8535-0376b081178e	0ec59dc2-3a54-4dc3-8525-7163247487b0	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
1524d6fa-cbfb-4570-9a45-462cb65867a1	168312ba-8d10-4ff4-8f57-bdf899ff38b9	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
15af6ca6-8c74-47f2-b7da-e85c4b5efb56	e073e7f0-c467-4837-9248-a6f464bddda3	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
16195fca-df53-4c1f-8ceb-b980092c54a2	57de6a27-93bf-4644-9c08-cf0c13b632ec	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Slide Decks
1a2df9f3-2f70-4d18-8d49-03a6e076f914	e073e7f0-c467-4837-9248-a6f464bddda3	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
1ba0fe1c-0dc3-434a-9adb-6bc9553262ee	9e63fa8b-1ae6-4c8b-ba08-674920986c27	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
1bacd27b-2676-4a17-98a8-a0a44a90e11e	9e63fa8b-1ae6-4c8b-ba08-674920986c27	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
1bbc5890-396b-40d5-b5b7-04793f3ff5c7	6a2a2f42-de60-4a82-bbb2-0770fd3442b0	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
1d6d5304-b8da-4ea3-9590-71f76031a524	97e801cd-458b-4d6d-a68b-0918436225cb	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
203512bb-fd82-40e8-b32c-1bbb431692c7	4908ab48-9000-46ca-a4cd-3af98431e955	1fcae0da-f766-4d69-ba23-534f04c08fa0	3.00	\N
207bfbf4-09e2-4c0f-b255-6d64921a51e7	cc6e4c1e-0d0b-4a97-aa29-f0c6b21d8478	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
216e0e41-9307-4aec-b009-772e8350d68c	89877655-d7e6-4971-8f84-a199f8debd8a	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
21d6402f-8fa0-450e-a339-2686f3cb2643	2c5122a8-af74-4b35-b07c-44b38fd04417	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
24c3b3d9-4167-4e8e-8418-e1da17b913fa	edd18022-01f4-4b92-962b-46de9abbad59	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
279aea4f-2517-4f47-8736-b50fe618d28f	78c990ec-f3cd-4042-a5d1-6f9ebb6dfe15	1fcae0da-f766-4d69-ba23-534f04c08fa0	2.00	\N
282bfab6-376d-48ca-97f5-abed75936166	4e648d08-e4a1-4016-90dd-ae56a0038a86	1fcae0da-f766-4d69-ba23-534f04c08fa0	3.00	\N
288e33db-d707-4990-a5f1-27be23ad069e	c0ec0772-4454-45ef-923f-fcd4396ff825	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
293f4f48-3be4-4cee-bf0b-3340c5a6f6f0	3e21a304-5e66-4c52-8d05-0ff777df56dd	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
295a3cd0-9b10-4114-b968-f0881f08e3a7	3306a10b-e1a2-4d3a-ac78-6fcfc68fbd26	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
2bea8c53-8aa1-4729-be1d-d694d8965864	f2848535-92bf-44d4-a1e8-461334616339	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
2c434f88-7d6c-46ce-815f-2c0288fb7b13	bb974802-4d2b-4067-9d14-7862e1eac0a6	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	The final assignment was too difficult.
2dcb9b7c-98d7-499b-b80c-fe3a845c455e	28fa2eac-135b-45be-b1bc-e39256c7b86e	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
2f2520b0-5998-49d6-9439-4349d20e2327	78c990ec-f3cd-4042-a5d1-6f9ebb6dfe15	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
35090c5a-534e-45d1-b649-cded6b3a35c2	bb974802-4d2b-4067-9d14-7862e1eac0a6	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
39ee840d-33da-411a-8e14-e1e2bc6b1f1d	5fff75cf-40bb-41d4-8366-9faa40e1db49	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
3a8266c3-1e14-49b8-8215-6f9f59dcb358	33bdd564-c212-453f-bc91-35f2759aaba4	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	Would love more practical examples.
3b1a9e2b-a5ca-4b79-b20b-5dd018e6bc12	8194ef11-8017-4893-beb1-513fab0e2c69	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Slide Decks
3c11e718-7eb1-4c6f-bce3-a2ea10a9c3b2	35bc0bcb-a355-485f-8a90-afc029eff66d	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
3d4c6c18-ede2-41e5-8065-8aa8394018f0	becec514-d0f4-42b9-b314-53d2617c3b49	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
3dd1a897-3fb4-48d2-956f-568bd6d04550	edd18022-01f4-4b92-962b-46de9abbad59	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
3ef48426-2824-4dde-a06c-9c385ee16cd4	a22969cd-e499-449e-85c5-de203e5421e2	1fcae0da-f766-4d69-ba23-534f04c08fa0	3.00	\N
405e35fb-5b43-4002-97f2-4001d47f3de3	33f4a4fa-ec29-43ab-90e6-ea95cbce623b	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
46f47d67-5ee0-44df-903c-c8843c606688	116a572a-8d98-4ea4-a68d-30c985c704d6	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
48f9b83b-e758-49fc-b7d5-5e30595e9c9f	8194ef11-8017-4893-beb1-513fab0e2c69	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
4d7317b7-e006-47f5-9f4a-f0df99a262f8	cc6e4c1e-0d0b-4a97-aa29-f0c6b21d8478	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
50aaea46-8b2f-4a2b-b04e-4f12ea44323d	33f4a4fa-ec29-43ab-90e6-ea95cbce623b	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
525d11f3-5da4-46b1-a116-14cb35ac8180	bb974802-4d2b-4067-9d14-7862e1eac0a6	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
5357c8ec-e2bc-4855-bb14-7e3f26f3003d	89877655-d7e6-4971-8f84-a199f8debd8a	1fcae0da-f766-4d69-ba23-534f04c08fa0	2.00	\N
54ebb03d-3e4c-4156-9bca-39f25d3f3941	ae281dba-c146-4f7d-af7c-4096830c7e58	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
5566d200-55b3-4faf-bc69-41024e18c284	e520ca12-1d7d-4d5c-8123-5a1c1c67c713	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
5688a67d-6306-4ce1-a4bb-0aedfc4e8abb	bb974802-4d2b-4067-9d14-7862e1eac0a6	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
57e219d8-a5d5-47e5-aab9-1b04628e330f	168312ba-8d10-4ff4-8f57-bdf899ff38b9	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
581512c4-a093-46c8-9c6e-7f62218351e1	0ec59dc2-3a54-4dc3-8525-7163247487b0	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
58669e4f-c875-4a24-87c2-8fa53c7c26a9	0ec59dc2-3a54-4dc3-8525-7163247487b0	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
597b6a6f-6765-4a98-8e3e-0cc85ce5bce8	2f105605-fe3d-48a3-9b5d-610dcea7e0e3	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
59845944-75f1-41d7-baec-ebf86b17e65f	e520ca12-1d7d-4d5c-8123-5a1c1c67c713	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
5c275362-2b3a-42a4-b2d8-df273ef0aec4	046887b7-3898-4731-94b0-6231a0fd198a	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
5e299a8a-9091-4b42-9009-a680bde69842	7b385f97-ad74-41c7-98c7-5d8af824779a	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
5eafce60-9e85-4d2a-ba6c-3c70ca7ea63a	7b385f97-ad74-41c7-98c7-5d8af824779a	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
5f9027b5-9741-4b43-809c-2ec2effd8df1	147ed716-58b4-42de-b0c7-0af46e5222c4	1fcae0da-f766-4d69-ba23-534f04c08fa0	2.00	\N
61fab331-50f3-4f01-a2f8-64109dfda762	116a572a-8d98-4ea4-a68d-30c985c704d6	1fcae0da-f766-4d69-ba23-534f04c08fa0	2.00	\N
629fc84e-49b3-4be7-b09f-1e143b185488	d52887a3-532b-4417-af4e-b340078d09b1	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
63eabe99-01dd-4973-8e2b-4db57b79adeb	35bc0bcb-a355-485f-8a90-afc029eff66d	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
646f4f0c-5b07-4f0e-8161-27a9ce7a0ee6	7be11547-568f-45b8-942f-5e02224c019f	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Tutorials
65994efd-6b91-474d-8778-2ad4a87e81cc	7be11547-568f-45b8-942f-5e02224c019f	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
67627304-f185-4f58-b6a2-2522223f5316	a22969cd-e499-449e-85c5-de203e5421e2	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
6767512c-e7ec-4728-8385-975089dd4118	eec2bd96-904c-45be-b155-9161869cde89	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
677cfdf9-4029-4b23-a0ea-0aa9df24a1fb	31451071-265d-4a5c-911c-d47a9a76b3b8	1fcae0da-f766-4d69-ba23-534f04c08fa0	3.00	\N
679952bc-4d0f-40ac-bd9a-6f04a609f9a5	168312ba-8d10-4ff4-8f57-bdf899ff38b9	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
684d85c6-cbfa-480a-88ef-961aed8cf8bf	eec2bd96-904c-45be-b155-9161869cde89	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	Needs better pacing.
6bb98019-5a67-4a1a-b642-fb7545df0694	97e801cd-458b-4d6d-a68b-0918436225cb	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
6de84d52-0511-4352-8ccb-64512222845c	100f128a-b5d0-4a19-a754-30094a60a3ec	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
6e5cde8b-ce48-4243-80be-b919794af041	6a2a2f42-de60-4a82-bbb2-0770fd3442b0	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
6e5d0cf2-a460-4ff5-901f-83105ff2f721	3e21a304-5e66-4c52-8d05-0ff777df56dd	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Slide Decks
6ebffcc3-36e6-44ab-a0af-5657b9ffcf2d	100f128a-b5d0-4a19-a754-30094a60a3ec	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
6f315176-d178-4367-83a6-c9e81bce8e7e	9d3e781b-dbf0-425f-b095-dd3242ed2edc	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
6fc3a67f-9781-4b6f-8b1e-33a870f53a5f	c0ec0772-4454-45ef-923f-fcd4396ff825	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
70c9095f-de42-487e-be1f-7c65e08ba331	100f128a-b5d0-4a19-a754-30094a60a3ec	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	The final assignment was too difficult.
718cb940-ef22-4bb6-a48c-ecb6cccb96df	1204102e-5016-40db-bb33-a60471a4d814	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
743b316e-0a44-4020-a17e-74e798bf77cd	100f128a-b5d0-4a19-a754-30094a60a3ec	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
77d0b62a-6e9f-4683-af8d-e90130b31670	edd18022-01f4-4b92-962b-46de9abbad59	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
78903648-d54f-4ba9-8523-3144cf78438d	04642323-8990-4c96-af63-57227e9ce3b9	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
7c406163-fada-4d86-9fbb-2edf9886661b	5fff75cf-40bb-41d4-8366-9faa40e1db49	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
7c46c3ff-875f-47df-9b8f-8e0c94d47585	eec2bd96-904c-45be-b155-9161869cde89	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Tutorials
7de21ba7-bd89-4845-941e-41abea360a7b	046887b7-3898-4731-94b0-6231a0fd198a	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
7e195734-c742-490d-aa60-edef0de842b1	2c5122a8-af74-4b35-b07c-44b38fd04417	1fcae0da-f766-4d69-ba23-534f04c08fa0	2.00	\N
7f964b85-de0a-4dc3-9d2b-569ee85c8065	4908ab48-9000-46ca-a4cd-3af98431e955	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
810ab253-a770-45fc-ba48-88e07900701b	a22969cd-e499-449e-85c5-de203e5421e2	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Slide Decks
81132ccc-0307-4ce4-95a7-9b613e081039	9e63fa8b-1ae6-4c8b-ba08-674920986c27	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Slide Decks
8201cfe5-ee83-404b-9a30-7839bbb7ca7a	8194ef11-8017-4893-beb1-513fab0e2c69	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
83ac0159-8b74-4ce6-986c-3599d252ccfa	c0ec0772-4454-45ef-923f-fcd4396ff825	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
848210e4-0e67-4cdd-8cff-3503ab0d31af	2f796c3a-f11b-4c91-871c-75d8e0c46596	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
84eb61d3-25f9-44e0-b53b-cc99d0697db0	116a572a-8d98-4ea4-a68d-30c985c704d6	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
85f4c480-cf6a-48ab-bba3-55a776207174	4908ab48-9000-46ca-a4cd-3af98431e955	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
864c7356-2035-4c82-b5a6-4b51c4aeff46	046887b7-3898-4731-94b0-6231a0fd198a	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Slide Decks
8a7aacc6-ae5e-45e8-b8ad-7f8cf5d7ee37	28fa2eac-135b-45be-b1bc-e39256c7b86e	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
8b145dd8-2694-4ee6-b0f1-d89f472211c9	31451071-265d-4a5c-911c-d47a9a76b3b8	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	Needs better pacing.
8c2807c0-d2db-4c81-9beb-f742d7938c5a	2f796c3a-f11b-4c91-871c-75d8e0c46596	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
8ca01512-4421-4447-ad69-babd189524cd	33f4a4fa-ec29-43ab-90e6-ea95cbce623b	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
8d7bbe58-00b5-405f-893d-0701c6e1a79e	33bdd564-c212-453f-bc91-35f2759aaba4	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
8e02e24b-b667-43d3-a2d4-9678d9c89557	78c990ec-f3cd-4042-a5d1-6f9ebb6dfe15	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
90a65a8b-c073-4408-8352-26bf318e85b9	ae281dba-c146-4f7d-af7c-4096830c7e58	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
9331a99a-4eed-484e-b02b-71deab5b81f4	a859808d-b9bc-4b0a-b2c8-3793010e2cd6	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
9768aaba-ffdc-4a9f-bb13-83dfa8307dc0	3306a10b-e1a2-4d3a-ac78-6fcfc68fbd26	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
9bb48ee0-299f-4654-b3c1-c80f89a397e1	a859808d-b9bc-4b0a-b2c8-3793010e2cd6	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
9c270e93-5ae3-4dba-af33-01f8719921f8	4e648d08-e4a1-4016-90dd-ae56a0038a86	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
9fb6a37c-82f2-42a5-ab58-b930a6bfcc8f	31451071-265d-4a5c-911c-d47a9a76b3b8	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
a1d79bae-d77e-463b-b3f3-1e1e7631044f	6354eb40-5a51-4e5d-b762-d363a5b03b46	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
a41d5c2a-660b-40c6-a926-0b228d416c13	78bb0765-d573-482f-a6f8-3ea3961830a2	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
a4c7c965-eeb6-445c-825b-8bb0a0f48c32	4e648d08-e4a1-4016-90dd-ae56a0038a86	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
a4dc680d-15a0-4b63-8cdf-729ea7495eb9	becec514-d0f4-42b9-b314-53d2617c3b49	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
a4e9a008-e4fe-45b1-bc87-a606e6dce149	3306a10b-e1a2-4d3a-ac78-6fcfc68fbd26	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	The final assignment was too difficult.
a7f46fdf-4b13-41e4-aa81-c275c8d1706b	7b385f97-ad74-41c7-98c7-5d8af824779a	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
ac363592-4261-4205-ad91-554e9a3e6237	2f796c3a-f11b-4c91-871c-75d8e0c46596	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
acf6e5ea-d467-4761-a167-c0119709422c	1204102e-5016-40db-bb33-a60471a4d814	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	Needs better pacing.
adf5d497-2e9b-4acf-9fd3-ee789219f741	0ec59dc2-3a54-4dc3-8525-7163247487b0	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	Really enjoyed the lectures.
ae5d3d7b-9580-45d2-97bd-e98e72681ebf	147ed716-58b4-42de-b0c7-0af46e5222c4	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
af40cb3e-ae02-49d6-b9b2-4a510503cb69	78bb0765-d573-482f-a6f8-3ea3961830a2	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
afd6cbfe-3e19-4233-8332-76c6f74c832b	31451071-265d-4a5c-911c-d47a9a76b3b8	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
b13093b5-cbbf-44a7-a873-02358b0b4df8	edd18022-01f4-4b92-962b-46de9abbad59	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	Needs better pacing.
b4214535-147c-40a4-adfc-cd9be1a100b3	dba4fd38-922c-4740-b001-0429c2440fdf	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
b6a3d38c-5bb7-40c5-a236-5c65c7834c9a	dba4fd38-922c-4740-b001-0429c2440fdf	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Slide Decks
b76a4960-5379-46c6-a88c-ad4b2ba4a6cc	cc6e4c1e-0d0b-4a97-aa29-f0c6b21d8478	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
b919d1fd-8a4a-4ced-84a2-f4941e95c6b0	ad79126a-3635-4af4-a270-1160b8a53ee1	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
ba0e5a4c-1ba6-44f7-a2a3-a1884978798f	b4a1e222-4d19-4ea8-9d21-ff20920e9118	1fcae0da-f766-4d69-ba23-534f04c08fa0	3.00	\N
ba7ce49d-0bec-4581-9805-3b531aa22c23	6a2a2f42-de60-4a82-bbb2-0770fd3442b0	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
bd176c74-5ce6-493a-aed0-7951e40ce314	1204102e-5016-40db-bb33-a60471a4d814	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
c31881c2-8598-4c5e-938c-d19a19d1bb4c	f3ea344c-116e-4ebe-86a8-2d6af6c2875a	1fcae0da-f766-4d69-ba23-534f04c08fa0	2.00	\N
c558a076-af50-4a92-a83b-9d89c29b1e46	d52887a3-532b-4417-af4e-b340078d09b1	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
c5e13e22-a2e9-4234-9767-7ac1cc822b69	04642323-8990-4c96-af63-57227e9ce3b9	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Tutorials
c5e32090-28c3-40bb-9eb1-83f052602cf1	ae281dba-c146-4f7d-af7c-4096830c7e58	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
cce17f63-ee80-4f6f-8d37-7b41d9593869	f2848535-92bf-44d4-a1e8-461334616339	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
ce69b802-aa27-483b-9375-96adc9215f08	e520ca12-1d7d-4d5c-8123-5a1c1c67c713	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
cf04ee06-7312-4678-8fc9-db5e978f358a	8194ef11-8017-4893-beb1-513fab0e2c69	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	Would love more practical examples.
d09af25d-65c8-463e-995c-da03ab4e1f85	9d3e781b-dbf0-425f-b095-dd3242ed2edc	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
d2558fb8-467a-4f6b-9258-e61e6a4e69c9	1204102e-5016-40db-bb33-a60471a4d814	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Slide Decks
d4730c5d-9536-4575-8e5a-66f1ea58099c	b4a1e222-4d19-4ea8-9d21-ff20920e9118	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
d6d2b44e-1033-403c-bba1-22f9b5366939	a859808d-b9bc-4b0a-b2c8-3793010e2cd6	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
d776cd81-1b16-401d-90c8-09e8001e5ad7	3306a10b-e1a2-4d3a-ac78-6fcfc68fbd26	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
d94c5324-031e-4669-a3bf-afff1ef7b22c	d52887a3-532b-4417-af4e-b340078d09b1	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
dcbf366d-f8a8-43b3-8614-c8fb0e97dd4c	dba4fd38-922c-4740-b001-0429c2440fdf	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
ddbda042-ec66-4620-b8d1-82b4f9444f41	89877655-d7e6-4971-8f84-a199f8debd8a	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
ddd363a3-6536-4b55-95b4-6c3402cac929	ad79126a-3635-4af4-a270-1160b8a53ee1	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Reading Materials
deba6ffa-0528-4139-a76d-f929c93d4669	9d3e781b-dbf0-425f-b095-dd3242ed2edc	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
deca1dc2-d59a-4300-94a9-fa26ed37b1d7	a22969cd-e499-449e-85c5-de203e5421e2	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	The final assignment was too difficult.
e29cd679-a043-450f-bf8a-74553696acd7	2f105605-fe3d-48a3-9b5d-610dcea7e0e3	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
e4161461-ed49-4f8b-8151-00504204923a	04642323-8990-4c96-af63-57227e9ce3b9	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
e5b5c240-42d4-48c2-9354-f465c3b877f6	cc6e4c1e-0d0b-4a97-aa29-f0c6b21d8478	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	Really enjoyed the lectures.
e8827b78-fd32-4ab4-b3c3-165b3ab56c76	78bb0765-d573-482f-a6f8-3ea3961830a2	1fcae0da-f766-4d69-ba23-534f04c08fa0	5.00	\N
ecd722b5-1a7d-42e2-bb68-dfad47d9df8d	7be11547-568f-45b8-942f-5e02224c019f	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
ed32ce1c-a0a2-41b1-bc7a-97dfbce2d1ee	becec514-d0f4-42b9-b314-53d2617c3b49	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
f6b2689e-75af-4f90-b21f-5059149929bc	f3ea344c-116e-4ebe-86a8-2d6af6c2875a	5b5decdd-a156-468e-8d07-1d3de1949882	3.00	\N
f88b4474-f46f-4697-bd6e-7ffbc5f2abc7	3e21a304-5e66-4c52-8d05-0ff777df56dd	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
f8af1749-dcdf-4082-a5bf-265ab151ce75	2f105605-fe3d-48a3-9b5d-610dcea7e0e3	1fcae0da-f766-4d69-ba23-534f04c08fa0	4.00	\N
faba1b41-0dbd-4df6-9d8a-11ebaac1edfd	5fff75cf-40bb-41d4-8366-9faa40e1db49	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Tutorials
fbd720a4-2859-4e1a-9637-72e6b9802b2e	97e801cd-458b-4d6d-a68b-0918436225cb	5b5decdd-a156-468e-8d07-1d3de1949882	5.00	\N
35fbc1ea-52ad-4a45-b2eb-61cb2bef524d	229fad21-addd-4a32-934e-de119b739bcd	29fa1d0c-3ae2-41e7-8000-63468ffbe889	\N	Lecture Recordings
7ef974bc-36c5-4729-b85f-a090b70cb487	229fad21-addd-4a32-934e-de119b739bcd	1fcae0da-f766-4d69-ba23-534f04c08fa0	3.00	\N
b2e82a51-866a-4325-bc89-688941d91b3c	229fad21-addd-4a32-934e-de119b739bcd	245d1f4b-be09-46ce-ad8d-f24a994ce353	\N	The Lecturer recordings was a great help.
f0493a35-d2a3-411f-bb9a-01948d6881fb	229fad21-addd-4a32-934e-de119b739bcd	5b5decdd-a156-468e-8d07-1d3de1949882	4.00	\N
\.


--
-- Data for Name: ResponseHeaders; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."ResponseHeaders" ("ResponseId", "SurveyWindowId", "SurveyVersionId", "SubmittedAt", "ResponderType", "AuthProvider", "HashedResponderId", "ModuleOfferingId", "LecturerId") FROM stdin;
04642323-8990-4c96-af63-57227e9ce3b9	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-07 08:28:37.778375+00	Student	Moodle	mock_student_24	60e2e8dc-ccee-4b7d-9a9c-d6791183ea08	mock_lecturer_id
046887b7-3898-4731-94b0-6231a0fd198a	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-11 04:22:58.068097+00	Student	Moodle	mock_student_41	d1c8969f-caac-4e24-aa07-092689f26f25	mock_lecturer_id
0ec59dc2-3a54-4dc3-8525-7163247487b0	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-02 00:23:47.966559+00	Student	Moodle	mock_student_27	d0786f1d-26ea-4655-9b54-fdef62a254fb	mock_lecturer_id
100f128a-b5d0-4a19-a754-30094a60a3ec	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-03 03:04:15.385477+00	Student	Moodle	mock_student_49	fbd73972-053c-40bf-9e2f-cfb6ad320623	mock_lecturer_id
116a572a-8d98-4ea4-a68d-30c985c704d6	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-08 06:53:08.1868+00	Student	Moodle	mock_student_34	eacc3f1f-3fb8-44ad-88ba-cc93e639f5bb	mock_lecturer_id
1204102e-5016-40db-bb33-a60471a4d814	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-11 23:33:12.589026+00	Student	Moodle	mock_student_40	8f14063f-70ea-4829-951a-a4c30c4a3e54	mock_lecturer_id
147ed716-58b4-42de-b0c7-0af46e5222c4	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-09 12:48:44.579711+00	Student	Moodle	mock_student_28	42e6160b-77d5-427e-b02b-f15be981d995	mock_lecturer_id
168312ba-8d10-4ff4-8f57-bdf899ff38b9	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-14 16:57:39.854898+00	Student	Moodle	mock_student_37	29a4a16f-1970-49b4-af4c-694a3f4bfe81	mock_lecturer_id
28fa2eac-135b-45be-b1bc-e39256c7b86e	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-02 08:35:07.092575+00	Student	Moodle	mock_student_48	51518265-3bf4-4c43-ab4a-e5747a4ac6f9	mock_lecturer_id
2c5122a8-af74-4b35-b07c-44b38fd04417	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-13 00:24:02.700625+00	Student	Moodle	mock_student_9	a6005b6d-ef19-436d-8564-29b7a18950c6	mock_lecturer_id
2f105605-fe3d-48a3-9b5d-610dcea7e0e3	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-07 16:38:11.965069+00	Student	Moodle	mock_student_12	c2fe1ea5-8904-41c9-9e7e-91cf007949e1	mock_lecturer_id
2f796c3a-f11b-4c91-871c-75d8e0c46596	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-11 06:33:22.814075+00	Student	Moodle	mock_student_0	2b4298b5-adc7-44b4-83a9-26788eda6314	mock_lecturer_id
31451071-265d-4a5c-911c-d47a9a76b3b8	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-05 00:19:53.834296+00	Student	Moodle	mock_student_45	d5a0446f-23bb-452a-acbb-7739b9cc0b57	mock_lecturer_id
3306a10b-e1a2-4d3a-ac78-6fcfc68fbd26	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-03 04:56:40.094622+00	Student	Moodle	mock_student_39	9ee9e410-e070-4b99-88d8-d34cd6b1bd19	mock_lecturer_id
33bdd564-c212-453f-bc91-35f2759aaba4	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-02 10:25:18.599384+00	Student	Moodle	mock_student_8	c102277c-4041-42a7-88ee-be0617175e42	mock_lecturer_id
33f4a4fa-ec29-43ab-90e6-ea95cbce623b	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-07 03:37:22.597917+00	Student	Moodle	mock_student_26	19cba470-de8d-484d-8796-4ef983caf977	mock_lecturer_id
35bc0bcb-a355-485f-8a90-afc029eff66d	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-11 05:03:55.9496+00	Student	Moodle	mock_student_31	d37dbca8-a14d-48b6-9c76-03798ce23e4c	mock_lecturer_id
3e21a304-5e66-4c52-8d05-0ff777df56dd	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-04 04:03:45.72065+00	Student	Moodle	mock_student_30	111d2a59-d2c3-4ec5-b224-c68e313e89c0	mock_lecturer_id
4908ab48-9000-46ca-a4cd-3af98431e955	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-11 04:22:16.599647+00	Student	Moodle	mock_student_44	3d1e006d-e527-4702-85c9-87dd238f6cf7	mock_lecturer_id
4e648d08-e4a1-4016-90dd-ae56a0038a86	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-11 15:05:29.30697+00	Student	Moodle	mock_student_7	5e2f9f3f-4a03-4d86-a904-be5d13eeb394	mock_lecturer_id
57de6a27-93bf-4644-9c08-cf0c13b632ec	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-11 05:03:02.800421+00	Student	Moodle	mock_student_42	93780427-2f73-4be3-8ad8-5134447d3c15	mock_lecturer_id
5fff75cf-40bb-41d4-8366-9faa40e1db49	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-12 23:19:50.479637+00	Student	Moodle	mock_student_23	6cf276e8-1e01-4aed-aadc-702b9aa2fc9e	mock_lecturer_id
6354eb40-5a51-4e5d-b762-d363a5b03b46	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-11 20:49:28.932187+00	Student	Moodle	mock_student_46	45bb767b-fd72-4616-98cc-9cd39a4857a8	mock_lecturer_id
6a2a2f42-de60-4a82-bbb2-0770fd3442b0	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-12 10:54:33.577725+00	Student	Moodle	mock_student_43	4c16421b-b5f9-4d0a-b90b-aa5dbcbf158c	mock_lecturer_id
78bb0765-d573-482f-a6f8-3ea3961830a2	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-13 22:45:10.480176+00	Student	Moodle	mock_student_36	3b1d5d66-bee9-4896-9ecb-60c11190a452	mock_lecturer_id
78c990ec-f3cd-4042-a5d1-6f9ebb6dfe15	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-10 08:38:12.899865+00	Student	Moodle	mock_student_38	e40a9666-0963-43ae-8810-fb780d0e4330	mock_lecturer_id
7b385f97-ad74-41c7-98c7-5d8af824779a	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-14 08:38:40.163125+00	Student	Moodle	mock_student_20	28bf173f-3dd6-46c3-92c0-fd1673098256	mock_lecturer_id
7be11547-568f-45b8-942f-5e02224c019f	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-05 07:25:27.349646+00	Student	Moodle	mock_student_2	33793f33-c241-4400-aaa9-651265ea2740	mock_lecturer_id
8194ef11-8017-4893-beb1-513fab0e2c69	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-13 11:39:44.486297+00	Student	Moodle	mock_student_10	5beb8b7d-ac14-4d45-b411-d529ed09bc19	mock_lecturer_id
89877655-d7e6-4971-8f84-a199f8debd8a	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-06 04:06:59.171141+00	Student	Moodle	mock_student_33	0983fcef-b6a9-40b0-b9d6-56867a9ca744	mock_lecturer_id
97e801cd-458b-4d6d-a68b-0918436225cb	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-10 20:50:40.285934+00	Student	Moodle	mock_student_19	53a3d8b2-7959-4f12-af39-abe9c803cc2b	mock_lecturer_id
9d3e781b-dbf0-425f-b095-dd3242ed2edc	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-12 04:47:31.395414+00	Student	Moodle	mock_student_17	9857c7af-a74a-4190-b702-a15c8d857112	mock_lecturer_id
9e63fa8b-1ae6-4c8b-ba08-674920986c27	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-08 09:35:53.943571+00	Student	Moodle	mock_student_5	09b9c751-5629-46b3-b861-8c4ad632e6c6	mock_lecturer_id
a22969cd-e499-449e-85c5-de203e5421e2	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-12 18:00:43.976962+00	Student	Moodle	mock_student_35	123399bb-5faf-4435-8bd3-3da12c51ebf4	mock_lecturer_id
a859808d-b9bc-4b0a-b2c8-3793010e2cd6	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-09 16:47:50.472897+00	Student	Moodle	mock_student_15	60e1edc2-7d84-4dd7-88c6-15198a31ba8e	mock_lecturer_id
ad79126a-3635-4af4-a270-1160b8a53ee1	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-02 04:11:29.664904+00	Student	Moodle	mock_student_25	52613acc-9474-4553-96a5-942016d6bd09	mock_lecturer_id
ae281dba-c146-4f7d-af7c-4096830c7e58	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-13 00:31:08.430686+00	Student	Moodle	mock_student_29	f799f805-ba46-486f-a134-04c0999461d0	mock_lecturer_id
b4a1e222-4d19-4ea8-9d21-ff20920e9118	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-14 05:11:45.154015+00	Student	Moodle	mock_student_6	4136befd-6d57-4d11-a952-922582725d5a	mock_lecturer_id
bb974802-4d2b-4067-9d14-7862e1eac0a6	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-10 10:36:37.630191+00	Student	Moodle	mock_student_1	50d459ae-1469-4b7a-bddf-873971ae8318	mock_lecturer_id
becec514-d0f4-42b9-b314-53d2617c3b49	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-12 21:52:55.950686+00	Student	Moodle	mock_student_14	d8697d37-1f3d-4126-a993-a78b804d49f5	mock_lecturer_id
c0ec0772-4454-45ef-923f-fcd4396ff825	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-11 01:25:43.145088+00	Student	Moodle	mock_student_18	fb3e6b4c-ee86-4624-8acc-223ec99762a4	mock_lecturer_id
cc6e4c1e-0d0b-4a97-aa29-f0c6b21d8478	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-11 13:34:07.30138+00	Student	Moodle	mock_student_3	28298440-c49b-4767-ba7a-68e5fd2e7313	mock_lecturer_id
d52887a3-532b-4417-af4e-b340078d09b1	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-09 03:05:28.888241+00	Student	Moodle	mock_student_13	3598590a-ebdc-4f4a-8aff-b6788e2ce83a	mock_lecturer_id
dba4fd38-922c-4740-b001-0429c2440fdf	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-10 05:51:08.512873+00	Student	Moodle	mock_student_47	81545a2a-cb44-4397-bf0c-d1cd7510cb1f	mock_lecturer_id
e073e7f0-c467-4837-9248-a6f464bddda3	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-07 22:52:38.365812+00	Student	Moodle	mock_student_22	a7ba9fe9-00f4-4b73-a390-b9880d7d2ae0	mock_lecturer_id
e520ca12-1d7d-4d5c-8123-5a1c1c67c713	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-14 05:37:03.083019+00	Student	Moodle	mock_student_21	cfc9934d-4474-4072-9f87-f9dfcbc18798	mock_lecturer_id
edd18022-01f4-4b92-962b-46de9abbad59	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-13 00:44:00.886565+00	Student	Moodle	mock_student_32	628a2167-4d4b-4089-976a-984f753db5dc	mock_lecturer_id
eec2bd96-904c-45be-b155-9161869cde89	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-14 12:33:25.356296+00	Student	Moodle	mock_student_4	90f284d1-84a9-4d5a-840e-e3959322334c	mock_lecturer_id
f2848535-92bf-44d4-a1e8-461334616339	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-14 00:23:23.493276+00	Student	Moodle	mock_student_16	aca08b7b-548e-4d02-92d8-73ff414fcc3a	mock_lecturer_id
f3ea344c-116e-4ebe-86a8-2d6af6c2875a	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-10 03:57:09.605889+00	Student	Moodle	mock_student_11	b733295d-51b4-4316-8671-e9c3b6a6d058	mock_lecturer_id
229fad21-addd-4a32-934e-de119b739bcd	3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	2026-03-15 23:49:22.664149+00	Public	None	\N	ddfdb856-03ce-4e2d-be02-8bba163a16f1	\N
\.


--
-- Data for Name: StudentEnrollment; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."StudentEnrollment" ("EnrollmentId", "StudentId", "ModuleOfferingId") FROM stdin;
efa704e3-76e4-4b02-a38b-44e6641e3ad4	1234567	ddfdb856-03ce-4e2d-be02-8bba163a16f1
f2440786-da52-4dba-b029-d0d32b5cd3d7	1234567	28c22ca3-3a68-46a3-96bb-e101f64fedda
\.


--
-- Data for Name: SurveyQuestions; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."SurveyQuestions" ("QuestionId", "QuestionText", "QuestionKey", "Type", "LikertMin", "LikertMax", "LikertLabels", "Choices", "OrderIndex", "SectionId") FROM stdin;
1fcae0da-f766-4d69-ba23-534f04c08fa0	The course content was engaging and relevant.	Q1_Content	Likert	\N	\N	\N	\N	1	551bfa4c-8490-4b86-a801-bc019fea30e0
245d1f4b-be09-46ce-ad8d-f24a994ce353	Do you have any additional comments?	Q4_Comments	FreeText	\N	\N	\N	\N	4	551bfa4c-8490-4b86-a801-bc019fea30e0
29fa1d0c-3ae2-41e7-8000-63468ffbe889	Which resources did you find most helpful?	Q3_Resources	MultipleChoice	\N	\N	\N	["Lecture Recordings","Slide Decks","Reading Materials","Tutorials"]	3	551bfa4c-8490-4b86-a801-bc019fea30e0
5b5decdd-a156-468e-8d07-1d3de1949882	The lecturer provided clear and helpful feedback.	Q2_Feedback	Likert	\N	\N	\N	\N	2	551bfa4c-8490-4b86-a801-bc019fea30e0
\.


--
-- Data for Name: SurveySections; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."SurveySections" ("SectionId", "SurveyVersionId", "Title", "Instructions", "OrderIndex") FROM stdin;
551bfa4c-8490-4b86-a801-bc019fea30e0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	Course Content & Delivery	Please rate the following aspects of the course.	1
\.


--
-- Data for Name: SurveyTemplates; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."SurveyTemplates" ("SurveyTemplateId", "Name", "Description") FROM stdin;
efb11aaf-a83c-4c3c-be54-0519cab47b68	Student Experience Survey - Spring 2026	A comprehensive survey evaluating the recent semester's learning resources and teaching quality.
\.


--
-- Data for Name: SurveyVersions; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."SurveyVersions" ("SurveyVersionId", "SurveyTemplateId", "MinResponsesToPublish", "ResultsVisibilityPolicy", "IsLocked", "Semester", "Year", "ModuleOfferingId", "LecturerAssignmentId", "Status", "AccessPolicyType") FROM stdin;
138ecc78-05be-404e-b21f-b3b0b8ad05a7	efb11aaf-a83c-4c3c-be54-0519cab47b68	5	PublicAfterCloseAndThreshold	f	Semester 1	2026	ddfdb856-03ce-4e2d-be02-8bba163a16f1	\N	Published	PublicAnonymous
\.


--
-- Data for Name: SurveyWindowAudits; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."SurveyWindowAudits" ("WindowId", "PerformedAt", "Action", "PerformedBy", "OldOpensAt", "OldClosesAt", "NewOpensAt", "NewClosesAt", "Reason") FROM stdin;
3bce511f-95f7-4e8e-a890-590ddfac5be0	2026-03-14 23:46:54.478321+00	Closed	system	2026-03-01 23:46:54.4779+00	2026-03-14 23:46:54.47791+00	\N	\N	\N
3bce511f-95f7-4e8e-a890-590ddfac5be0	2026-03-15 23:46:54.478216+00	Created	system	\N	\N	2026-03-01 23:46:54.4779+00	2026-03-14 23:46:54.47791+00	\N
\.


--
-- Data for Name: SurveyWindows; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."SurveyWindows" ("WindowId", "SurveyVersionId", "Semester", "Year", "OpensAt", "ClosesAt", "Enabled", "ClosedAt", "ReopenAllowedDays", "ReopenedCount", "LastReopenedAt", "ScopeType", "ScopeId") FROM stdin;
3bce511f-95f7-4e8e-a890-590ddfac5be0	138ecc78-05be-404e-b21f-b3b0b8ad05a7	Semester 1	2026	2026-03-01 23:46:54.4779+00	2026-03-14 23:46:54.47791+00	t	2026-03-14 23:46:54.478321+00	\N	0	\N	Global	\N
\.


--
-- Data for Name: VendorAds; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."VendorAds" ("Id", "VendorName", "OfferText", "BannerImageUrl", "ExpiresAt", "IsActive") FROM stdin;
\.


--
-- Data for Name: __EFMigrationsHistory; Type: TABLE DATA; Schema: public; Owner: olmies_user
--

COPY public."__EFMigrationsHistory" ("MigrationId", "ProductVersion") FROM stdin;
20260208043434_InitialCreate	8.0.24
20260208051204_AddResponseTables	8.0.24
20260227194624_MultipleChoiceSupport	8.0.24
20260227232510_UpdateNullableConstraints	8.0.24
20260228013024_AddMarketingEntities	8.0.24
20260308020811_AddAdminUser	8.0.24
20260308034201_AddAdminAuditFields	8.0.24
20260308185829_AddRefreshTokenToAdmin	8.0.24
\.


--
-- Name: AdminUsers PK_AdminUsers; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."AdminUsers"
    ADD CONSTRAINT "PK_AdminUsers" PRIMARY KEY ("Id");


--
-- Name: Announcements PK_Announcements; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."Announcements"
    ADD CONSTRAINT "PK_Announcements" PRIMARY KEY ("Id");


--
-- Name: DevicePushTokens PK_DevicePushTokens; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."DevicePushTokens"
    ADD CONSTRAINT "PK_DevicePushTokens" PRIMARY KEY ("Id");


--
-- Name: InstitutionConfigs PK_InstitutionConfigs; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."InstitutionConfigs"
    ADD CONSTRAINT "PK_InstitutionConfigs" PRIMARY KEY ("Id");


--
-- Name: LecturerAssignments PK_LecturerAssignments; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."LecturerAssignments"
    ADD CONSTRAINT "PK_LecturerAssignments" PRIMARY KEY ("AssignmentId");


--
-- Name: ModuleOfferings PK_ModuleOfferings; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."ModuleOfferings"
    ADD CONSTRAINT "PK_ModuleOfferings" PRIMARY KEY ("ModuleOfferingId");


--
-- Name: ResponseAnswers PK_ResponseAnswers; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."ResponseAnswers"
    ADD CONSTRAINT "PK_ResponseAnswers" PRIMARY KEY ("AnswerId");


--
-- Name: ResponseHeaders PK_ResponseHeaders; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."ResponseHeaders"
    ADD CONSTRAINT "PK_ResponseHeaders" PRIMARY KEY ("ResponseId");


--
-- Name: StudentEnrollment PK_StudentEnrollment; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."StudentEnrollment"
    ADD CONSTRAINT "PK_StudentEnrollment" PRIMARY KEY ("EnrollmentId");


--
-- Name: SurveyQuestions PK_SurveyQuestions; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."SurveyQuestions"
    ADD CONSTRAINT "PK_SurveyQuestions" PRIMARY KEY ("QuestionId");


--
-- Name: SurveySections PK_SurveySections; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."SurveySections"
    ADD CONSTRAINT "PK_SurveySections" PRIMARY KEY ("SectionId");


--
-- Name: SurveyTemplates PK_SurveyTemplates; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."SurveyTemplates"
    ADD CONSTRAINT "PK_SurveyTemplates" PRIMARY KEY ("SurveyTemplateId");


--
-- Name: SurveyVersions PK_SurveyVersions; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."SurveyVersions"
    ADD CONSTRAINT "PK_SurveyVersions" PRIMARY KEY ("SurveyVersionId");


--
-- Name: SurveyWindowAudits PK_SurveyWindowAudits; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."SurveyWindowAudits"
    ADD CONSTRAINT "PK_SurveyWindowAudits" PRIMARY KEY ("WindowId", "PerformedAt");


--
-- Name: SurveyWindows PK_SurveyWindows; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."SurveyWindows"
    ADD CONSTRAINT "PK_SurveyWindows" PRIMARY KEY ("WindowId");


--
-- Name: VendorAds PK_VendorAds; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."VendorAds"
    ADD CONSTRAINT "PK_VendorAds" PRIMARY KEY ("Id");


--
-- Name: __EFMigrationsHistory PK___EFMigrationsHistory; Type: CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."__EFMigrationsHistory"
    ADD CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId");


--
-- Name: IX_AdminUsers_Username; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE UNIQUE INDEX "IX_AdminUsers_Username" ON public."AdminUsers" USING btree ("Username");


--
-- Name: IX_LecturerAssignments_LecturerId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_LecturerAssignments_LecturerId" ON public."LecturerAssignments" USING btree ("LecturerId");


--
-- Name: IX_LecturerAssignments_LecturerId_ModuleOfferingId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_LecturerAssignments_LecturerId_ModuleOfferingId" ON public."LecturerAssignments" USING btree ("LecturerId", "ModuleOfferingId");


--
-- Name: IX_LecturerAssignments_ModuleOfferingId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_LecturerAssignments_ModuleOfferingId" ON public."LecturerAssignments" USING btree ("ModuleOfferingId");


--
-- Name: IX_ModuleOfferings_ModuleCode; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_ModuleOfferings_ModuleCode" ON public."ModuleOfferings" USING btree ("ModuleCode");


--
-- Name: IX_ModuleOfferings_Semester_Year; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_ModuleOfferings_Semester_Year" ON public."ModuleOfferings" USING btree ("Semester", "Year");


--
-- Name: IX_ResponseAnswer_Question; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_ResponseAnswer_Question" ON public."ResponseAnswers" USING btree ("QuestionId");


--
-- Name: IX_ResponseAnswer_ResponseHeader; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_ResponseAnswer_ResponseHeader" ON public."ResponseAnswers" USING btree ("ResponseHeaderId");


--
-- Name: IX_ResponseHeader_HashedResponderId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_ResponseHeader_HashedResponderId" ON public."ResponseHeaders" USING btree ("HashedResponderId");


--
-- Name: IX_ResponseHeader_ModuleLecturer; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_ResponseHeader_ModuleLecturer" ON public."ResponseHeaders" USING btree ("ModuleOfferingId", "LecturerId");


--
-- Name: IX_ResponseHeader_SurveyVersion; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_ResponseHeader_SurveyVersion" ON public."ResponseHeaders" USING btree ("SurveyVersionId");


--
-- Name: IX_ResponseHeader_WindowSubmitted; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_ResponseHeader_WindowSubmitted" ON public."ResponseHeaders" USING btree ("SurveyWindowId", "SubmittedAt");


--
-- Name: IX_StudentEnrollment_StudentId_ModuleOfferingId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE UNIQUE INDEX "IX_StudentEnrollment_StudentId_ModuleOfferingId" ON public."StudentEnrollment" USING btree ("StudentId", "ModuleOfferingId");


--
-- Name: IX_SurveyQuestions_QuestionKey; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_SurveyQuestions_QuestionKey" ON public."SurveyQuestions" USING btree ("QuestionKey");


--
-- Name: IX_SurveyQuestions_QuestionKey_Type; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_SurveyQuestions_QuestionKey_Type" ON public."SurveyQuestions" USING btree ("QuestionKey", "Type");


--
-- Name: IX_SurveyQuestions_SectionId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_SurveyQuestions_SectionId" ON public."SurveyQuestions" USING btree ("SectionId");


--
-- Name: IX_SurveySections_SurveyVersionId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_SurveySections_SurveyVersionId" ON public."SurveySections" USING btree ("SurveyVersionId");


--
-- Name: IX_SurveyVersions_Semester_Year; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_SurveyVersions_Semester_Year" ON public."SurveyVersions" USING btree ("Semester", "Year");


--
-- Name: IX_SurveyVersions_SurveyTemplateId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_SurveyVersions_SurveyTemplateId" ON public."SurveyVersions" USING btree ("SurveyTemplateId");


--
-- Name: IX_SurveyVersions_SurveyVersionId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_SurveyVersions_SurveyVersionId" ON public."SurveyVersions" USING btree ("SurveyVersionId");


--
-- Name: IX_SurveyWindowAudits_WindowId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_SurveyWindowAudits_WindowId" ON public."SurveyWindowAudits" USING btree ("WindowId");


--
-- Name: IX_SurveyWindows_ScopeType_ScopeId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_SurveyWindows_ScopeType_ScopeId" ON public."SurveyWindows" USING btree ("ScopeType", "ScopeId");


--
-- Name: IX_SurveyWindows_Semester_Year; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_SurveyWindows_Semester_Year" ON public."SurveyWindows" USING btree ("Semester", "Year");


--
-- Name: IX_SurveyWindows_SurveyVersionId; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE INDEX "IX_SurveyWindows_SurveyVersionId" ON public."SurveyWindows" USING btree ("SurveyVersionId");


--
-- Name: UQ_ResponseHeader_ModuleEvaluation; Type: INDEX; Schema: public; Owner: olmies_user
--

CREATE UNIQUE INDEX "UQ_ResponseHeader_ModuleEvaluation" ON public."ResponseHeaders" USING btree ("SurveyWindowId", "ModuleOfferingId", "LecturerId", "HashedResponderId");


--
-- Name: LecturerAssignments FK_LecturerAssignments_ModuleOfferings_ModuleOfferingId; Type: FK CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."LecturerAssignments"
    ADD CONSTRAINT "FK_LecturerAssignments_ModuleOfferings_ModuleOfferingId" FOREIGN KEY ("ModuleOfferingId") REFERENCES public."ModuleOfferings"("ModuleOfferingId") ON DELETE RESTRICT;


--
-- Name: ResponseAnswers FK_ResponseAnswers_ResponseHeaders_ResponseHeaderId; Type: FK CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."ResponseAnswers"
    ADD CONSTRAINT "FK_ResponseAnswers_ResponseHeaders_ResponseHeaderId" FOREIGN KEY ("ResponseHeaderId") REFERENCES public."ResponseHeaders"("ResponseId") ON DELETE CASCADE;


--
-- Name: ResponseAnswers FK_ResponseAnswers_SurveyQuestions_QuestionId; Type: FK CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."ResponseAnswers"
    ADD CONSTRAINT "FK_ResponseAnswers_SurveyQuestions_QuestionId" FOREIGN KEY ("QuestionId") REFERENCES public."SurveyQuestions"("QuestionId") ON DELETE RESTRICT;


--
-- Name: ResponseHeaders FK_ResponseHeaders_SurveyVersions_SurveyVersionId; Type: FK CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."ResponseHeaders"
    ADD CONSTRAINT "FK_ResponseHeaders_SurveyVersions_SurveyVersionId" FOREIGN KEY ("SurveyVersionId") REFERENCES public."SurveyVersions"("SurveyVersionId") ON DELETE RESTRICT;


--
-- Name: ResponseHeaders FK_ResponseHeaders_SurveyWindows_SurveyWindowId; Type: FK CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."ResponseHeaders"
    ADD CONSTRAINT "FK_ResponseHeaders_SurveyWindows_SurveyWindowId" FOREIGN KEY ("SurveyWindowId") REFERENCES public."SurveyWindows"("WindowId") ON DELETE RESTRICT;


--
-- Name: SurveyQuestions FK_SurveyQuestions_SurveySections_SectionId; Type: FK CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."SurveyQuestions"
    ADD CONSTRAINT "FK_SurveyQuestions_SurveySections_SectionId" FOREIGN KEY ("SectionId") REFERENCES public."SurveySections"("SectionId") ON DELETE CASCADE;


--
-- Name: SurveySections FK_SurveySections_SurveyVersions_SurveyVersionId; Type: FK CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."SurveySections"
    ADD CONSTRAINT "FK_SurveySections_SurveyVersions_SurveyVersionId" FOREIGN KEY ("SurveyVersionId") REFERENCES public."SurveyVersions"("SurveyVersionId") ON DELETE CASCADE;


--
-- Name: SurveyVersions FK_SurveyVersions_SurveyTemplates_SurveyTemplateId; Type: FK CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."SurveyVersions"
    ADD CONSTRAINT "FK_SurveyVersions_SurveyTemplates_SurveyTemplateId" FOREIGN KEY ("SurveyTemplateId") REFERENCES public."SurveyTemplates"("SurveyTemplateId") ON DELETE RESTRICT;


--
-- Name: SurveyWindowAudits FK_SurveyWindowAudits_SurveyWindows_WindowId; Type: FK CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."SurveyWindowAudits"
    ADD CONSTRAINT "FK_SurveyWindowAudits_SurveyWindows_WindowId" FOREIGN KEY ("WindowId") REFERENCES public."SurveyWindows"("WindowId") ON DELETE CASCADE;


--
-- Name: SurveyWindows FK_SurveyWindows_SurveyVersions_SurveyVersionId; Type: FK CONSTRAINT; Schema: public; Owner: olmies_user
--

ALTER TABLE ONLY public."SurveyWindows"
    ADD CONSTRAINT "FK_SurveyWindows_SurveyVersions_SurveyVersionId" FOREIGN KEY ("SurveyVersionId") REFERENCES public."SurveyVersions"("SurveyVersionId") ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict LdWQWrem9dYRgbIqc1uuqAlx6MFsbIHpJlracFXzhEQOoJxgQWT3TGvipKgoQpN

