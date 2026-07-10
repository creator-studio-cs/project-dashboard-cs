// OPTIONAL demo/preview data — clearly fictional, safe to commit and safe to
// deploy publicly. Not imported anywhere by default.
//
// To preview the CRM with sample contacts, import this in constants/data.js:
//   import { DEMO_CONTACTS } from "./demoContacts";
//   export const initContacts = DEMO_CONTACTS;

export const DEMO_CONTACTS = [
  {
    id: 1, firstName: "Jamie", lastName: "Rivera", email: "jamie.rivera@example.com",
    phone: "555-0101", org: "Example Nonprofit", segment: "Partnership", tier: "Hot",
    stage: "Lead", island: "Local", createdOn: "January 5, 2026", source: "Website",
    notes: "Sample demo contact — interested in a partnership.",
    message: "Hi, we'd love to explore working together.",
    value: 2500, tags: ["Demo"],
  },
  {
    id: 2, firstName: "Alex", lastName: "Chen", email: "alex.chen@example.com",
    phone: "", org: "Example Co.", segment: "General Inquiry", tier: "Warm",
    stage: "Contacted", island: "Regional", createdOn: "February 2, 2026", source: "Referral",
    notes: "Sample demo contact — asked for a quote.",
    message: "Can you send over pricing info?",
    value: 800, tags: ["Demo"],
  },
  {
    id: 3, firstName: "Sam", lastName: "Okafor", email: "sam.okafor@example.com",
    phone: "555-0199", org: "Independent", segment: "Referral", tier: "Cold",
    stage: "Lead", island: "National", createdOn: "March 10, 2026", source: "Event",
    notes: "Sample demo contact — met at a conference.",
    message: "Following up from the conference last week.",
    value: 0, tags: ["Demo"],
  },
];
