import AgentPlayground from "@/components/AgentPlayground";
import { BookOpen, Layers, ShieldCheck, Cpu, ArrowRight, Sparkles } from "lucide-react";

const CURRICULUM = [
  {
    section: "Module 1: LangGraph Theory",
    items: [
      { title: "1. StateGraph & Cyclic Agent Loops", active: true },
      { title: "2. TypedDict Reducers & add_messages", active: false },
      { title: "3. Conditional Edges vs Command API", active: false },
      { title: "4. Checkpointers & Time-Travel Debugging", active: false },
    ],
  },
  {
    section: "Module 2: Agentic RAG",
    items: [
      { title: "5. Corrective RAG (CRAG) Grader Node", active: true },
      { title: "6. Query Rewriting & HyDE Patterns", active: false },
      { title: "7. Self-RAG Hallucination Detection", active: false },
    ],
  },
  {
    section: "Module 3: MCP Protocol",
    items: [
      { title: "8. FastMCP Server from Scratch", active: false },
      { title: "9. Wiring MCP Tools into LangGraph", active: false },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
            AI
          </div>
          <span className="font-bold text-lg tracking-tight">
            Agent<span className="text-emerald-400">Playground</span>
          </span>
          <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
            v1.0 MVP
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <a href="#theory" className="text-emerald-400 font-medium">Tutorials</a>
          <a href="#sandbox" className="hover:text-white">Live Sandbox</a>
          <a href="#newsletter" className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-white">
            Get the AI Interview Kit
          </a>
        </nav>
      </header>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-12">
        {/* Left Curriculum Sidebar (Spark Playground Style) */}
        <aside className="md:col-span-3 border-r border-slate-800/80 p-5 space-y-6 bg-slate-950">
          {CURRICULUM.map((group) => (
            <div key={group.section}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                {group.section}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.title}>
                    <div
                      className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-medium transition ${
                        item.active
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      {item.title}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Right Main Tutorial & Interactive Sandbox */}
        <main className="md:col-span-9 p-6 md:p-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Module 1 &amp; 2 Flagship Tutorial
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
            Building a Self-Correcting RAG Agent with LangGraph State &amp; Conditional Edges
          </h1>

          <p className="text-slate-300 text-base leading-relaxed mb-6">
            In Naive RAG, if your vector database retrieves irrelevant document chunks, the LLM hallucinates. 
            With <strong>LangGraph</strong>, we replace linear chains with a <strong>cyclic state machine</strong> that grades retrieved documents first and loops back to rewrite the query automatically if relevance is below threshold.
          </p>

          {/* Key Concept Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <Layers className="h-5 w-5 text-emerald-400 mb-2" />
              <h3 className="font-semibold text-sm text-white">1. TypedDict State</h3>
              <p className="text-xs text-slate-400 mt-1">
                Every node receives the current shared state dictionary and returns partial key updates.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <ShieldCheck className="h-5 w-5 text-amber-400 mb-2" />
              <h3 className="font-semibold text-sm text-white">2. Grader Router</h3>
              <p className="text-xs text-slate-400 mt-1">
                A conditional edge inspects <code>docs_score</code> and routes low scores to a query rewriter.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <Cpu className="h-5 w-5 text-sky-400 mb-2" />
              <h3 className="font-semibold text-sm text-white">3. Cyclic Recovery</h3>
              <p className="text-xs text-slate-400 mt-1">
                Unlike DAGs, LangGraph allows edges that loop back until quality thresholds pass.
              </p>
            </div>
          </div>

          {/* Embedded Interactive Sandbox */}
          <div id="sandbox">
            <AgentPlayground />
          </div>

          {/* Hands-On Mini Exercise Box */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 mt-8">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Hands-On Challenge (Try it in the Editor above!)
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              1. Click <strong>&ldquo;Run Agent &amp; Trace&rdquo;</strong> and use the <strong>Next Node</strong> button on the right to watch how <code>docs_score: 0.4</code> triggers the <code>rewrite_query</code> loop.<br />
              2. Now edit Line 12 in the code editor: change <code>0.4</code> to <code>0.85</code> and run it again. Notice how the graph skips <code>rewrite_query</code> and routes straight to <code>generate_answer</code>!
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}