const ACTIONS = ["Review", "Update", "Plan", "Check", "Prepare", "Draft", "Improve", "Finish", "Organize", "Clean up"];
const SUBJECTS = ["the budget", "the schedule", "the report", "the checklist", "the guidelines", "the dashboard", "the newsletter", "the inventory", "the survey", "the contract"];
const CATEGORIES = ["Development", "Design", "Testing", "Documentation", "Research", "Support"];
const STATUSES = ["To do", "In progress", "Review", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];
const USERS = ["Ayesha Khan", "Hamza Ali", "Sara Ahmed", "Bilal Hussain", "Maryam Noor", "Usman Tariq", "Zainab Malik", "Hassan Raza"];

function createRawRecord(index) {
    const date = new Date(Date.UTC(2026, 0, 1 + ((index * 3) % 300)));

    return {
        id: index + 1,
        title: `${ACTIONS[index % 10]} ${SUBJECTS[Math.floor((index % 100) / 10)]}`,
        category: CATEGORIES[index % 6],
        status: STATUSES[Math.floor(index / 6) % 4],
        assignedTo: USERS[Math.floor(index / 3) % 8],
        priority: PRIORITIES[Math.floor(index / 4) % 3],
        date: date.toISOString().slice(0, 10),
        value: 50 + ((index * 37) % 950)
    };
}

const brokenEntries = [
    null,
    { id: 121, title: "   ", category: "Support", status: "To do", assignedTo: "Hamza Ali", priority: "Low", date: "2026-03-01", value: 120 },
    { id: 122, title: "Plan the budget", category: "Design", status: "Archived", assignedTo: "Sara Ahmed", priority: "High", date: "2026-04-05", value: 300 },
    { id: 123, title: "Check the survey", category: "Testing", status: "Done", assignedTo: "Ayesha Khan", priority: "Medium", date: "2026-05-09", value: "not a number" }
];

export const rawRecords = [
    ...Array.from({ length: 120 }, (_, index) => createRawRecord(index)),
    ...brokenEntries
];