# Changelog

## [Version 2.0.0] - 2026-02-15

### Added
- **Committee Page**: New dynamic page at `committee.html` listing all organizing committees and members.
- **Admin Panel**: Added "Committees" management section to create committees and manage members.
- **Backend API**: New endpoints at `/api/committees` for CRUD operations on committees.
- **Submission Forms**: Added "Presentation Type" field (Oral/Poster for Research, Poster/Prototype for Innovation).
- **Previous Events**: Added "Previous Events" button to the Hero section.
- **Speakers Section**: Added placeholder section for speakers on the homepage.
- **Social Media**: Updated social media links in the footer to point to AlMaarefa University accounts.
- **Contact Form**: Implemented email notification logic using `nodemailer`.

### Changed
- **Database Schema**: Added `committees`, `committee_members` tables. Added `presentation_type` column to submission tables.
- **Admin Dashboard**: Updated submission view to show "Presentation Type".
