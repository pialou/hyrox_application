#!/usr/bin/env node
/**
 * Hyrox Intel MCP Server
 * 
 * Provides tools to interact with PostgreSQL database and n8n workflows
 * for the Hyrox Intel training application.
 */

// @ts-ignore
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// @ts-ignore
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// @ts-ignore
import pg from "pg";

const { Pool } = pg;

// ============================================================================
// Configuration
// ============================================================================

const DB_CONFIG = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "hyrox_app_db",
    user: process.env.DB_USER || "hyrox_admin",
    password: process.env.DB_PASSWORD || "hyrox_secure_pass",
};

const N8N_CONFIG = {
    baseUrl: process.env.N8N_URL || "http://localhost:5678",
    apiKey: process.env.N8N_API_KEY || "",
};

// ============================================================================
// Database Pool
// ============================================================================

const pool = new Pool(DB_CONFIG);

// ============================================================================
// Utility Functions
// ============================================================================

async function executeQuery(query: string, params: any[] = []): Promise<any> {
    const client = await pool.connect();
    try {
        const result = await client.query(query, params);
        return result;
    } finally {
        client.release();
    }
}

async function n8nRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any
): Promise<any> {
    const url = `${N8N_CONFIG.baseUrl}/api/v1${endpoint}`;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (N8N_CONFIG.apiKey) {
        headers["X-N8N-API-KEY"] = N8N_CONFIG.apiKey;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        throw new Error(`n8n API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// ============================================================================
// Zod Schemas
// ============================================================================

// Define explicit primitive types for SQL parameters and data to satisfy Gemini's strict schema requirements
const PrimitiveSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null()
]);

const QuerySchema = z.object({
    sql: z.string()
        .min(1, "SQL query is required")
        .describe("SQL SELECT query to execute. Only SELECT queries are allowed for safety."),
    params: z.array(PrimitiveSchema)
        .optional()
        .default([])
        .describe("Optional array of parameters for parameterized queries"),
}).strict();

const TableNameSchema = z.object({
    table: z.string()
        .min(1, "Table name is required")
        .describe("Name of the table to describe"),
}).strict();

const InsertSchema = z.object({
    table: z.string().min(1).describe("Table name"),
    data: z.record(z.string(), PrimitiveSchema).describe("Object with column names as keys and values to insert"),
}).strict();

const UpdateSchema = z.object({
    table: z.string().min(1).describe("Table name"),
    data: z.record(z.string(), PrimitiveSchema).describe("Object with column names and new values"),
    where: z.string().min(1).describe("WHERE clause without the WHERE keyword (e.g., 'id = $1')"),
    whereParams: z.array(PrimitiveSchema).describe("Parameters for the WHERE clause"),
}).strict();

const WorkflowIdSchema = z.object({
    workflowId: z.string().min(1).describe("n8n workflow ID"),
}).strict();

const ExecuteWorkflowSchema = z.object({
    workflowId: z.string().min(1).describe("n8n workflow ID to execute"),
    data: z.record(z.string(), PrimitiveSchema).optional().describe("Optional data to pass to the workflow"),
}).strict();

// ============================================================================
// MCP Server
// ============================================================================

const server = new McpServer({
    name: "hyrox-intel-mcp",
    version: "1.0.0",
});

// ----------------------------------------------------------------------------
// PostgreSQL Tools
// ----------------------------------------------------------------------------

server.registerTool(
    "db_query",
    {
        title: "Execute SQL Query",
        description: `Execute a read-only SQL SELECT query on the PostgreSQL database.

IMPORTANT: Only SELECT queries are allowed for safety. Use db_insert or db_update for modifications.

Database: hyrox_app_db
Available tables: training_plan, athlete_metrics, availability_slots, exercise_library, n8n_chat_histories, strava_sync

Examples:
- "SELECT * FROM training_plan LIMIT 10"
- "SELECT * FROM training_plan WHERE is_structured = true"
- "SELECT id, title, status FROM training_plan WHERE status = $1" with params: ["ready"]`,
        inputSchema: QuerySchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async (params: z.infer<typeof QuerySchema>) => {
        try {
            // Security: Only allow SELECT queries
            const normalizedSql = params.sql.trim().toUpperCase();
            if (!normalizedSql.startsWith("SELECT")) {
                return {
                    content: [{
                        type: "text",
                        text: "Error: Only SELECT queries are allowed. Use db_insert or db_update for modifications.",
                    }],
                };
            }

            const result = await executeQuery(params.sql, params.params);

            const output = {
                rowCount: result.rowCount,
                rows: result.rows,
                fields: result.fields?.map((f: any) => ({ name: f.name, dataType: f.dataTypeID })),
            };

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(output, null, 2),
                }],
                structuredContent: output,
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Database error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

server.registerTool(
    "db_list_tables",
    {
        title: "List Database Tables",
        description: "List all tables in the hyrox_app_db PostgreSQL database with their row counts.",
        inputSchema: z.object({}).strict(),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async () => {
        try {
            const result = await executeQuery(`
        SELECT 
          schemaname,
          tablename,
          (SELECT COUNT(*) FROM information_schema.columns 
           WHERE table_schema = t.schemaname AND table_name = t.tablename) as column_count
        FROM pg_tables t
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);

            // Get row counts
            const tablesWithCounts = await Promise.all(
                result.rows.map(async (row: any) => {
                    const countResult = await executeQuery(
                        `SELECT COUNT(*) as count FROM "${row.tablename}"`
                    );
                    return {
                        name: row.tablename,
                        schema: row.schemaname,
                        columns: row.column_count,
                        rows: parseInt(countResult.rows[0].count),
                    };
                })
            );

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ tables: tablesWithCounts }, null, 2),
                }],
                structuredContent: { tables: tablesWithCounts },
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Error listing tables: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

server.registerTool(
    "db_describe_table",
    {
        title: "Describe Table Schema",
        description: "Get the schema details of a specific table including columns, types, and constraints.",
        inputSchema: TableNameSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async (params: z.infer<typeof TableNameSchema>) => {
        try {
            const result = await executeQuery(`
        SELECT 
          column_name,
          data_type,
          column_default,
          is_nullable,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [params.table]);

            if (result.rows.length === 0) {
                return {
                    content: [{
                        type: "text",
                        text: `Error: Table '${params.table}' not found.`,
                    }],
                };
            }

            // Get indexes
            const indexes = await executeQuery(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1
      `, [params.table]);

            const output = {
                table: params.table,
                columns: result.rows,
                indexes: indexes.rows,
            };

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(output, null, 2),
                }],
                structuredContent: output,
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Error describing table: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

server.registerTool(
    "db_insert",
    {
        title: "Insert Data",
        description: `Insert a new row into a table. Returns the inserted row with its generated ID.

Example:
- table: "training_plan"
- data: { "title": "New Plan", "description": "My training plan", "session_date": "2026-02-01", "category": "hyrox" }`,
        inputSchema: InsertSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    async (params: z.infer<typeof InsertSchema>) => {
        try {
            const columns = Object.keys(params.data);
            const values = Object.values(params.data);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

            const sql = `
        INSERT INTO "${params.table}" (${columns.map(c => `"${c}"`).join(", ")})
        VALUES (${placeholders})
        RETURNING *
      `;

            const result = await executeQuery(sql, values);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ inserted: result.rows[0] }, null, 2),
                }],
                structuredContent: { inserted: result.rows[0] },
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Insert error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

server.registerTool(
    "db_update",
    {
        title: "Update Data",
        description: `Update existing rows in a table.

Example:
- table: "training_plan"
- data: { "is_structured": true, "status": "ready" }
- where: "id = $1"
- whereParams: ["uuid-here"]`,
        inputSchema: UpdateSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async (params: z.infer<typeof UpdateSchema>) => {
        try {
            const columns = Object.keys(params.data);
            const values = Object.values(params.data);

            // Offset parameter indices for WHERE clause
            const setClause = columns
                .map((col, i) => `"${col}" = $${i + 1}`)
                .join(", ");

            // Adjust WHERE params indices
            const whereClause = params.where.replace(
                /\$(\d+)/g,
                (_: string, num: string) => `$${parseInt(num) + columns.length}`
            );

            const sql = `
        UPDATE "${params.table}"
        SET ${setClause}, updated_at = NOW()
        WHERE ${whereClause}
        RETURNING *
      `;

            const allParams = [...values, ...params.whereParams];
            const result = await executeQuery(sql, allParams);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        updated: result.rowCount,
                        rows: result.rows
                    }, null, 2),
                }],
                structuredContent: { updated: result.rowCount, rows: result.rows },
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Update error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

// ----------------------------------------------------------------------------
// n8n Tools
// ----------------------------------------------------------------------------

server.registerTool(
    "n8n_list_workflows",
    {
        title: "List n8n Workflows",
        description: "List all workflows in n8n with their status and basic info.",
        inputSchema: z.object({}).strict(),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    async () => {
        try {
            const data = await n8nRequest("/workflows");

            const workflows = data.data?.map((wf: any) => ({
                id: wf.id,
                name: wf.name,
                active: wf.active,
                createdAt: wf.createdAt,
                updatedAt: wf.updatedAt,
            })) || [];

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ workflows }, null, 2),
                }],
                structuredContent: { workflows },
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `n8n error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

server.registerTool(
    "n8n_get_workflow",
    {
        title: "Get Workflow Details",
        description: "Get detailed information about a specific n8n workflow.",
        inputSchema: WorkflowIdSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    async (params: z.infer<typeof WorkflowIdSchema>) => {
        try {
            const workflow = await n8nRequest(`/workflows/${params.workflowId}`);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(workflow, null, 2),
                }],
                structuredContent: workflow,
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `n8n error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

server.registerTool(
    "n8n_execute_workflow",
    {
        title: "Execute n8n Workflow",
        description: `Trigger execution of an n8n workflow with optional input data.

Use this to trigger the Architect workflow that structures training plans.`,
        inputSchema: ExecuteWorkflowSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
    async (params: z.infer<typeof ExecuteWorkflowSchema>) => {
        try {
            const result = await n8nRequest(
                `/workflows/${params.workflowId}/run`,
                "POST",
                params.data ? { data: params.data } : undefined
            );

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                }],
                structuredContent: result,
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `n8n execution error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

// ============================================================================
// Server Startup
// ============================================================================

async function main() {
    console.error("Starting Hyrox Intel MCP Server...");
    console.error(`Database: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
    console.error(`n8n: ${N8N_CONFIG.baseUrl}`);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("MCP Server connected via stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
