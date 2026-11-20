--
-- PostgreSQL database dump
--

\restrict akyIg6UBm1A3zwsi0eJwMHSER7wxRwu59qrWkMcDMhGm7BoUWVEuwTiqmN3U9J8

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

--
-- Data for Name: student; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.student (student_id, first_name, last_name, email) VALUES ('S001', 'Alex', 'Morgan', 'alex.morgan@example.com');
INSERT INTO public.student (student_id, first_name, last_name, email) VALUES ('S002', 'Sarah', 'Ahmed', 'sarah.ahmed@example.com');
INSERT INTO public.student (student_id, first_name, last_name, email) VALUES ('S003', 'Daniel', 'Lee', 'daniel.lee@example.com');
INSERT INTO public.student (student_id, first_name, last_name, email) VALUES ('S004', 'Emily', 'Chen', 'emily.chen@example.com');
INSERT INTO public.student (student_id, first_name, last_name, email) VALUES ('S005', 'Omar', 'Hassan', 'omar.hassan@example.com');
INSERT INTO public.student (student_id, first_name, last_name, email) VALUES ('S006', 'Maya', 'Patel', 'maya.patel@example.com');


--
-- Data for Name: course; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.course (course_id, course_name, term, target_grade, student_id) VALUES ('C001', 'Database Systems', 'Fall 2026', 85.00, 'S001');
INSERT INTO public.course (course_id, course_name, term, target_grade, student_id) VALUES ('C002', 'Algorithms', 'Fall 2026', 90.00, 'S001');
INSERT INTO public.course (course_id, course_name, term, target_grade, student_id) VALUES ('C003', 'Artificial Intelligence', 'Fall 2026', 88.00, 'S002');
INSERT INTO public.course (course_id, course_name, term, target_grade, student_id) VALUES ('C004', 'Software Engineering', 'Fall 2026', 82.00, 'S003');
INSERT INTO public.course (course_id, course_name, term, target_grade, student_id) VALUES ('C005', 'Computer Networks', 'Fall 2026', 87.00, 'S004');
INSERT INTO public.course (course_id, course_name, term, target_grade, student_id) VALUES ('C006', 'Operating Systems', 'Fall 2026', 85.00, 'S005');


--
-- Data for Name: assessment; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.assessment (assessment_id, title, weight_percentage, due_date, course_id, prereq_assessment_id) VALUES ('A001', 'Database Midterm', 25.00, '2026-10-20', 'C001', NULL);
INSERT INTO public.assessment (assessment_id, title, weight_percentage, due_date, course_id, prereq_assessment_id) VALUES ('A002', 'Database Project', 30.00, '2026-11-23', 'C001', 'A001');
INSERT INTO public.assessment (assessment_id, title, weight_percentage, due_date, course_id, prereq_assessment_id) VALUES ('A003', 'Algorithms Midterm', 30.00, '2026-10-21', 'C002', NULL);
INSERT INTO public.assessment (assessment_id, title, weight_percentage, due_date, course_id, prereq_assessment_id) VALUES ('A004', 'Algorithms Final', 40.00, '2026-12-15', 'C002', 'A003');
INSERT INTO public.assessment (assessment_id, title, weight_percentage, due_date, course_id, prereq_assessment_id) VALUES ('A005', 'AI Assignment', 20.00, '2026-11-12', 'C003', NULL);
INSERT INTO public.assessment (assessment_id, title, weight_percentage, due_date, course_id, prereq_assessment_id) VALUES ('A006', 'AI Final Exam', 35.00, '2026-12-14', 'C003', 'A005');
INSERT INTO public.assessment (assessment_id, title, weight_percentage, due_date, course_id, prereq_assessment_id) VALUES ('A007', 'Software Design Project', 35.00, '2026-11-18', 'C004', NULL);
INSERT INTO public.assessment (assessment_id, title, weight_percentage, due_date, course_id, prereq_assessment_id) VALUES ('A008', 'Networks Lab', 15.00, '2026-11-16', 'C005', NULL);
INSERT INTO public.assessment (assessment_id, title, weight_percentage, due_date, course_id, prereq_assessment_id) VALUES ('A009', 'OS Assignment', 20.00, '2026-11-20', 'C006', NULL);
INSERT INTO public.assessment (assessment_id, title, weight_percentage, due_date, course_id, prereq_assessment_id) VALUES ('A010', 'OS Final Exam', 40.00, '2026-12-17', 'C006', 'A009');


--
-- Data for Name: studysession; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.studysession (session_id, session_date, duration_min, productivity, assessment_id) VALUES ('SS001', '2026-10-15', 120, 4, 'A001');
INSERT INTO public.studysession (session_id, session_date, duration_min, productivity, assessment_id) VALUES ('SS002', '2026-10-18', 90, 5, 'A001');
INSERT INTO public.studysession (session_id, session_date, duration_min, productivity, assessment_id) VALUES ('SS003', '2026-10-19', 150, 3, 'A003');
INSERT INTO public.studysession (session_id, session_date, duration_min, productivity, assessment_id) VALUES ('SS004', '2026-11-01', 120, 4, 'A002');
INSERT INTO public.studysession (session_id, session_date, duration_min, productivity, assessment_id) VALUES ('SS005', '2026-11-03', 90, 5, 'A002');
INSERT INTO public.studysession (session_id, session_date, duration_min, productivity, assessment_id) VALUES ('SS006', '2026-11-04', 60, 3, 'A005');
INSERT INTO public.studysession (session_id, session_date, duration_min, productivity, assessment_id) VALUES ('SS007', '2026-11-05', 120, 4, 'A007');
INSERT INTO public.studysession (session_id, session_date, duration_min, productivity, assessment_id) VALUES ('SS008', '2026-11-06', 75, 2, 'A008');
INSERT INTO public.studysession (session_id, session_date, duration_min, productivity, assessment_id) VALUES ('SS009', '2026-11-07', 90, 4, 'A009');
INSERT INTO public.studysession (session_id, session_date, duration_min, productivity, assessment_id) VALUES ('SS010', '2026-11-08', 120, 5, 'A004');


--
-- Data for Name: task; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.task (task_id, assessment_id, task_name, description, estimated_hours, is_completed) VALUES ('T001', 'A001', 'Review SQL Joins', 'Practice joining tables', 3.00, true);
INSERT INTO public.task (task_id, assessment_id, task_name, description, estimated_hours, is_completed) VALUES ('T002', 'A002', 'Design Database Schema', 'Create relational tables', 5.00, true);
INSERT INTO public.task (task_id, assessment_id, task_name, description, estimated_hours, is_completed) VALUES ('T003', 'A002', 'Write SQL Views', 'Create ten useful views', 6.00, false);
INSERT INTO public.task (task_id, assessment_id, task_name, description, estimated_hours, is_completed) VALUES ('T004', 'A003', 'Practice Sorting', 'Review sorting algorithms', 4.00, true);
INSERT INTO public.task (task_id, assessment_id, task_name, description, estimated_hours, is_completed) VALUES ('T005', 'A004', 'Study Dynamic Programming', 'Solve DP problems', 6.00, false);
INSERT INTO public.task (task_id, assessment_id, task_name, description, estimated_hours, is_completed) VALUES ('T006', 'A005', 'Implement A Star', 'Complete search algorithm', 4.00, false);
INSERT INTO public.task (task_id, assessment_id, task_name, description, estimated_hours, is_completed) VALUES ('T007', 'A006', 'Review AI Concepts', 'Prepare for final exam', 5.00, false);
INSERT INTO public.task (task_id, assessment_id, task_name, description, estimated_hours, is_completed) VALUES ('T008', 'A007', 'Create UML Diagram', 'Design system models', 3.00, true);
INSERT INTO public.task (task_id, assessment_id, task_name, description, estimated_hours, is_completed) VALUES ('T009', 'A008', 'Configure Network', 'Complete networking lab', 2.00, false);
INSERT INTO public.task (task_id, assessment_id, task_name, description, estimated_hours, is_completed) VALUES ('T010', 'A009', 'Study Process Scheduling', 'Review CPU scheduling', 4.00, false);


--
-- PostgreSQL database dump complete
--

\unrestrict akyIg6UBm1A3zwsi0eJwMHSER7wxRwu59qrWkMcDMhGm7BoUWVEuwTiqmN3U9J8

