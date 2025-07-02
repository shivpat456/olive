import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { userInput, tableName, url, key } = await req.json();
    const supabase = createClient(url, key);

    // Dynamically get schema and sample data
    const { data: rows, error } = await supabase.from(tableName).select("*").limit(3);
    if (error || !rows || rows.length === 0) {
      return NextResponse.json({ error: "No data found in table." }, { status: 500 });
    }
    // Build schema string dynamically
    const schema = Object.entries(rows[0])
      .map(([col, val]) => `${col}: ${typeof val}`)
      .join(", ");
    const sampleData = JSON.stringify(rows, null, 2);

    // Dynamic prompt: No hardcoded columns or business logic
    const prompt = `
You are an expert Postgres SQL generator.

Here is the schema for the "${tableName}" table:
${schema}

Here are some sample rows:
${sampleData}

User question: "${userInput}"

Instructions:
- Use only the columns from the schema above.
- For value-based queries, always use a WHERE clause.
- For case-insensitive or partial matches, use ILIKE and wrap the value in % if partial.
- For multiple conditions, use AND.
- Use LIMIT if the user asks for a specific number of results.
- Never return all rows unless the user explicitly asks for all.
- Never hallucinate columns; only use columns from the schema.
- Return ONLY a valid SQL SELECT statement for the "${tableName}" table, nothing else.
- Do not include explanations, comments, or markdown/code block formatting.
`;

    // Get SQL from OpenAI
    let sql = "";
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0,
      });
      sql = completion.choices?.[0]?.message?.content?.trim() ?? "";
      sql = sql.replace(/```sql|```/gi, "").trim();
    } catch (openaiErr: any) {
      return NextResponse.json({ error: "OpenAI error: " + openaiErr.message }, { status: 500 });
    }

    // Only allow SELECT queries for safety
    if (!sql.toLowerCase().startsWith("select")) {
      return NextResponse.json({ error: "Only SELECT queries are supported." }, { status: 400 });
    }

    // (Optional) You can parse and run the SQL using Supabase's query builder if you want to execute it.
    // For now, just return the generated SQL.
    return NextResponse.json({ sql });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}