import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
} from "drizzle-orm";
import { db } from "@workspace/db";
import {
  activityEventsTable,
  lessonProgressTable,
  lessonsTable,
  profilesTable,
  projectTasksTable,
  projectsTable,
  resourcesTable,
  stagesTable,
} from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetLessonParams,
  GetLessonResponse,
  GetLessonsQueryParams,
  GetLessonsResponse,
  GetProfileResponse,
  GetProjectParams,
  GetProjectResponse,
  GetProjectsResponse,
  GetResourcesQueryParams,
  GetResourcesResponse,
  GetStagesResponse,
  UpdateLessonProgressBody,
  UpdateLessonProgressParams,
  UpdateLessonProgressResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const stageSeed = [
  ["How software works", "Build a clear mental model of browsers, servers, code, and the tools that connect them."],
  ["HTML", "Structure accessible StockCheck screens with semantic HTML."],
  ["CSS", "Make the first StockCheck interface responsive and readable."],
  ["JavaScript", "Turn StockCheck rows into a reconciliation engine."],
  ["Git", "Track work safely with branches, commits, and history."],
  ["GitHub", "Collaborate around a real StockCheck repository."],
  ["Node.js + npm", "Understand the runtime and package tools behind modern apps."],
  ["React", "Turn the prototype into reusable components and state."],
  ["TypeScript", "Model inventory data and UI behavior with confidence."],
  ["APIs", "Connect the StockCheck frontend to a backend contract."],
  ["Databases", "Persist reconciliation records with relational data."],
  ["Authentication + security", "Protect data and teach safe application boundaries."],
  ["File imports", "Bring CSV and XLSX inventory data into the workflow."],
  ["Testing", "Prove reconciliation calculations work on edge cases."],
  ["AI-assisted coding", "Use AI as a thinking partner instead of a code vending machine."],
  ["AI models", "Choose model capabilities based on the task at hand."],
  ["AI agents", "Build approval-based workflows that inspect and explain anomalies."],
  ["MCP", "Connect agents to tools, resources, and external systems."],
  ["RAG", "Retrieve the right learning context from your own materials."],
  ["Advanced AI engineering", "Orchestrate reliable, observable, human-in-the-loop systems."],
  ["Production", "Deploy StockCheck with monitoring, security, and recovery in mind."],
] as const;

type LessonSeed = readonly [
  string,
  string,
  string,
  number,
  string,
  string,
  string,
  readonly string[],
  string,
  string,
  string,
  string,
  string,
  readonly number[],
];

const lessonSeed: LessonSeed[] = [
  ["What actually happens when I type npm run dev?", "npm scripts", "foundations", 30, "Trace the path from terminal command to localhost.", "Understand how a command starts a development server.", "This is the first chain you need to debug any modern web project.", ["terminal", "npm", "package.json", "Node.js", "localhost"], "Read the command as a sequence: the terminal starts npm, npm reads package.json, the script starts Node.js, dependencies load, and a server listens for the browser.", "npm run dev → package.json script → Vite/Node process → localhost port → browser request", "Open a terminal and write down every handoff before running the command.", "Explain the chain back without looking at your notes.", "Create a small map of the request flow.", [1, 2]],
  ["What is Node.js?", "Node.js runtime", "foundations", 25, "Explain why JavaScript can run outside a browser.", "Understand the runtime that powers your tooling and backend.", "When a dev server fails, the error often comes from the runtime rather than the UI.", ["runtime", "JavaScript", "server"], "Node.js embeds the JavaScript engine outside the browser and adds APIs for files, processes, networking, and modules.", "The browser owns the DOM; Node.js owns the process, filesystem, and server.", "Run a tiny Node script that prints the current directory.", "Describe one thing Node can do that browser JavaScript cannot.", "Create a notes file and run it with node.", [1]],
  ["What is npm?", "Package manager", "foundations", 25, "Describe npm as a registry client and script runner.", "Understand how dependencies and scripts are installed and executed.", "Knowing npm prevents you from blindly copying setup commands.", ["registry", "dependencies", "scripts"], "npm can download packages, run package.json scripts, and record the exact dependency graph.", "npm install reads package.json and creates node_modules plus a lockfile.", "Inspect a package.json and identify dependencies versus scripts.", "Explain why package-lock.json matters.", "Point to the script that starts your app.", [1]],
  ["What is package.json?", "Project manifest", "foundations", 25, "Read the important fields in a project manifest.", "Know where a JavaScript project declares its identity and commands.", "The manifest is the map an agent and a runtime use to understand a project.", ["name", "scripts", "dependencies", "version"], "package.json describes the project and gives tools predictable commands to run.", "A script is a named command: npm run dev executes the value stored at scripts.dev.", "Add a script that prints a message.", "Predict what command will run before you execute it.", "Write a short explanation of every field you used.", [1]],
  ["What is localhost?", "Local development", "foundations", 20, "Explain the difference between a server process and a browser address.", "Understand where your local app is actually running.", "It makes port and proxy errors understandable instead of mysterious.", ["localhost", "port", "HTTP"], "localhost points back to your own machine; the port identifies which process should receive the request.", "http://localhost:5173 is a browser request to a local process listening on port 5173.", "Change a dev server port and observe the browser URL.", "Explain what it means when the port is already in use.", "Document the port your project uses.", [1]],
  ["Create the first StockCheck page", "Semantic structure", "beginner", 35, "Build a readable inventory comparison screen with semantic elements.", "Practice turning a real workflow into HTML.", "StockCheck gives every concept a concrete reason to exist.", ["headings", "forms", "tables", "accessibility"], "Use headings for hierarchy, a form for inputs, and a table only when row-to-column comparison adds clarity.", "A stock row can expose SKU, received quantity, receipt quantity, difference, and status.", "Build one static row and label every input.", "Inspect the page with keyboard navigation.", "Create the initial project structure for StockCheck.", [2, 3]],
  ["Make StockCheck responsive", "Responsive CSS", "beginner", 40, "Use layout primitives that adapt to smaller screens.", "Learn how structure and presentation work together.", "Inventory work happens on different screens; cramped tables hide errors.", ["box model", "flexbox", "grid", "media queries"], "Responsive design changes relationships, not only font sizes.", "A wide reconciliation table can become stacked item cards on a phone.", "Resize the browser and record the first layout failure.", "Fix one breakpoint without adding a second wrapper.", "Make the table usable on a narrow screen.", [3]],
  ["Calculate quantity differences", "Functions and conditions", "beginner", 45, "Calculate and label matched, shortage, and excess inventory.", "Turn business rules into small testable functions.", "This is the core of the StockCheck problem.", ["arrays", "objects", "functions", "conditionals"], "difference = stock quantity - receipt quantity. Zero means matched; positive means excess; negative means shortage.", "Stock 8 and receipt 7 produce difference +1 and status Excess.", "Write a reconcileItem function and try three quantities.", "Add a missing SKU case.", "Show the status beside each row.", [4]],
  ["Commit a meaningful change", "Git basics", "beginner", 30, "Create a commit that tells the story of a small change.", "Understand staging, history, and rollback.", "Small commits make AI-generated changes easier to inspect.", ["working tree", "staging", "commit", "history"], "Git records snapshots; staging lets you choose what belongs in the next snapshot.", "git add src/reconcile.js then git commit -m \"Add quantity reconciliation\".", "Make a change, inspect git diff, stage only the intended file, then commit.", "Find the commit that introduced a bug.", "Version the StockCheck prototype.", [5]],
  ["Open a GitHub repository", "GitHub workflow", "beginner", 30, "Push StockCheck and explain the relationship between Git and GitHub.", "Practice sharing work without losing local history.", "A visible repository becomes a learning journal and feedback surface.", ["remote", "README", "branch", "pull request"], "Git is the local history tool; GitHub is a hosted collaboration surface around repositories.", "A remote named origin points local Git at a hosted repository.", "Create a README with the StockCheck problem statement.", "Use gh repo view to inspect the repository.", "Publish the StockCheck repository.", [6]],
  ["Read a Node project", "Node tooling", "intermediate", 35, "Interpret dependencies, scripts, and environment variables.", "Understand the moving parts your tools automate.", "You will debug faster when package setup is legible.", ["node_modules", "devDependencies", "env"], "Dependencies are code your app runs with; devDependencies support development tasks.", "A build script can invoke TypeScript, Vite, or a test runner.", "Trace one dependency from package.json to an import.", "Explain why secrets do not belong in the manifest.", "Document StockCheck's runtime assumptions.", [7]],
  ["Build a React dashboard", "Components and state", "intermediate", 50, "Split StockCheck into components with clear responsibilities.", "Move from page-shaped code to reusable UI behavior.", "Component boundaries make each learning concept visible.", ["JSX", "props", "state", "hooks"], "A component owns a focused piece of UI; state changes cause React to render a new result.", "ReconciliationTable receives items as props and renders InventoryRow children.", "Convert one static row into a component.", "Change state and predict what rerenders.", "Build the first React StockCheck dashboard.", [8]],
  ["Type inventory data", "TypeScript models", "intermediate", 45, "Model products, receipt items, and discrepancies with types.", "Make invalid combinations harder to represent.", "Types turn the business rules into inspectable documentation.", ["interfaces", "unions", "inference", "generics"], "A discriminated union can describe status-specific data without hiding the rule.", "type Status = 'matched' | 'shortage' | 'excess'.", "Create Product and Reconciliation interfaces.", "Try to pass a string where quantity is expected.", "Type the reconciliation engine.", [9]],
  ["Connect to an API", "HTTP and JSON", "intermediate", 45, "Explain requests, responses, and errors across a boundary.", "Learn where frontend responsibility ends.", "StockCheck becomes useful when several screens share persisted data.", ["HTTP", "GET", "POST", "status codes"], "An API contract describes how one process asks another process for data.", "GET /reconciliations can return JSON with a 200; validation errors can return 400.", "Inspect a request in browser devtools.", "Handle a non-200 response without hiding it.", "Connect the dashboard to a backend.", [10]],
  ["Design StockCheck tables", "Relational data", "intermediate", 50, "Choose tables and relationships for inventory records.", "Understand how persistence changes application design.", "A reconciliation history is only useful if it can be queried reliably.", ["tables", "rows", "keys", "migrations"], "Tables store facts; keys connect those facts without duplicating every detail.", "A reconciliation references a supplier and multiple line items.", "Sketch a schema for suppliers and receipts.", "Find a field that should be a foreign key.", "Create the first database-backed model.", [11]],
  ["Protect an API route", "Auth and validation", "intermediate", 45, "Separate identity, authorization, and input validation.", "Learn to protect user data at the boundary.", "Security decisions are easier when each responsibility is explicit.", ["sessions", "roles", "validation", "secrets"], "Authentication answers who; authorization answers what they can do; validation answers whether input is acceptable.", "An inventory staff member may create a reconciliation while a viewer can only read it.", "List the checks before inserting a receipt.", "Try an invalid SKU and explain the failure.", "Add protected StockCheck access.", [12]],
  ["Import a CSV safely", "File parsing", "intermediate", 40, "Map imported columns and report invalid rows.", "Turn messy real-world input into validated data.", "Suppliers do not all format receipts the same way.", ["CSV", "mapping", "duplicates", "errors"], "Import is a pipeline: read, map, validate, deduplicate, then persist.", "Product Code can map to SKU and Qty can map to quantity.", "Paste a small table and surface one error.", "Explain how duplicate SKUs are handled.", "Add a manual and CSV import path.", [13]],
  ["Test reconciliation rules", "Testing", "intermediate", 45, "Write tests for happy paths and edge cases.", "Replace confidence based on clicking with repeatable evidence.", "Quantity math must remain correct as the app grows.", ["unit tests", "integration tests", "edge cases"], "Tests describe a behavior and protect it from regressions.", "Stock 8 and receipt 8 is Matched; 8 and 7 is Excess +1.", "Write tests for matched, shortage, excess, missing, and duplicate cases.", "Break the function intentionally and read the failure.", "Automate reconciliation verification.", [14]],
  ["Use an AI coding assistant", "AI-assisted coding", "advanced", 35, "Inspect generated code before accepting it.", "Learn a safe loop for prompting and verification.", "The fastest way to learn is to keep ownership of the reasoning.", ["context", "prompt", "review", "debugging"], "Ask what the code does, why the approach was chosen, what could go wrong, and how to test it.", "Understand → inspect → run → test → verify → commit.", "Ask an assistant to explain a reconciliation function without rewriting it.", "Identify one assumption the generated code makes.", "Use AI to improve a StockCheck feature without surrendering review.", [15]],
  ["Choose a model by capability", "Model selection", "advanced", 30, "Match a task to capability, latency, and cost.", "Avoid treating the biggest model as the default.", "Good model choices are part of production engineering.", ["context window", "reasoning", "latency", "cost"], "Start with the task, list required capability, then choose a model type and explain why.", "Simple explanation → fast model; complex debugging → stronger reasoning model.", "Write a task-to-capability decision for one StockCheck feature.", "Name the risk of an oversized model.", "Document your model selection framework.", [16]],
  ["Build an approval-based agent", "AI agents", "advanced", 50, "Design an agent that explains anomalies and asks before changing data.", "Understand models, tools, instructions, and verification as one loop.", "StockCheck is a practical place to learn safe autonomy.", ["tools", "planning", "execution", "approval"], "A reliable agent reads a CSV, identifies anomalies, explains them, asks for approval, and generates a report.", "Human approval belongs between analysis and mutation.", "Write the tool list for a reconciliation agent.", "Add a guardrail for destructive changes.", "Prototype the StockCheck agent workflow.", [17]],
  ["Connect tools with MCP", "MCP", "advanced", 40, "Explain servers, tools, resources, and prompts.", "Understand how agents interact with external systems.", "Tool boundaries are where permissions and observability matter.", ["MCP server", "tools", "resources", "prompts"], "MCP standardizes the shape of context and actions exposed to an agent.", "A GitHub tool can inspect a repository without giving the agent unrestricted shell access.", "Map one StockCheck action to an MCP tool.", "List what the tool should refuse.", "Design an MCP-backed learning exercise.", [18]],
  ["Retrieve learning context with RAG", "RAG", "advanced", 50, "Describe chunking, embeddings, retrieval, and context injection.", "Build a learning assistant grounded in your own materials.", "Answers become more useful when they can cite the material you are studying.", ["embeddings", "retrieval", "chunking", "vector search"], "RAG retrieves relevant context before a model writes an answer.", "A question about npm can retrieve your own lesson notes and official docs.", "Chunk one lesson and identify useful retrieval metadata.", "Explain why retrieval does not guarantee truth.", "Create a small grounded learning assistant.", [19]],
  ["Evaluate an AI workflow", "Advanced AI engineering", "advanced", 55, "Add structured outputs, evaluation, and observability.", "Move from impressive demos to reliable systems.", "Production AI needs evidence, not only a successful example.", ["evaluation", "guardrails", "observability", "reliability"], "Measure whether the workflow is correct, safe, explainable, and recoverable.", "A reconciliation agent should expose input rows, findings, confidence, and approval state.", "Define three evaluation cases for an agent.", "Explain one hallucination prevention strategy.", "Prepare StockCheck for a controlled AI feature.", [20]],
  ["Deploy StockCheck safely", "Production engineering", "advanced", 50, "Prepare environment variables, logging, backups, and rollback.", "Learn what changes when a local app becomes a real service.", "Deployment is where all prior decisions meet real users and real data.", ["deployment", "CI/CD", "monitoring", "backups"], "Production readiness is a set of feedback loops, not a final button.", "A health check, structured logs, and migration strategy make failures diagnosable.", "Write a release checklist for StockCheck.", "Plan how to recover from a failed migration.", "Deploy the capstone and document the runbook.", [20]],
];

const resourceSeed = [
  ["MDN: Learn web development", "documentation", "https://developer.mozilla.org/en-US/docs/Learn", "Web foundations", 0, "foundations", "A structured path through how the web works, HTML, CSS, and JavaScript.", 30],
  ["MDN: HTML basics", "documentation", "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics", "HTML", 1, "beginner", "Official HTML fundamentals with practical examples.", 25],
  ["MDN: CSS first steps", "documentation", "https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps", "CSS", 2, "beginner", "Learn selectors, layout, and responsive presentation.", 30],
  ["MDN: JavaScript Guide", "reference", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "JavaScript", 3, "beginner", "The reference to return to while building reconciliation logic.", 40],
  ["Git documentation", "documentation", "https://git-scm.com/doc", "Git", 4, "beginner", "Official Git reference and getting-started guides.", 25],
  ["GitHub Docs: Hello World", "tutorial", "https://docs.github.com/en/get-started/start-your-journey/hello-world", "GitHub", 5, "beginner", "A guided first repository and pull request workflow.", 20],
  ["React Learn", "documentation", "https://react.dev/learn", "React", 7, "intermediate", "The official React learning path.", 35],
  ["TypeScript Handbook", "documentation", "https://www.typescriptlang.org/docs/handbook/intro.html", "TypeScript", 8, "intermediate", "Understand types from the source.", 35],
  ["Node.js Learn", "documentation", "https://nodejs.org/en/learn", "Node.js", 6, "intermediate", "Official Node.js learning materials.", 30],
  ["PostgreSQL Tutorial", "tutorial", "https://www.postgresql.org/docs/current/tutorial.html", "Databases", 10, "intermediate", "SQL and relational database concepts from PostgreSQL.", 45],
] as const;

const projectSeed = [
  ["HTML StockCheck prototype", "Build the first static inventory reconciliation screen.", ["HTML", "semantic structure"]],
  ["CSS responsive StockCheck", "Make the reconciliation workflow usable on every screen.", ["CSS", "responsive design"]],
  ["JavaScript reconciliation engine", "Calculate differences and explain discrepancies.", ["JavaScript", "business rules"]],
  ["Git versioned StockCheck", "Track the project with meaningful commits and history.", ["Git", "version control"]],
  ["GitHub StockCheck repository", "Share the project and practice collaboration.", ["GitHub", "pull requests"]],
  ["React StockCheck", "Convert the prototype into reusable React components.", ["React", "component design"]],
  ["TypeScript StockCheck", "Model inventory data and status safely.", ["TypeScript", "domain modeling"]],
  ["API-connected StockCheck", "Connect the frontend to a real backend contract.", ["APIs", "HTTP"]],
  ["Database-backed StockCheck", "Persist receipts and reconciliation records.", ["PostgreSQL", "SQL"]],
  ["Authenticated StockCheck", "Protect the workflow with users and roles.", ["authentication", "security"]],
  ["CSV/XLSX import", "Import supplier data with mapping and validation.", ["file parsing", "validation"]],
  ["Automated testing", "Prove calculations and edge cases with tests.", ["testing", "regressions"]],
  ["AI receipt extraction", "Extract receipt information with an explainable AI step.", ["AI", "structured data"]],
  ["AI reconciliation assistant", "Explain mismatches and recommend next steps.", ["AI", "UX"]],
  ["AI agent", "Build a human-approved anomaly workflow.", ["agents", "tool calling"]],
  ["Production deployment", "Ship StockCheck with monitoring and recovery.", ["deployment", "operations"]],
] as const;

let seedPromise: Promise<void> | null = null;

function userIdFromRequest(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db.select({ id: stagesTable.id }).from(stagesTable).limit(1);
      if (existing.length > 0) return;
      const stages = await db
        .insert(stagesTable)
        .values(stageSeed.map(([title, description], index) => ({
          number: index,
          title,
          description,
        })))
        .returning();
      const stageIds = new Map(stages.map((stage) => [stage.number, stage.id]));
      const resources = await db
        .insert(resourcesTable)
        .values(resourceSeed.map(([title, type, url, topic, stageNumber, difficulty, description, estimatedMinutes]) => ({
          title,
          type,
          url,
          topic,
          stageNumber,
          difficulty,
          description,
          estimatedMinutes,
        })))
        .returning();
      const resourceByStage = new Map(resources.map((resource) => [resource.stageNumber, resource.id]));
      await db.insert(lessonsTable).values(
        lessonSeed.map(([title, topic, difficulty, duration, description, objective, whyItMatters, keyConcepts, explanation, example, exercise, challenge, projectTask, resourceIds], index) => {
          const stageNumber = index < 5 ? 0 : Math.min(index - 4, 20);
          const stageId = stageIds.get(stageNumber);
          if (!stageId) throw new Error(`Missing stage ${stageNumber}`);
          return {
            stageId,
            title,
            topic,
            difficulty,
            duration,
            description,
            objective,
            whyItMatters,
            keyConcepts: [...keyConcepts],
            explanation,
            example,
            exercise,
            challenge,
            projectTask,
            completionCriteria: ["Complete the practical exercise", "Explain what changed and why"],
            resourceIds: resourceIds.length > 0 ? [...resourceIds] : resourceByStage.has(stageNumber) ? [resourceByStage.get(stageNumber)!] : [],
          };
        }),
      );
      const projects = await db.insert(projectsTable).values(
        projectSeed.map(([title, goal, skills], index) => ({ number: index + 1, title, goal, skills: [...skills] })),
      ).returning();
      await db.insert(projectTasksTable).values(
        projects.flatMap((project) => [
          { projectId: project.id, title: `Complete the ${project.title} build`, description: project.goal },
          { projectId: project.id, title: "Explain the implementation", description: "Write down what happens, why it works, and how you would debug it." },
        ]),
      );
    })();
  }
  await seedPromise;
}

async function getOrCreateProfile(userId: string) {
  const existing = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  const [profile] = await db.insert(profilesTable).values({
    userId,
    displayName: "Vibe Learner",
    preferredDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  }).returning();
  return profile;
}

function profileResponse(profile: typeof profilesTable.$inferSelect) {
  return {
    id: profile.id,
    displayName: profile.displayName,
    level: profile.level,
    minutesPerDay: profile.minutesPerDay,
    preferredTime: profile.preferredTime,
    preferredDays: profile.preferredDays,
    onboardingComplete: profile.onboardingComplete,
    lastActiveAt: profile.lastActiveAt?.toISOString() ?? null,
  };
}

function progressResponse(progress?: typeof lessonProgressTable.$inferSelect) {
  return {
    status: progress?.status ?? "not_started",
    progress: progress?.progress ?? 0,
    lastActivity: progress?.lastActivity?.toISOString() ?? null,
    exerciseComplete: progress?.exerciseComplete ?? false,
    quizComplete: progress?.quizComplete ?? false,
  } as const;
}

async function lessonResponses(
  userId: string,
  lessons?: typeof lessonsTable.$inferSelect[],
) {
  const lessonRows = lessons ?? await db.select().from(lessonsTable).orderBy(asc(lessonsTable.id));
  const stages = await db.select().from(stagesTable);
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));
  const progressRows = lessonRows.length
    ? await db.select().from(lessonProgressTable).where(and(eq(lessonProgressTable.userId, userId), inArray(lessonProgressTable.lessonId, lessonRows.map((lesson) => lesson.id))))
    : [];
  const progressByLesson = new Map(progressRows.map((row) => [row.lessonId, row]));
  return lessonRows.map((lesson) => {
    const stage = stageById.get(lesson.stageId);
    return {
      id: lesson.id,
      stageId: lesson.stageId,
      stageNumber: stage?.number ?? 0,
      stageTitle: stage?.title ?? "Curriculum",
      title: lesson.title,
      topic: lesson.topic,
      difficulty: lesson.difficulty,
      duration: lesson.duration,
      description: lesson.description,
      projectTask: lesson.projectTask,
      progress: progressResponse(progressByLesson.get(lesson.id)),
    };
  });
}

async function projectResponses(userId: string) {
  const [projects, lessons, progressRows] = await Promise.all([
    db.select().from(projectsTable).orderBy(asc(projectsTable.number)),
    db.select().from(lessonsTable),
    db.select().from(lessonProgressTable).where(eq(lessonProgressTable.userId, userId)),
  ]);
  const completedLessons = new Set(progressRows.filter((row) => row.status === "completed").map((row) => row.lessonId));
  const tasks = await db.select().from(projectTasksTable);
  return projects.map((project) => {
    const taskRows = tasks.filter((task) => task.projectId === project.id);
    const relatedLessons = lessons.slice(project.number <= 1 ? 0 : project.number + 3, project.number <= 1 ? 6 : project.number + 4);
    const completedTaskCount = project.number === 1 ? Math.min(taskRows.length, Math.floor(completedLessons.size / 2)) : 0;
    const progress = project.number === 1
      ? Math.round((completedLessons.size / Math.max(1, relatedLessons.length)) * 100)
      : 0;
    return {
      id: project.id,
      number: project.number,
      title: project.title,
      goal: project.goal,
      skills: project.skills,
      status: progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "not_started",
      progress: Math.min(progress, 100),
      taskCount: taskRows.length,
      completedTaskCount,
      lessonCount: relatedLessons.length,
      githubUrl: project.githubUrl,
    };
  });
}

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const userId = userIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await ensureSeeded();
  const profile = await getOrCreateProfile(userId);
  const [lessons, stages, projects, activities] = await Promise.all([
    lessonResponses(userId),
    db.select().from(stagesTable).orderBy(asc(stagesTable.number)),
    projectResponses(userId),
    db.select().from(activityEventsTable).where(eq(activityEventsTable.userId, userId)).orderBy(desc(activityEventsTable.createdAt)).limit(8),
  ]);
  const completedLessons = lessons.filter((lesson) => lesson.progress.status === "completed").length;
  const currentLesson = lessons.find((lesson) => lesson.progress.status !== "completed") ?? lessons[lessons.length - 1];
  const stageProgress = new Map<number, number>();
  for (const lesson of lessons) {
    stageProgress.set(lesson.stageId, (stageProgress.get(lesson.stageId) ?? 0) + (lesson.progress.status === "completed" ? 1 : 0));
  }
  const currentStageRow = stages.find((stage) => stage.id === currentLesson.stageId) ?? stages[0];
  const currentStage = {
    id: currentStageRow.id,
    number: currentStageRow.number,
    title: currentStageRow.title,
    description: currentStageRow.description,
    lessonCount: lessons.filter((lesson) => lesson.stageId === currentStageRow.id).length,
    completedCount: stageProgress.get(currentStageRow.id) ?? 0,
    progress: Math.round(((stageProgress.get(currentStageRow.id) ?? 0) / Math.max(1, lessons.filter((lesson) => lesson.stageId === currentStageRow.id).length)) * 100),
    status: "in_progress" as const,
  };
  const activityDates = new Set(activities.map((activity) => activity.createdAt.toISOString().slice(0, 10)));
  const today = new Date();
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return activityDates.has(date.toISOString().slice(0, 10)) ? 1 : 0;
  });
  res.json(GetDashboardSummaryResponse.parse({
    profile: profileResponse(profile),
    currentStage,
    currentLesson,
    overallProgress: Math.round((completedLessons / Math.max(1, lessons.length)) * 100),
    totalLessons: lessons.length,
    completedLessons,
    currentStreak: weeklyActivity.filter(Boolean).length,
    longestStreak: weeklyActivity.filter(Boolean).length,
    weeklyActivity,
    recentActivity: activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      detail: activity.detail,
      createdAt: activity.createdAt.toISOString(),
    })),
    featuredProject: projects[0],
  }));
});

router.get("/stages", async (req, res): Promise<void> => {
  const userId = userIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureSeeded();
  const [stages, lessons] = await Promise.all([
    db.select().from(stagesTable).orderBy(asc(stagesTable.number)),
    lessonResponses(userId),
  ]);
  const data = stages.map((stage) => {
    const stageLessons = lessons.filter((lesson) => lesson.stageId === stage.id);
    const completedCount = stageLessons.filter((lesson) => lesson.progress.status === "completed").length;
    return {
      ...stage,
      lessonCount: stageLessons.length,
      completedCount,
      progress: Math.round((completedCount / Math.max(1, stageLessons.length)) * 100),
      status: completedCount === stageLessons.length ? "completed" : completedCount > 0 ? "in_progress" : "not_started",
    };
  });
  res.json(GetStagesResponse.parse(data));
});

router.get("/lessons", async (req, res): Promise<void> => {
  const userId = userIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureSeeded();
  const params = GetLessonsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const conditions = [];
  if (params.data.stageId != null) conditions.push(eq(lessonsTable.stageId, params.data.stageId));
  if (params.data.search) {
    conditions.push(or(ilike(lessonsTable.title, `%${params.data.search}%`), ilike(lessonsTable.topic, `%${params.data.search}%`)));
  }
  const lessons = await db.select().from(lessonsTable).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(lessonsTable.id));
  const data = await lessonResponses(userId, lessons);
  res.json(GetLessonsResponse.parse(params.data.status ? data.filter((lesson) => lesson.progress.status === params.data.status) : data));
});

router.get("/lessons/:id", async (req, res): Promise<void> => {
  const userId = userIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureSeeded();
  const params = GetLessonParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, params.data.id)).limit(1);
  if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
  const [data] = await lessonResponses(userId, [lesson]);
  const [stage] = await db.select().from(stagesTable).where(eq(stagesTable.id, lesson.stageId)).limit(1);
  res.json(GetLessonResponse.parse({
    ...data,
    objective: lesson.objective,
    whyItMatters: lesson.whyItMatters,
    keyConcepts: lesson.keyConcepts,
    explanation: lesson.explanation,
    example: lesson.example,
    exercise: lesson.exercise,
    challenge: lesson.challenge,
    completionCriteria: lesson.completionCriteria,
    resourceIds: lesson.resourceIds,
    stageTitle: stage?.title ?? data.stageTitle,
  }));
});

router.patch("/lessons/:id/progress", async (req, res): Promise<void> => {
  const userId = userIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureSeeded();
  const params = UpdateLessonProgressParams.safeParse(req.params);
  const body = UpdateLessonProgressBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid progress update" }); return; }
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, params.data.id)).limit(1);
  if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
  const now = new Date();
  const existing = await db.select().from(lessonProgressTable).where(and(eq(lessonProgressTable.userId, userId), eq(lessonProgressTable.lessonId, params.data.id))).limit(1);
  const progress = existing[0]
    ? (await db.update(lessonProgressTable).set({ ...body.data, lastActivity: now, updatedAt: now }).where(eq(lessonProgressTable.id, existing[0].id)).returning())[0]
    : (await db.insert(lessonProgressTable).values({ userId, lessonId: params.data.id, status: body.data.status, progress: body.data.progress, exerciseComplete: body.data.exerciseComplete ?? false, quizComplete: body.data.quizComplete ?? false, lastActivity: now }).returning())[0];
  await db.update(profilesTable).set({ lastActiveAt: now, updatedAt: now }).where(eq(profilesTable.userId, userId));
  await db.insert(activityEventsTable).values({
    userId,
    type: body.data.status === "completed" ? "lesson" : "session",
    title: body.data.status === "completed" ? `Completed ${lesson.title}` : `Worked on ${lesson.title}`,
    detail: body.data.status === "completed" ? "Lesson marked complete" : `${body.data.progress}% through the lesson`,
  });
  res.json(UpdateLessonProgressResponse.parse(progressResponse(progress)));
});

router.get("/resources", async (req, res): Promise<void> => {
  const userId = userIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureSeeded();
  const params = GetResourcesQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const conditions = [];
  if (params.data.type) conditions.push(eq(resourcesTable.type, params.data.type));
  if (params.data.search) conditions.push(or(ilike(resourcesTable.title, `%${params.data.search}%`), ilike(resourcesTable.topic, `%${params.data.search}%`)));
  const resources = await db.select().from(resourcesTable).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(resourcesTable.stageNumber));
  res.json(GetResourcesResponse.parse(resources.map((resource) => ({ ...resource, status: "new" }))));
});

router.get("/projects", async (req, res): Promise<void> => {
  const userId = userIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureSeeded();
  res.json(GetProjectsResponse.parse(await projectResponses(userId)));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const userId = userIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureSeeded();
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const projectList = await projectResponses(userId);
  const project = projectList.find((item) => item.id === params.data.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const tasks = await db.select().from(projectTasksTable).where(eq(projectTasksTable.projectId, params.data.id)).orderBy(asc(projectTasksTable.id));
  res.json(GetProjectResponse.parse({
    ...project,
    tasks: tasks.map((task, index) => ({ id: task.id, title: task.title, description: task.description, completed: index < project.completedTaskCount })),
    challenges: ["Build the smallest useful version first.", "Explain one tradeoff before changing the design."],
  }));
});

router.get("/profile", async (req, res): Promise<void> => {
  const userId = userIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureSeeded();
  res.json(GetProfileResponse.parse(profileResponse(await getOrCreateProfile(userId))));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const userId = userIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const body = UpdateProfileBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const profile = await getOrCreateProfile(userId);
  const [updated] = await db.update(profilesTable).set({
    ...body.data,
    onboardingComplete: true,
    updatedAt: new Date(),
  }).where(eq(profilesTable.id, profile.id)).returning();
  res.json(UpdateProfileResponse.parse(profileResponse(updated)));
});

export default router;