# Technical Integration Request: ISAS & Moodle API Access for Olmies Platform

**To:** University of Technology (UTech) Information Systems Department  
**From:** Shaun Ramsay, Lead Developer - Olmies Platform  
**Date:** [Insert Date]  
**Subject:** Formal Request for Read-Only API Integration (ISAS & Moodle) for Olmies Beta Launch  

---

Dear UTech Information Systems Team,

I am writing to formally request read-only REST API access to specific subsets of the **Integrated Student Administration System (ISAS)** and **Moodle** databases. 

Over the past iteration cycle, our team has successfully engineered **Olmies**, a cross-platform mobile application and administrative web dashboard designed to centralize campus communications, facilitate Interactive Campus mapping, and significantly boost Module Evaluation survey participation through gamification.

The Olmies platform is currently operating flawlessly in an Alpha state using Mock Data schemas. We are now preparing for our official Beta launch to the UTech student body. To transition to a production environment, the Olmies backend (.NET Core 8 Web API) requires secure, programmatic synchronization with UTech's official directory.

We are requesting provisioning for OAuth 2.0 / Client Credentials access to exposed endpoints that can furnish the following data structures. We require strictly **Read-Only** access; all mutating actions (e.g., student survey submissions) are handled independently within the Olmies PostgreSQL infrastructure.

### Data Scope & Required Fields

#### 1. Student Directory API (ISAS)
*Required to authenticate Active Directory logins and populate the Student Hub.*
- `Student ID Number` (Primary Key constraint)
- `First Name`
- `Last Name`
- `University Email Address`
- `Current Enrollment Status` (Active/Inactive)
- `Course of Study` (e.g., B.Sc. Computing)

#### 2. Module & Faculty Roster API (Moodle/ISAS)
*Required to dynamically generate the "My Modules" list and restrict Survey Templates to specific classes.*
- `Module Code` (e.g., CMP3011)
- `Module Name`
- [Semester](file:///c:/Users/shaun/OneDrive/Desktop/olmies%20ai/src/Olmies.UI/src/pages/StudentDashboard.jsx#16-22) & `Academic Year`
- `Assigned Lecturer(s)` (Name & Email)
- `Enrolled Student IDs` (Array of IDs mapped to the Module Code)

---

### Technical Architecture & Security Protocols
The Olmies platform is built on enterprise-grade infrastructure to ensure data privacy and system stability:
- **Backend Setup**: The application is served by a robust ASP.NET 8 Web API. Connection to your endpoints will originate from a static, whitelisted IP address block associated with our hosting provider.
- **Data Retention**: We do *not* cache or store sensitive biographical data long-term. Information retrieved from the ISAS endpoints is processed ephemerally to manage JWT token generation and survey visibility. 
- **Rate Limiting**: Our background synchronization workers (`Hangfire` cron jobs) are configured to pull bulk updates only during off-peak hours (e.g., 2:00 AM EST) to ensure zero impact on ISAS/Moodle operational latency.

### Next Steps 
We would greatly appreciate the opportunity to schedule a brief technical sync with your database administrators. Our goal is to understand your preferred integration pattern (e.g., existing GraphQL endpoints, SOAP wrappers, or flat-file CSV dumps via SFTP if direct API access is restricted).

Thank you for your time and for supporting student-led technological innovation at the University of Technology. 

Sincerely,

**Shaun Ramsay**  
Lead Developer  
Olmies Development Team  
[Insert Phone Number]  
[Insert Email Address]  
