"use client";

import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Play, RotateCcw, ChevronRight, ChevronLeft, Terminal, Cpu, CheckCircle2, Sparkles } from "lucide-react";

interface TraceStep {
  step: number;
  node: string;
  state: Record<string, any>;
}

const STARTER_CODE = [
  "from typing import TypedDict",
  "from langgraph_mock import StateGraph, START, END",
  "",
  "# 1. Define your Agent State Schema",
  "class AgentState(TypedDict):",
  "    query: str",
  "    docs_score: float",
  "    rewritten: bool",
  "    answer: str",
  "",
  "# 2. Define Graph Nodes",
  "def retrieve_node(state: AgentState):",
  "    # Simulate vector retrieval score (Try changing 0.4 to 0.9!)",
  '    return {"docs_score": 0.4 if not state.get("rewritten") else 0.92}',
  "",
  "def grade_documents(state: AgentState):",
  "    # Conditional Edge Router: checks if retrieved chunks are relevant",
  '    if state["docs_score"] < 0.7:',
  '        return "rewrite_query"',
  '    return "generate_answer"',
  "",
  "def rewrite_query_node(state: AgentState):",
  "    return {",
  '        "query": state["query"] + " (optimized for hybrid vector search)",',
  '        "rewritten": True',
  "    }",
  "",
  "def generate_answer_node(state: AgentState):",
  "    return {",
  '        "answer": f"Verified RAG response using query: \'{state[\'query\']}\' (Score: {state[\'docs_score\']})"',
  "    }",
  "",
  "# 3. Build & Compile the Stateful Graph",
  "workflow = StateGraph(AgentState)",
  'workflow.add_node("retrieve", retrieve_node)',
  'workflow.add_node("rewrite_query", rewrite_query_node)',
  'workflow.add_node("generate_answer", generate_answer_node)',
  "",
  'workflow.add_edge(START, "retrieve")',
  'workflow.add_conditional_edges("retrieve", grade_documents)',
  'workflow.add_edge("rewrite_query", "retrieve") # Self-correcting loop!',
  'workflow.add_edge("generate_answer", END)',
  "",
  "app = workflow.compile()",
  "",
  "# 4. Invoke Agent with Initial State",
  "final_state = app.invoke({",
  '    "query": "How does MCP connect to LangGraph?",',
  '    "docs_score": 0.0,',
  '    "rewritten": False,',
  '    "answer": ""',
  "})",
  'print("Final Answer:", final_state["answer"])',
].join("\n");

const PYTHON_LANGGRAPH_SHIM = [
  "import json, sys, types",
  "",
  'START = "__START__"',
  'END = "__END__"',
  "_EXECUTION_TRACE = []",
  "",
  "class StateGraph:",
  "    def __init__(self, state_schema):",
  "        self.nodes = {}",
  "        self.edges = {}",
  "        self.conditional_edges = {}",
  "",
  "    def add_node(self, name, fn):",
  "        self.nodes[name] = fn",
  "",
  "    def add_edge(self, start, end):",
  "        self.edges[start] = end",
  "",
  "    def add_conditional_edges(self, source, router_fn):",
  "        self.conditional_edges[source] = router_fn",
  "",
  "    def compile(self):",
  "        return CompiledGraph(self.nodes, self.edges, self.conditional_edges)",
  "",
  "class CompiledGraph:",
  "    def __init__(self, nodes, edges, conditional_edges):",
  "        self.nodes = nodes",
  "        self.edges = edges",
  "        self.conditional_edges = conditional_edges",
  "",
  "    def invoke(self, initial_state):",
  "        global _EXECUTION_TRACE",
  "        _EXECUTION_TRACE = []",
  "        state = dict(initial_state)",
  "        step = 0",
  '        _EXECUTION_TRACE.append({"step": step, "node": START, "state": dict(state)})',
  "",
  "        curr = self.edges.get(START)",
  "        while curr and curr != END and step < 15:",
  "            step += 1",
  "            fn = self.nodes[curr]",
  "            updates = fn(dict(state))",
  "            if isinstance(updates, dict):",
  "                state.update(updates)",
  '            _EXECUTION_TRACE.append({"step": step, "node": curr, "state": dict(state)})',
  "",
  "            if curr in self.conditional_edges:",
  "                curr = self.conditional_edges[curr](dict(state))",
  "            else:",
  "                curr = self.edges.get(curr, END)",
  "",
  "        step += 1",
  '        _EXECUTION_TRACE.append({"step": step, "node": END, "state": dict(state)})',
  "        return state",
  "",
  'mod = types.ModuleType("langgraph_mock")',
  "mod.StateGraph = StateGraph",
  "mod.START = START",
  "mod.END = END",
  'sys.modules["langgraph_mock"] = mod',
].join("\n");

interface GraphNodeDef {
  id: string;
  label: string;
}

interface AgentPlaygroundProps {
  initialCode?: string;
  customNodes?: GraphNodeDef[];
}

export default function AgentPlayground({
  initialCode = STARTER_CODE,
  customNodes,
}: AgentPlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "Ready. Click 'Run Agent & Trace' to execute in-browser Python.",
  ]);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const pyodideRef = useRef<any>(null);

  // Reset code & trace whenever the user navigates to a new tutorial page
  useEffect(() => {
    setCode(initialCode);
    setTrace([]);
    setActiveStepIdx(0);
    setLogs(["Ready. Click 'Run Agent & Trace' to execute in-browser Python."]);
  }, [initialCode]);

  // Load Pyodide asynchronously from CDN
  useEffect(() => {
    const loadPyodideEngine = async () => {
      if ((window as any).loadPyodide) {
        pyodideRef.current = await (window as any).loadPyodide();
        await pyodideRef.current.runPythonAsync(PYTHON_LANGGRAPH_SHIM);
        setPyodideReady(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
      script.async = true;
      script.onload = async () => {
        pyodideRef.current = await (window as any).loadPyodide();
        await pyodideRef.current.runPythonAsync(PYTHON_LANGGRAPH_SHIM);
        setPyodideReady(true);
      };
      document.body.appendChild(script);
    };
    loadPyodideEngine();
  }, []);

  const runAgentCode = async () => {
    if (!pyodideRef.current) return;
    setIsRunning(true);
    const capturedLogs: string[] = [];

    try {
      pyodideRef.current.setStdout({
        batched: (msg: string) => capturedLogs.push(msg),
      });
      await pyodideRef.current.runPythonAsync(PYTHON_LANGGRAPH_SHIM);
      await pyodideRef.current.runPythonAsync(code);

      const rawTrace = await pyodideRef.current.runPythonAsync(
        "json.dumps(_EXECUTION_TRACE)"
      );
      const parsedTrace: TraceStep[] = JSON.parse(rawTrace);
      setTrace(parsedTrace);
      setActiveStepIdx(0);
      setLogs(
        capturedLogs.length
          ? capturedLogs
          : ["Executed successfully with zero errors."]
      );
    } catch (err: any) {
      setLogs([`Python Traceback:\n${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const currentTrace = trace[activeStepIdx];
  const graphNodes = customNodes || [
    { id: "__START__", label: "START" },
    { id: "retrieve", label: "retrieve" },
    { id: "rewrite_query", label: "rewrite_query (Loop)" },
    { id: "generate_answer", label: "generate_answer" },
    { id: "__END__", label: "END" },
  ];

  return (
    <div className="my-8 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            Interactive LangGraph Sandbox
          </span>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            {pyodideReady ? "Pyodide WASM Ready ($0 API Cost)" : "Loading Python Engine..."}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCode(STARTER_CODE)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            onClick={runAgentCode}
            disabled={!pyodideReady || isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {isRunning ? "Running..." : "Run Agent & Trace"}
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Monaco Code Editor */}
        <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-800">
          <Editor
            height="480px"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              padding: { top: 14 },
            }}
          />
        </div>

        {/* Right: Visual State Graph Tracer & Inspector */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/40 p-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Live State Graph Visualizer
              </span>
              {trace.length > 0 && (
                <span className="text-xs text-emerald-400 font-mono">
                  Step {activeStepIdx + 1} of {trace.length}
                </span>
              )}
            </div>

            {/* Node Flow Diagram */}
            <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/90 p-4">
              {graphNodes.map((n, idx) => {
                const isActive = currentTrace?.node === n.id;
                const wasVisited = trace.slice(0, activeStepIdx + 1).some((t) => t.node === n.id);
                return (
                  <React.Fragment key={n.id}>
                    <div
                      className={`w-full max-w-[230px] rounded-lg border px-3 py-2 text-center text-xs font-mono transition-all duration-300 ${
                        isActive
                          ? "border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105 font-bold"
                          : wasVisited
                          ? "border-slate-700 bg-slate-800/70 text-slate-300"
                          : "border-slate-800 bg-slate-900/40 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        {wasVisited && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                        {n.label}
                      </div>
                    </div>
                    {idx < graphNodes.length - 1 && (
                      <div className="h-3 w-0.5 bg-slate-700" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Step-Through Controls */}
            {trace.length > 0 ? (
              <div className="mt-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <button
                    onClick={() => setActiveStepIdx((i) => Math.max(0, i - 1))}
                    disabled={activeStepIdx === 0}
                    className="flex-1 flex items-center justify-center gap-1 rounded border border-slate-700 bg-slate-800 py-1.5 text-xs font-medium hover:bg-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev Node
                  </button>
                  <button
                    onClick={() => setActiveStepIdx((i) => Math.min(trace.length - 1, i + 1))}
                    disabled={activeStepIdx === trace.length - 1}
                    className="flex-1 flex items-center justify-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40"
                  >
                    Next Node <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* State Checkpoint JSON Inspector */}
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <div className="text-[11px] font-mono text-slate-400 mb-1">
                    Checkpoint State @ <span className="text-emerald-400">{currentTrace?.node}</span>:
                  </div>
                  <pre className="text-xs font-mono text-amber-300 overflow-x-auto">
                    {JSON.stringify(currentTrace?.state, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
                Click <strong>&ldquo;Run Agent &amp; Trace&rdquo;</strong> above to execute the Python graph and inspect every state checkpoint.
              </div>
            )}
          </div>

          {/* Console Output */}
          <div className="mt-4 rounded-lg border border-slate-800 bg-black/70 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              <Terminal className="h-3 w-3" /> Console Output
            </div>
            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
              {logs.join("\n")}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}