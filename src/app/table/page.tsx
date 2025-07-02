"use client";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";

export default function TablePage() {
  const searchParams = useSearchParams();
  const tableName = searchParams.get("table");
  const url = searchParams.get("url");
  const key = searchParams.get("key");
  const [data, setData] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<{ user: string; bot: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [chartData, setChartData] = useState<any>(null);
  const [responseType, setResponseType] = useState<"text" | "chart" | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const cleanSQL = (sql: string) => {
    if (!sql) return "";
    return sql.replace(/```sql|```/gi, "").trim();
  };

  const getOpenAISQL = async (input: string) => {
    const res = await fetch("/api/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput: input, tableName, url, key }),
    });
    let { sql, error } = await res.json();
    if (error) throw new Error(error);
    sql = cleanSQL(sql);
    return sql;
  };

  const handleUserInput = async () => {
    if (!userInput.trim()) return;
    setErrorMessage("");
    setChatMessages((prev) => [...prev, { user: userInput, bot: "Thinking..." }]);
    setResponseType(null);
    setChartData(null);
    setData([]);

    try {
      const sql = await getOpenAISQL(userInput);

      if (!sql || !sql.toLowerCase().startsWith("select")) {
        setChatMessages((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1
              ? { ...msg, bot: "Sorry, I couldn't generate a valid SQL query for that." }
              : msg
          )
        );
        return;
      }

      if (userInput.toLowerCase().includes("chart") || userInput.toLowerCase().includes("top")) {
        const supabaseClient = createClient(url!, key!);
        const { data, error } = await supabaseClient.from(tableName!).select("*");
        if (error) {
          setErrorMessage(`Error executing query: ${error.message}`);
          setChatMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1 ? { ...msg, bot: "Error executing query." } : msg
            )
          );
        } else {
          const chartConfig = {
            type: "bar",
            xKey: "employee_name",
            yKey: "sales_amount",
          };
          const chartData = generateChartData(data, chartConfig);
          setChartData(chartData);
          setResponseType("chart");
          setChatMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1
                ? { ...msg, bot: "Here is your chart." }
                : msg
            )
          );
        }
      } else {
        const supabaseClient = createClient(url!, key!);
        let query = supabaseClient.from(tableName!).select("*");
        const limitMatch = sql.match(/limit\s+(\d+)/i);
        if (limitMatch) {
          query = query.limit(Number(limitMatch[1]));
        }
        const { data, error } = await query;
        if (error) {
          setErrorMessage(`Error executing query: ${error.message}`);
          setChatMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1 ? { ...msg, bot: "Error executing query." } : msg
            )
          );
        } else {
          setData(data);
          setResponseType("text");
          setChatMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1
                ? { ...msg, bot: `Here are your results.` }
                : msg
            )
          );
        }
      }
    } catch (err: any) {
      setErrorMessage("Unexpected error occurred while processing user input.");
      setChatMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 ? { ...msg, bot: err.message || "Unexpected error." } : msg
        )
      );
    }

    setUserInput("");
  };

  const generateChartData = (data: any[], config: { xKey: string; yKey: string }) => {
    const labels = data.map((item) => item[config.xKey]);
    const values = data.map((item) => item[config.yKey]);
    return {
      labels,
      datasets: [
        {
          label: "Chart Data",
          data: values,
          backgroundColor: "rgba(34,197,94,0.7)",
          borderColor: "rgba(22,163,74,1)",
          borderWidth: 2,
        },
      ],
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex">
      {/* Left Column: Chat Interface */}
      <div className="w-1/2 border-r border-green-200 flex flex-col p-0">
        <div className="flex items-center px-8 py-6 border-b border-green-200 bg-white">
          <h2 className="text-2xl font-bold text-green-900 tracking-tight">Olive AI Chat</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-green-50 via-white to-green-100">
          {chatMessages.length === 0 && (
            <div className="text-green-400 text-center mt-16">Start a conversation with your database…</div>
          )}
          {chatMessages.map((msg, index) => (
            <div key={index} className="mb-6 flex flex-col gap-2">
              <div className="flex justify-end">
                <div className="max-w-[70%] bg-green-500 text-white px-4 py-2 rounded-2xl rounded-br-sm shadow">
                  {msg.user}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[70%] bg-green-100 text-green-900 px-4 py-2 rounded-2xl rounded-bl-sm shadow border border-green-200">
                  {msg.bot}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="px-8 py-6 border-t border-green-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask anything about your data…"
              className="flex-1 px-4 py-3 rounded-xl bg-green-50 text-green-900 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUserInput();
              }}
              autoFocus
            />
            <button
              onClick={handleUserInput}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition"
            >
              Send
            </button>
          </div>
          {errorMessage && <div className="text-red-500 mt-2">{errorMessage}</div>}
        </div>
      </div>

      {/* Right Column: Response Area */}
      <div className="w-1/2 flex flex-col p-0">
        <div className="flex items-center px-8 py-6 border-b border-green-200 bg-white">
          <h2 className="text-2xl font-bold text-green-900 tracking-tight">Response Area</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-green-50 via-white to-green-100">
          {responseType === "text" && data.length > 0 ? (
            <div className="rounded-xl bg-white p-6 shadow-lg border border-green-100">
              <table className="min-w-full text-sm text-left text-green-900">
                <thead>
                  <tr>
                    {Object.keys(data[0]).map((col) => (
                      <th key={col} className="px-4 py-2 font-semibold border-b border-green-200">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-green-50 transition">
                      {Object.values(row).map((val, i) => (
                        <td key={i} className="px-4 py-2 border-b border-green-100">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : responseType === "chart" && chartData ? (
            <div className="rounded-xl bg-white p-6 shadow-lg border border-green-100">
              <Bar data={chartData} />
            </div>
          ) : (
            <div className="text-green-400 text-center mt-16">No response yet. Ask something to see results.</div>
          )}
        </div>
      </div>
    </div>
  );
}




