"use client";

import { createClient } from "@supabase/supabase-js";
import { table } from "console";
import { useSearchParams, useRouter } from "next/navigation";
import {useState, useEffect} from "react";

export default function TablePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tableName = searchParams.get("table"); 
    const url = searchParams.get("url"); 
    const key = searchParams.get("key"); 
    const [data, setData] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>("");


    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabaseClient = createClient(url!, key!);
                const { data, error } = await supabaseClient.from(tableName!).select("*");
                if (error) {
                    setErrorMessage(`Error fetching data from table "${tableName}": ${error.message}`);
                    console.error("Error fetching data:", error);
                }
                else {
                    setData(data)
                    setErrorMessage("");
            }
        } catch (err) {
            setErrorMessage("Unexpected error occurred while fetching data.");
            console.error("Unexpected error:", err);
        }
    };
    fetchData();

    }, [tableName, url, key]);


    const handleTableChange = (selectedTable: string) => {
        router.push(`/table?table=${selectedTable}&url=${url}&key=${key}`);
    };

    return (
            <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-900 mb-2">Table Data</h1>
          <p className="text-green-600">Displaying first 10 rows from table "{tableName}"</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
          <ul className="space-y-4">
            {data.map((row, index) => (
              <li key={index} className="text-green-700 text-sm">
                {JSON.stringify(row)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
    );




}
