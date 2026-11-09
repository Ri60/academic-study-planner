-- View 1: Student Assessment Overview
-- Joins Student, Course, and Assessment to show
-- each student's assessments and deadlines.

CREATE VIEW StudentAssessmentOverview AS
SELECT
    s.student_id,
    s.first_name,
    s.last_name,
    c.course_id,
    c.course_name,
    a.assessment_id,
    a.title,
    a.weight_percentage,
    a.due_date
FROM Student AS s
JOIN Course AS c
    ON s.student_id = c.student_id
JOIN Assessment AS a
    ON c.course_id = a.course_id;

    -- View 2: Assessments Exceeding Every Course Average
-- Uses a nested query with ALL and GROUP BY.

CREATE VIEW AssessmentsExceedingCourseAverages AS
SELECT
    c.student_id,
    c.course_id,
    c.course_name,
    a.assessment_id,
    a.title,
    a.weight_percentage,
    a.due_date
FROM Assessment AS a
JOIN Course AS c
    ON a.course_id = c.course_id
WHERE a.weight_percentage > ALL (
    SELECT AVG(a2.weight_percentage)
    FROM Assessment AS a2
    JOIN Course AS c2
        ON a2.course_id = c2.course_id
    WHERE c2.student_id = c.student_id
    GROUP BY a2.course_id
);


-- View 3: Assessments Above Their Own Course Average
-- Uses a correlated nested query.

CREATE VIEW AssessmentsAboveCourseAverage AS
SELECT
    a.assessment_id,
    a.course_id,
    a.title,
    a.weight_percentage,
    a.due_date
FROM Assessment AS a
WHERE a.weight_percentage > (
    SELECT AVG(a2.weight_percentage)
    FROM Assessment AS a2
    WHERE a2.course_id = a.course_id
);

-- View 5: Assessments With Tasks or Study Sessions
-- Uses a nested query containing UNION.

CREATE VIEW AssessmentsWithActivity AS
SELECT
    a.assessment_id,
    a.course_id,
    a.title,
    a.weight_percentage,
    a.due_date
FROM Assessment AS a
WHERE a.assessment_id IN (
    SELECT t.assessment_id
    FROM Task AS t

    UNION

    SELECT ss.assessment_id
    FROM StudySession AS ss
    WHERE ss.assessment_id IS NOT NULL
);

-- View 6: Upcoming Assessments
-- Shows assessments due today through seven days from today.

CREATE VIEW UpcomingAssessments AS
SELECT
    c.student_id,
    c.course_id,
    c.course_name,
    a.assessment_id,
    a.title,
    a.weight_percentage,
    a.due_date,
    a.due_date - CURRENT_DATE AS days_remaining
FROM Assessment AS a
JOIN Course AS c
    ON a.course_id = c.course_id
WHERE a.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7;

-- View 7: Overdue Incomplete Tasks
-- Shows unfinished tasks after their assessment deadline.

CREATE VIEW OverdueIncompleteTasks AS
SELECT
    c.student_id,
    c.course_id,
    c.course_name,
    a.assessment_id,
    a.title AS assessment_title,
    t.task_id,
    t.task_name,
    t.estimated_hours,
    a.due_date,
    CURRENT_DATE - a.due_date AS days_overdue
FROM Task AS t
JOIN Assessment AS a
    ON t.assessment_id = a.assessment_id
JOIN Course AS c
    ON a.course_id = c.course_id
WHERE t.is_completed = FALSE
  AND a.due_date < CURRENT_DATE;


  -- View 8: Study Time per Course
-- Includes courses with no linked study sessions.

CREATE VIEW StudyTimePerCourse AS
SELECT
    c.student_id,
    c.course_id,
    c.course_name,
    COUNT(ss.session_id) AS session_count,
    COALESCE(SUM(ss.duration_min), 0) AS total_study_minutes
FROM Course AS c
LEFT JOIN Assessment AS a
    ON c.course_id = a.course_id
LEFT JOIN StudySession AS ss
    ON a.assessment_id = ss.assessment_id
GROUP BY
    c.student_id,
    c.course_id,
    c.course_name;



    -- View 9: Task Completion per Assessment
-- Includes assessments with no tasks.

CREATE VIEW TaskCompletionPerAssessment AS
SELECT
    a.assessment_id,
    a.course_id,
    a.title,
    COUNT(t.task_id) AS total_tasks,
    COUNT(CASE WHEN t.is_completed = TRUE THEN 1 END)
        AS completed_tasks,
    ROUND(
        100.0 *
        COUNT(CASE WHEN t.is_completed = TRUE THEN 1 END)
        / NULLIF(COUNT(t.task_id), 0),
        2
    ) AS completion_percentage,
    CASE
        WHEN COUNT(t.task_id) = 0 THEN 'No tasks'
        WHEN COUNT(CASE WHEN t.is_completed = TRUE THEN 1 END)
             = COUNT(t.task_id) THEN 'Complete'
        ELSE 'Incomplete'
    END AS task_status
FROM Assessment AS a
LEFT JOIN Task AS t
    ON a.assessment_id = t.assessment_id
GROUP BY
    a.assessment_id,
    a.course_id,
    a.title;



-- View 10: Assessment Priority
-- Score = assessment weight / (days remaining + 1).

CREATE VIEW AssessmentPriority AS
SELECT
    c.student_id,
    c.course_id,
    c.course_name,
    a.assessment_id,
    a.title,
    a.weight_percentage,
    a.due_date,
    a.due_date - CURRENT_DATE AS days_remaining,
    ROUND(
        a.weight_percentage
        / (a.due_date - CURRENT_DATE + 1),
        2
    ) AS priority_score
FROM Assessment AS a
JOIN Course AS c
    ON a.course_id = c.course_id
WHERE a.due_date >= CURRENT_DATE
  AND EXISTS (
      SELECT 1
      FROM Task AS t
      WHERE t.assessment_id = a.assessment_id
        AND t.is_completed = FALSE
  );


  