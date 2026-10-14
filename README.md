# TRACESETU

TRACESETU is a responsive case-coordination prototype for the Seva First Innovation Challenge. It demonstrates fictional missing-person and unidentified-person records, inter-district leads, and an investigator-reviewed matching workflow.

> **Prototype notice:** This is not an official Government of India application. The Government of India reference and Indian flag are contextual design elements only. All displayed records are fictional demo data and are stored locally in the current browser. Do not enter real case or personal information.

## Run the prototype

Requirements: Node.js 20 or later and npm.

```powershell
npm install
npm run dev
```

Open the local address printed by Vite. To create a production build:

```powershell
npm run build
```

## Included in this prototype

- Responsive dashboard with fictional case activity, district distribution, status charts, and review queue.
- Case register with search and district/status filters.
- Case-detail profiles and a case creation form with cascading state/UT and district selectors for all 36 Indian states and Union Territories (784 districts in the included snapshot).
- Ten fictional potential-match examples, human review actions, and match status filters.
- Inter-district network illustration and analytics pages.
- Floating TRACESETU demo assistant with local, rule-based guidance and workspace shortcuts; no AI service receives chat messages.
- Language selector for English, Hindi, Marathi, Gujarati, Punjabi, Bengali, Malayalam, Tamil, and Telugu. Primary navigation, login, dashboard headings, and assistant guidance are translated; detailed demo records and some supporting labels remain in English.
- Local browser persistence for demo case records, match decisions, and audit-style events.
- Government of India text, Indian tricolour, secure-access cues, and clear demo-data disclaimers.

The state and district dropdown data is a local snapshot sourced from [KTBsomen/Indian-state-district-json](https://github.com/KTBsomen/Indian-state-district-json), which documents the official [IGOD district portal](https://igod.gov.in/sg/district/states) as its source. District boundaries and names can change; verify them against official records before operational use.

Matching in this UI prototype uses pre-seeded fictional leads and a demonstration action; it is not a backend matching service. Authentication, role enforcement, PostgreSQL persistence, secure file storage, and production audit logging must be implemented and security-reviewed before operational use.
