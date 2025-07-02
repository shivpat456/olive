"use client";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function TablePage() {
  const searchParams = useSearchParams();
  const tableName = searchParams.get("table");
  const url = searchParams.get("url");
  const key = searchParams.get("key");
  const [data, setData] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<{ user: string; bot: string }[]>([]);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabaseClient = createClient(url!, key!);
        const { data, error } = await supabaseClient.from(tableName!).select("*");
        if (error) {
          setErrorMessage(`Error fetching data from table "${tableName}": ${error.message}`);
          console.error("Error fetching data:", error);
        } else {
          setData(data);
          setErrorMessage("");
        }
      } catch (err) {
        setErrorMessage("Unexpected error occurred while fetching data.");
        console.error("Unexpected error:", err);
      }
    };
    fetchData();
  }, [tableName, url, key]);

  const handleUserInput = async () => {
    if (!userInput.trim()) return;

    // Add user input to chat
    setChatMessages((prev) => [...prev, { user: userInput, bot: "Thinking..." }]);

    // Simulate bot response (replace this with OpenAI integration later)
    setTimeout(() => {
      setChatMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1 ? { ...msg, bot: `Response for: "${userInput}"` } : msg
        )
      );
    }, 1000);

    setUserInput(""); // Clear input field
  };

  return (
    <div className="min-h-screen bg-green-50 flex">
      {/* Left Column: Chat Interface */}
      <div className="w-1/2 border-r border-green-200 p-4">
        <h2 className="text-2xl font-bold text-green-900 mb-4">Chat with Database</h2>
        <div className="space-y-4 overflow-y-auto h-[70vh] border border-green-300 rounded-md p-4 bg-white">
          {chatMessages.map((msg, index) => (
            <div key={index} className="space-y-2">
              <p className="text-green-700 font-medium">User: {msg.user}</p>
              <p className="text-green-600">Bot: {msg.bot}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask something..."
            className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={handleUserInput}
            className="ml-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Send
          </button>
        </div>
      </div>

      {/* Right Column: Response Area */}
      <div className="w-1/2 p-4">
        <h2 className="text-2xl font-bold text-green-900 mb-4">Response Area</h2>
        {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
        <div className="space-y-4 overflow-y-auto h-[70vh] border border-green-300 rounded-md p-4 bg-white">
          {data.length > 0 ? (
            <ul className="space-y-2">
              {data.slice(0, 10).map((row, index) => (
                <li key={index} className="text-green-700 text-sm">
                  {JSON.stringify(row)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-green-600">No data to display.</p>
          )}
        </div>
      </div>
    </div>
  );
}




