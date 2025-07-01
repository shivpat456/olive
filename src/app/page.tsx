"use client";

import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import {useRouter} from "next/navigation";


export default function Home() {
  const [url, setUrl] = useState(""); 
  const [key, setKey] = useState(""); 
  const [selectedTable, setSelectedTable] = useState(""); 
  const [errorMessage, setErrorMessage] = useState(""); 
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 

    try {
      const supabaseClient = createClient(url, key); 
      const { data, error } = await supabaseClient.from(selectedTable).select("*"); 
      if (error) {
        setErrorMessage(`Error querying table "${selectedTable}". Please check your credentials or table name.`);
        console.error("Error querying table:", error);
      } else {
        setErrorMessage(""); 
        console.log(`Data from table "${selectedTable}":`, data);
        router.push(`/table?table=${selectedTable}&url=${url}&key=${key}`);
      }
    } catch (err) {
      setErrorMessage("Unexpected error occurred.");
      console.error("Unexpected error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-900 mb-2">Olive</h1>
          <p className="text-green-600">
            Connect your database to generate intelligent admin interfaces
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Supabase URL Input */}
            <div>
              <label htmlFor="supabase-url" className="block text-sm font-medium text-green-700">
                Supabase Project URL
              </label>
              <div className="mt-1">
                <input
                  id="supabase-url"
                  name="supabase-url"
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  onChange={(e) => setUrl(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-green-300 rounded-md placeholder-green-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Supabase Key Input */}
            <div>
              <label htmlFor="supabase-key" className="block text-sm font-medium text-green-700">
                Supabase Anon Key
              </label>
              <div className="mt-1">
                <input
                  id="supabase-key"
                  name="supabase-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  onChange={(e) => setKey(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-green-300 rounded-md placeholder-green-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Table Name Input */}
            <div>
              <label htmlFor="table-name" className="block text-sm font-medium text-green-700">
                Table Name
              </label>
              <div className="mt-1">
                <input
                  id="table-name"
                  name="table-name"
                  type="text"
                  placeholder="Enter table name"
                  onChange={(e) => setSelectedTable(e.target.value)} 
                  className="appearance-none block w-full px-3 py-2 border border-green-300 rounded-md placeholder-green-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Submit & Query Table
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
