--
-- PostgreSQL database dump
--

\restrict lvWJAWJPrpUCVo8hTEP06WbWaLmkKvqHZKdInGDAte6zRbGlpe9qe3Xk5TOUr0x

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

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
-- Name: assessment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment (
    assessment_id character varying(20) NOT NULL,
    title character varying(50) NOT NULL,
    weight_percentage numeric(5,2) NOT NULL,
    due_date date NOT NULL,
    course_id character varying(20) NOT NULL,
    prereq_assessment_id character varying(20),
    CONSTRAINT assessment_weight_percentage_check CHECK (((weight_percentage > 0.00) AND (weight_percentage <= 100.00)))
);


--
-- Name: course; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course (
    course_id character varying(20) NOT NULL,
    course_name character varying(50) NOT NULL,
    term character varying(20) NOT NULL,
    target_grade numeric(5,2),
    student_id character varying(20) NOT NULL,
    CONSTRAINT course_target_grade_check CHECK (((target_grade >= 0.00) AND (target_grade <= 100.00)))
);


--
-- Name: task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task (
    task_id character varying(20) NOT NULL,
    assessment_id character varying(20) NOT NULL,
    task_name character varying(50) NOT NULL,
    description character varying(200),
    estimated_hours numeric(5,2) NOT NULL,
    is_completed boolean DEFAULT false,
    CONSTRAINT task_estimated_hours_check CHECK ((estimated_hours > 0.00))
);


--
-- Name: assessmentpriority; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.assessmentpriority AS
 SELECT c.student_id,
    c.course_id,
    c.course_name,
    a.assessment_id,
    a.title,
    a.weight_percentage,
    a.due_date,
    (a.due_date - CURRENT_DATE) AS days_remaining,
    round((a.weight_percentage / (((a.due_date - CURRENT_DATE) + 1))::numeric), 2) AS priority_score
   FROM (public.assessment a
     JOIN public.course c ON (((a.course_id)::text = (c.course_id)::text)))
  WHERE ((a.due_date >= CURRENT_DATE) AND (EXISTS ( SELECT 1
           FROM public.task t
          WHERE (((t.assessment_id)::text = (a.assessment_id)::text) AND (t.is_completed = false)))));


--
-- Name: assessmentsabovecourseaverage; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.assessmentsabovecourseaverage AS
 SELECT assessment_id,
    course_id,
    title,
    weight_percentage,
    due_date
   FROM public.assessment a
  WHERE (weight_percentage > ( SELECT avg(a2.weight_percentage) AS avg
           FROM public.assessment a2
          WHERE ((a2.course_id)::text = (a.course_id)::text)));


--
-- Name: assessmentsexceedingcourseaverages; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.assessmentsexceedingcourseaverages AS
 SELECT c.student_id,
    c.course_id,
    c.course_name,
    a.assessment_id,
    a.title,
    a.weight_percentage,
    a.due_date
   FROM (public.assessment a
     JOIN public.course c ON (((a.course_id)::text = (c.course_id)::text)))
  WHERE (a.weight_percentage > ALL ( SELECT avg(a2.weight_percentage) AS avg
           FROM (public.assessment a2
             JOIN public.course c2 ON (((a2.course_id)::text = (c2.course_id)::text)))
          WHERE ((c2.student_id)::text = (c.student_id)::text)
          GROUP BY a2.course_id));


--
-- Name: studysession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.studysession (
    session_id character varying(20) NOT NULL,
    session_date date NOT NULL,
    duration_min integer NOT NULL,
    productivity integer,
    assessment_id character varying(20),
    CONSTRAINT studysession_duration_min_check CHECK ((duration_min > 0)),
    CONSTRAINT studysession_productivity_check CHECK (((productivity >= 1) AND (productivity <= 5)))
);


--
-- Name: assessmentstudysessioncoverage; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.assessmentstudysessioncoverage AS
 SELECT a.assessment_id,
    a.title,
    a.course_id,
    ss.session_id,
    ss.session_date,
    ss.duration_min,
    ss.productivity
   FROM (public.assessment a
     FULL JOIN public.studysession ss ON (((a.assessment_id)::text = (ss.assessment_id)::text)));


--
-- Name: assessmentswithactivity; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.assessmentswithactivity AS
 SELECT assessment_id,
    course_id,
    title,
    weight_percentage,
    due_date
   FROM public.assessment a
  WHERE ((assessment_id)::text IN ( SELECT t.assessment_id
           FROM public.task t
        UNION
         SELECT ss.assessment_id
           FROM public.studysession ss
          WHERE (ss.assessment_id IS NOT NULL)));


--
-- Name: overdueincompletetasks; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.overdueincompletetasks AS
 SELECT c.student_id,
    c.course_id,
    c.course_name,
    a.assessment_id,
    a.title AS assessment_title,
    t.task_id,
    t.task_name,
    t.estimated_hours,
    a.due_date,
    (CURRENT_DATE - a.due_date) AS days_overdue
   FROM ((public.task t
     JOIN public.assessment a ON (((t.assessment_id)::text = (a.assessment_id)::text)))
     JOIN public.course c ON (((a.course_id)::text = (c.course_id)::text)))
  WHERE ((t.is_completed = false) AND (a.due_date < CURRENT_DATE));


--
-- Name: planner_account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_account (
    account_id bigint NOT NULL,
    username character varying(50) NOT NULL,
    password_hash text NOT NULL,
    role character varying(10) NOT NULL,
    student_id character varying(20),
    CONSTRAINT planner_account_check CHECK ((((role)::text <> 'user'::text) OR (student_id IS NOT NULL))),
    CONSTRAINT planner_account_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'user'::character varying, 'guest'::character varying])::text[]))),
    CONSTRAINT planner_account_username_check CHECK (((username)::text ~ '^[a-z0-9_]{3,50}$'::text))
);


--
-- Name: planner_account_account_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.planner_account ALTER COLUMN account_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.planner_account_account_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: public_holiday; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.public_holiday (
    holiday_id bigint NOT NULL,
    holiday_date date NOT NULL,
    local_name character varying(150) NOT NULL,
    holiday_name character varying(150) NOT NULL,
    country_code character(2) NOT NULL,
    holiday_year integer NOT NULL,
    fetched_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: public_holiday_holiday_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.public_holiday ALTER COLUMN holiday_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.public_holiday_holiday_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: student; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student (
    student_id character varying(20) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(80) NOT NULL
);


--
-- Name: studentassessmentoverview; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.studentassessmentoverview AS
 SELECT s.student_id,
    s.first_name,
    s.last_name,
    c.course_id,
    c.course_name,
    a.assessment_id,
    a.title,
    a.weight_percentage,
    a.due_date
   FROM ((public.student s
     JOIN public.course c ON (((s.student_id)::text = (c.student_id)::text)))
     JOIN public.assessment a ON (((c.course_id)::text = (a.course_id)::text)));


--
-- Name: studytimepercourse; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.studytimepercourse AS
 SELECT c.student_id,
    c.course_id,
    c.course_name,
    count(ss.session_id) AS session_count,
    COALESCE(sum(ss.duration_min), (0)::bigint) AS total_study_minutes
   FROM ((public.course c
     LEFT JOIN public.assessment a ON (((c.course_id)::text = (a.course_id)::text)))
     LEFT JOIN public.studysession ss ON (((a.assessment_id)::text = (ss.assessment_id)::text)))
  GROUP BY c.student_id, c.course_id, c.course_name;


--
-- Name: taskcompletionperassessment; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.taskcompletionperassessment AS
 SELECT a.assessment_id,
    a.course_id,
    a.title,
    count(t.task_id) AS total_tasks,
    count(
        CASE
            WHEN (t.is_completed = true) THEN 1
            ELSE NULL::integer
        END) AS completed_tasks,
    round(((100.0 * (count(
        CASE
            WHEN (t.is_completed = true) THEN 1
            ELSE NULL::integer
        END))::numeric) / (NULLIF(count(t.task_id), 0))::numeric), 2) AS completion_percentage,
        CASE
            WHEN (count(t.task_id) = 0) THEN 'No tasks'::text
            WHEN (count(
            CASE
                WHEN (t.is_completed = true) THEN 1
                ELSE NULL::integer
            END) = count(t.task_id)) THEN 'Complete'::text
            ELSE 'Incomplete'::text
        END AS task_status
   FROM (public.assessment a
     LEFT JOIN public.task t ON (((a.assessment_id)::text = (t.assessment_id)::text)))
  GROUP BY a.assessment_id, a.course_id, a.title;


--
-- Name: upcomingassessments; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.upcomingassessments AS
 SELECT c.student_id,
    c.course_id,
    c.course_name,
    a.assessment_id,
    a.title,
    a.weight_percentage,
    a.due_date,
    (a.due_date - CURRENT_DATE) AS days_remaining
   FROM (public.assessment a
     JOIN public.course c ON (((a.course_id)::text = (c.course_id)::text)))
  WHERE ((a.due_date >= CURRENT_DATE) AND (a.due_date <= (CURRENT_DATE + 7)));


--
-- Name: assessment assessment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment
    ADD CONSTRAINT assessment_pkey PRIMARY KEY (assessment_id);


--
-- Name: course course_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_pkey PRIMARY KEY (course_id);


--
-- Name: planner_account planner_account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_account
    ADD CONSTRAINT planner_account_pkey PRIMARY KEY (account_id);


--
-- Name: planner_account planner_account_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_account
    ADD CONSTRAINT planner_account_student_id_key UNIQUE (student_id);


--
-- Name: planner_account planner_account_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_account
    ADD CONSTRAINT planner_account_username_key UNIQUE (username);


--
-- Name: public_holiday public_holiday_country_code_holiday_date_holiday_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_holiday
    ADD CONSTRAINT public_holiday_country_code_holiday_date_holiday_name_key UNIQUE (country_code, holiday_date, holiday_name);


--
-- Name: public_holiday public_holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_holiday
    ADD CONSTRAINT public_holiday_pkey PRIMARY KEY (holiday_id);


--
-- Name: student student_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_email_key UNIQUE (email);


--
-- Name: student student_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_pkey PRIMARY KEY (student_id);


--
-- Name: studysession studysession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studysession
    ADD CONSTRAINT studysession_pkey PRIMARY KEY (session_id);


--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (task_id);


--
-- Name: assessment assessment_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment
    ADD CONSTRAINT assessment_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(course_id);


--
-- Name: assessment assessment_prereq_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment
    ADD CONSTRAINT assessment_prereq_assessment_id_fkey FOREIGN KEY (prereq_assessment_id) REFERENCES public.assessment(assessment_id);


--
-- Name: course course_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student(student_id);


--
-- Name: planner_account planner_account_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_account
    ADD CONSTRAINT planner_account_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student(student_id);


--
-- Name: studysession studysession_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studysession
    ADD CONSTRAINT studysession_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessment(assessment_id);


--
-- Name: task task_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessment(assessment_id);


--
-- PostgreSQL database dump complete
--

\unrestrict lvWJAWJPrpUCVo8hTEP06WbWaLmkKvqHZKdInGDAte6zRbGlpe9qe3Xk5TOUr0x

