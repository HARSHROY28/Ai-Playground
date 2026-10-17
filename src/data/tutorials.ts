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
  testCode: string; // Python assertions that verify the user solved the challenge
}

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
      "    # CHALLENGE: Change 0.4 to 0.85 so the first retrieval passes the grader!",
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
      "Modify retrieve_node on line 12 so the initial docs_score is >= 0.7 (e.g. 0.85), allowing the graph to route directly to generate_answer without triggering rewrite_query!",
    testCode: [
      "visited_nodes = [t['node'] for t in _EXECUTION_TRACE]",
      "assert 'rewrite_query' not in visited_nodes, 'Test Failed: Graph still routed through rewrite_query! Make sure initial docs_score >= 0.7.'",
      "assert final_state['docs_score'] >= 0.7, 'Test Failed: final_state docs_score must be >= 0.7.'",
      "assert len(_EXECUTION_TRACE) == 4, f'Expected 4 trace steps (START -> retrieve -> generate_answer -> END), got {len(_EXECUTION_TRACE)}.'",
    ].join("\n"),
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
      "    # CHALLENGE: Increment tool_calls by 2 instead of 1 to simulate 2 parallel MCP calls",
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
      "Update tool_executor_node so that tool_calls increments by 2 (simulating two parallel MCP tool invocations) and verify that res['messages'] preserves all 4 conversation turns!",
    testCode: [
      "assert len(res['messages']) == 4, f'Expected 4 messages in history, got {len(res[\"messages\"])}'",
      "assert res['tool_calls'] == 2, f'Expected tool_calls to equal 2, but got {res[\"tool_calls\"]}. Update line 17!'",
    ].join("\n"),
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
      "# CHALLENGE: Add a 'search_docs' key to MCP_TOOLS and route to it in agent_node!",
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
      '    if state.get("tool_output"):',
      "        return {",
      '            "selected_tool": "none",',
      '            "final_response": f"Agent Answer based on MCP: {state[\'tool_output\']}"',
      "        }",
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
      "Add a new tool named 'search_docs' inside MCP_TOOLS (e.g., lambda q: f'Docs for {q}') and change line 21 so agent_node selects 'search_docs' instead of 'query_duckdb'!",
    testCode: [
      "assert 'search_docs' in MCP_TOOLS, 'Test Failed: Add \"search_docs\" to the MCP_TOOLS dictionary!'",
      "assert 'query_duckdb' not in out['tool_output'], 'Test Failed: Make sure agent_node routes to \"search_docs\" instead of \"query_duckdb\"!'",
    ].join("\n"),
  },
];

export function getTutorialBySlug(slug: string): TutorialLesson | undefined {
  return TUTORIALS.find((t) => t.slug === slug);
}