# Committees Feature Setup

This document outlines the new dynamic committees feature added to the SRIF 2026 website.

## 1. Database Setup
The application includes an auto-migration script that runs on startup. It will automatically create two new tables if they don't exist:
- `committees`: Stores committee names (English & Arabic).
- `committee_members`: Stores member details (Name, Role, Image) linked to a committee.

No manual SQL execution is required.

## 2. API Endpoints

### Public Access
- **GET /api/committees**
  - Returns a JSON object containing all committees and their members.
  - Used by `committee.html` to render the page.

### Admin Management
- **POST /api/committees/create**
  - Body: `{ name_en, name_ar }`
  - Creates a new committee group.
- **DELETE /api/committees/:id**
  - Deletes a committee and all its members.
- **POST /api/committees/member/add**
  - Body: `FormData` (committee_id, name_en, name_ar, role_en, role_ar, image file)
  - Adds a member to a committee.
- **DELETE /api/committees/member/:id**
  - Removes a member from a committee.

## 3. Admin Panel Usage
1. Log in to the Admin Dashboard.
2. Navigate to the new **"Committees"** tab in the sidebar.
3. Use the **"Create New Committee"** form to add a group (e.g., "Scientific Committee").
4. Once created, the committee will appear in the list below.
5. Use the **"Add Member"** form within each committee card to add members with their photos.

## 4. Troubleshooting
- **Images not loading**: Ensure the `uploads/committees` directory exists and has write permissions.
- **Database errors**: Check the server logs for any migration errors on startup.
