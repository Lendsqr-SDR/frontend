# Lendsqr Lead Compass

Build a simple internal SDR lead-tracking web app for a fintech company called Lendsqr.

This is an in-house tool to replace our current Excel-based sales/outreach tracker. Keep the UI clean, professional, simple, and practical — not like a huge Salesforce/HubSpot clone.

Main pages

Dashboard

Total leads

Contacted

Follow-ups due

Interested

Meetings

Simple recent activity section

Leads
Create a table showing:

Company

Contact person

Role

Email

Country

Status

Last contacted

Next follow-up

Actions

Add:

Search

Status filter

Country filter

Sort

Pagination

"Import Excel" button

"Export Excel" button

Lead Details
When a lead is clicked, show:

Company information

Contact information

Email

Phone

LinkedIn

Current status

Notes

Outreach/activity history

Next follow-up date

Buttons:

Change status

Add note

Log outreach

Schedule follow-up

Follow-ups
Show:

Due today

Overdue

Upcoming

Lead name/company

Follow-up date

Current status

Lead statuses

Use:

Not Contacted

Contacted

Follow-up

Responded

Interested

Meeting

Won

Not Interested

Design

Use a clean fintech-style dashboard with Lendsqr-inspired branding. Keep navigation simple:

Dashboard
Leads
Follow-ups

Use cards, tables, badges and simple modals. Make it responsive.

Important

This is only the frontend for now. Do NOT build a complex backend, authentication system, email automation, LinkedIn integration, AI features, or unnecessary features.

Use realistic sample Nigerian/Ghanaian MFB and lending-company data so the interface looks like a real working SDR tool.

Structure the frontend so I can easily connect my own REST API/backend later.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/14333d11-336d-412b-bede-3f4403d1d9d3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
