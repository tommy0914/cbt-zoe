🚀 CBT System Specification
1. User Roles & Permissions

The system operates on a Role-Based Access Control (RBAC) model with three primary entities:
Role	Primary Responsibilities
Admin	Full system oversight, user management (Create Teachers/Students), and system configuration.
Teacher	Class & Subject management, Question bank creation, and Performance Analytics.
Student	Accessing assigned classes, taking tests, and viewing personal results.
2. Functional Requirements
👤 User Management (Admin Only)

    Create Teacher Accounts: Input name, email, department, and staff ID.

    Create Student Accounts: Input name, matric/registration number, and assigned level.

    Oversee Everything: View total user count, active sessions, and system-wide logs.

🎓 Teacher Workspace

Teachers serve as the primary content creators. Their dashboard includes:

    Subject & Class Management:

        Create, Edit, and Delete subjects (e.g., Mathematics, Physics).

        Organize students into specific classes or cohorts.

    Question Upload:

        Upload single questions or bulk upload via CSV/Excel.

        Support for multiple-choice (MCQs) and theory-based questions.

    Analytics Dashboard:

        View class average scores.

        Identify "At-Risk" students based on low performance.

        Export results to PDF or Excel.

📝 Student Portal

    Exam Interface: A secure environment to answer questions with an active countdown timer.

    Result Checking: Immediate or delayed feedback based on teacher settings.

3. Technical Architecture (Proposed)

To implement the features mentioned above, the database should follow this logic:
Data Entities

    Users: id, name, email, password_hash, role (admin|teacher|student)

    Classes: id, class_name, teacher_id

    Subjects: id, subject_name, class_id

    Questions: id, subject_id, question_text, options, correct_answer

    Results: id, student_id, subject_id, score, date_taken

4. Admin/Teacher Analytical View

The Analytical Dashboard for teachers should visualize the following data:

    Note: Teachers can only see analytics for the subjects and classes they have created.

    Participation Rate: Percentage of students who completed the test.

    Score Distribution: A bell curve or bar chart showing how many students scored in specific ranges (e.g., 0-40, 41-70, 71-100).

    Question Difficulty Index: Analysis of which questions were missed by the most students to help teachers adjust their teaching.

5. Deployment Checklist

    [ ] Configure SSL for secure logins.

    [ ] Set up automated database backups.

    [ ] Implement "Session Persistence" so students don't lose progress during power/internet failure.