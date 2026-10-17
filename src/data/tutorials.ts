// src/data/tutorials.ts

export interface GraphNodeDef {
  id: string;
  label: string;
}

export interface TutorialLesson {
  slug: string;
  module: string;
  title: string;
  seoDescription: string;
  badge: string;
  introParagraph: string;
  concepts: { title: string; description: string }[];
  graphNodes: GraphNodeDef[];
  starterCode: string;
  challengePrompt: string;
}

// Make sure 'export' is written right here:
export const TUTORIALS: TutorialLesson[] = [
  {
    slug: "stategraph-and-cyclic-loops",
    module: "Module 1: LangGraph Theory",
    title: "1. StateGraph & Cyclic Agent Loops",
    seoDescription:
      "Learn how LangGraph StateGraph replaces linear chains with cyclic graphs, shared TypedDict state, and conditional edges in Python.",
    badge: "Module 1 • LangGraph Core",
    introParagraph:
      "In Naive RAG, if your vector database retrieves irrelevant document chunks, the LLM hallucinates. With LangGraph, we replace linear chains with a cyclic state machine that grades retrieved documents first and loops back to rewrite the query automatically if relevance is below threshold.",
    concepts: [
      {
        title: "1. TypedDict State",
        description: "Every node receives the current shared state dictionary and returns partial key updates.",
      },
      {
        title: "2. Grader Router",
        description: "A conditional edge inspects docs_score and routes low scores to a query rewriter.",
      },
      {
        title: "3. Cyclic Recovery",
        description: "Unlike DAGs, LangGraph allows edges that loop back until quality thresholds pass.",
      },
    ],
    graphNodes: [
      { id: "__START__", label: "START" },
      { id: "retrieve", label: "retrieve" },
      { id: "rewrite_query", label: "rewrite_query (Loop)" },
      { id: "generate_answer", label: "generate_answer" },
      { id: "__END__", label: "END" },
    ],
    starterCode: [
      "from typing import TypedDict",
      "from langgraph_mock import StateGraph, START, END",
      "",
      "class AgentState(TypedDict):",
      "    query: str",
      "    docs_score: float",
      "    rewritten: bool",
      "    answer: str",
      "",
      "def retrieve_node(state: AgentState):",
      "    # Try changing 0.4 to 0.9 to skip the rewrite loop!",
      '    return {"docs_score": 0.4 if not state.get("rewritten") else 0.92}',
      "",
      "def grade_documents(state: AgentState):",
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
      '        "answer": f"Verified RAG response for: \'{state[\'query\']}\' (Score: {state[\'docs_score\']})"',
      "    }",
      "",
      "workflow = StateGraph(AgentState)",
      'workflow.add_node("retrieve", retrieve_node)',
      'workflow.add_node("rewrite_query", rewrite_query_node)',
      'workflow.add_node("generate_answer", generate_answer_node)',
      "",
      'workflow.add_edge(START, "retrieve")',
      'workflow.add_conditional_edges("retrieve", grade_documents)',
      'workflow.add_edge("rewrite_query", "retrieve")',
      'workflow.add_edge("generate_answer", END)',
      "",
      "app = workflow.compile()",
      "final_state = app.invoke({",
      '    "query": "How does MCP connect to LangGraph?",',
      '    "docs_score": 0.0,',
      '    "rewritten": False,',
      '    "answer": ""',
      "})",
      'print("Final Answer:", final_state["answer"])',
    ].join("\n"),
    challengePrompt:
      "Change line 11 from 0.4 to 0.85 and click 'Run Agent & Trace'. Watch how the graph skips rewrite_query and finishes in 4 steps instead of 6!",
  },
  {
    slug: "typeddict-reducers-and-messages",
    module: "Module 1: LangGraph Theory",
    title: "2. TypedDict Reducers & Message History",
    seoDescription:
      "Understand why standard dictionary updates overwrite state in LangGraph and how reducer functions append conversation messages.",
    badge: "Module 1 • State Management",
    introParagraph:
      "By default, returning a key from a LangGraph node overwrites the previous value in the state. When building multi-turn agents or tool-calling loops, you need to append new messages to a list rather than erasing the conversation history.",
    concepts: [
      {
        title: "1. State Overwrite Trap",
        description: "Returning {'messages': [new_msg]} replaces the entire list unless you merge or use a reducer.",
      },
      {
        title: "2. Accumulating Traces",
        description: "Appending each agent thought and tool observation creates an auditable reasoning chain.",
      },
      {
        title: "3. Memory Checkpoints",
        description: "Every node transition snapshots the accumulated message array for time-travel debugging.",
      },
    ],
    graphNodes: [
      { id: "__START__", label: "START" },
      { id: "planner", label: "planner_agent" },
      { id: "tool_executor", label: "tool_executor" },
      { id: "synthesizer", label: "synthesizer" },
      { id: "__END__", label: "END" },
    ],
    starterCode: [
      "from typing import TypedDict, List",
      "from langgraph_mock import StateGraph, START, END",
      "",
      "class ChatState(TypedDict):",
      "    messages: List[str]",
      "    tool_calls: int",
      "",
      "def planner_node(state: ChatState):",
      '    new_msg = "Planner: Need to fetch user SQL schema via MCP."',
      '    return {"messages": state["messages"] + [new_msg]}',
      "",
      "def tool_executor_node(state: ChatState):",
      '    obs = "MCP Tool [sql_schema]: Found tables [users, orders, embeddings]"',
      "    return {",
      '        "messages": state["messages"] + [obs],',
      '        "tool_calls": state["tool_calls"] + 1',
      "    }",
      "",
      "def synthesizer_node(state: ChatState):",
      '    final = f"Synthesizer: Completed with {state[\'tool_calls\']} tool call(s)."',
      '    return {"messages": state["messages"] + [final]}',
      "",
      "workflow = StateGraph(ChatState)",
      'workflow.add_node("planner", planner_node)',
      'workflow.add_node("tool_executor", tool_executor_node)',
      'workflow.add_node("synthesizer", synthesizer_node)',
      "",
      'workflow.add_edge(START, "planner")',
      'workflow.add_edge("planner", "tool_executor")',
      'workflow.add_edge("tool_executor", "synthesizer")',
      'workflow.add_edge("synthesizer", END)',
      "",
      "app = workflow.compile()",
      "res = app.invoke({",
      '    "messages": ["User: Show me the revenue per customer query."],',
      '    "tool_calls": 0',
      "})",
      'for m in res["messages"]:',
      "    print(m)",
    ].join("\n"),
    challengePrompt:
      "Step through the nodes using 'Next Node' and watch how the 'messages' array inside the JSON State Inspector grows at every checkpoint instead of being overwritten!",
  },
  {
    slug: "mcp-server-tool-wiring",
    module: "Module 3: MCP Protocol",
    title: "3. Wiring FastMCP Tools into LangGraph",
    seoDescription:
      "Learn how the Model Context Protocol (MCP) standardizes tool discovery and JSON-RPC execution inside a LangGraph agent workflow.",
    badge: "Module 3 • Model Context Protocol",
    introParagraph:
      "Model Context Protocol (MCP) acts as a universal USB-C port for AI applications. Instead of writing custom API wrappers for Slack, Postgres, and GitHub for every agent, you expose tools via an MCP Server and bind them directly to your LangGraph ToolNode.",
    concepts: [
      {
        title: "1. JSON-RPC Discovery",
        description: "The MCP Client calls tools/list to dynamically inspect tool names, descriptions, and JSON schemas.",
      },
      {
        title: "2. Tool Router Edge",
        description: "If the LLM emits a tool_call payload, LangGraph routes execution to the MCP client node.",
      },
      {
        title: "3. Context Injection",
        description: "The MCP Server returns structured text or resource URIs straight back into the AgentState.",
      },
    ],
    graphNodes: [
      { id: "__START__", label: "START" },
      { id: "agent", label: "llm_agent" },
      { id: "mcp_client", label: "mcp_tool_node" },
      { id: "__END__", label: "END" },
    ],
    starterCode: [
      "from typing import TypedDict",
      "from langgraph_mock import StateGraph, START, END",
      "",
      "# Simulated FastMCP Server Registry",
      "MCP_TOOLS = {",
      '    "query_duckdb": lambda q: f"[DuckDB MCP Result]: 1,420 active AI engineers for ({q})"',
      "}",
      "",
      "class MCPAgentState(TypedDict):",
      "    user_prompt: str",
      "    selected_tool: str",
      "    tool_output: str",
      "    final_response: str",
      "",
      "def agent_node(state: MCPAgentState):",
      "    # If we already have tool_output, synthesize the final answer",
      '    if state.get("tool_output"):',
      "        return {",
      '            "selected_tool": "none",',
      '            "final_response": f"Agent Answer based on MCP: {state[\'tool_output\']}"',
      "        }",
      "    # Otherwise request the MCP tool",
      '    return {"selected_tool": "query_duckdb"}',
      "",
      "def route_after_agent(state: MCPAgentState):",
      '    if state["selected_tool"] != "none":',
      '        return "mcp_client"',
      "    return END",
      "",
      "def mcp_client_node(state: MCPAgentState):",
      '    tool_name = state["selected_tool"]',
      '    result = MCP_TOOLS[tool_name](state["user_prompt"])',
      '    return {"tool_output": result}',
      "",
      "workflow = StateGraph(MCPAgentState)",
      'workflow.add_node("agent", agent_node)',
      'workflow.add_node("mcp_client", mcp_client_node)',
      "",
      'workflow.add_edge(START, "agent")',
      'workflow.add_conditional_edges("agent", route_after_agent)',
      'workflow.add_edge("mcp_client", "agent")',
      "",
      "app = workflow.compile()",
      "out = app.invoke({",
      '    "user_prompt": "SELECT count(*) FROM engineers",',
      '    "selected_tool": "none",',
      '    "tool_output": "",',
      '    "final_response": ""',
      "})",
      'print(out["final_response"])',
    ].join("\n"),
    challengePrompt:
      "Add a second tool called 'search_docs' inside the MCP_TOOLS dictionary on line 6, and route to it from agent_node!",
  },
];

// Make sure 'export' is written right here too:
export function getTutorialBySlug(slug: string): TutorialLesson | undefined {
  return TUTORIALS.find((t) => t.slug === slug);
}