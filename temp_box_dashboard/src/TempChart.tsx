
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { saveAs } from "file-saver"; // For saving files
import "chart.js/auto";

const TempDashboard: React.FC = () => {
    const [temperature, setTemperature] = useState<number | null>(null);
    const [chartData, setChartData] = useState<{ labels: string[]; dataPoints: number[] }>({
        labels: [],
        dataPoints: [],
    });
    const [allData, setAllData] = useState<any[]>([]); // Full dataset for CSV
    const [startDate, setStartDate] = useState<string>(""); // Start date for time range
    const [endDate, setEndDate] = useState<string>(""); // End date for time range
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTemperatureData = async () => {
            const AIO_USERNAME = import.meta.env.VITE_USERNAME;
            const FEED_KEY = import.meta.env.VITE_FEED_KEY;


            const url = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${FEED_KEY}/data`;
            console.log(url);
            try {
                const response = await axios.get(url, {
                    headers: {
                    },
                });

                const data = response.data;
                console.log(data);
                
                if (data.length > 0) {
                    // Set the latest temperature
                    const latestEntry = data[0];
                    setTemperature(parseFloat(latestEntry.value));

                    // Store all data
                    setAllData(data);

                    // Prepare data for the chart
                    // const labels = data.map((entry: any) => new Date(entry.created_at).toLocaleTimeString());
                    const dataPoints = data.map((entry: any) => parseFloat(entry.value)).reverse();
                    const labels = data.map((entry: any) => {
                        const date = new Date(entry.created_at);
                        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                      })
                      .reverse();
                      
                    setChartData({ labels, dataPoints });
                } else {
                    setError("No data found in the feed.");
                }
            } catch (err) {
                setError("Failed to fetch data from Adafruit IO.");
                console.error(err);
            }
        };

        fetchTemperatureData();
    }, []);

    // Handle CSV download
    const downloadCSV = () => {
        if (allData.length === 0) {
            alert("No data available to download.");
            return;
        }

        // Filter data based on the time range
        const filteredData = allData.filter((entry) => {
            const entryDate = new Date(entry.created_at);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            return (
                (!start || entryDate >= start) &&
                (!end || entryDate <= end)
            );
        });

        // Create CSV content
        const csvContent =
            "data:text/csv;charset=utf-8," +
            ["Timestamp,Value"]
                .concat(filteredData.map((entry) => `${entry.created_at},${entry.value}`))
                .join("\n");

        const blob = new Blob([decodeURIComponent(encodeURI(csvContent))], { type: "text/csv" });
        saveAs(blob, "temperature_data.csv");
    };

    return (
        <div className="p-4 max-w-screen-md mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-center">Temperature Dashboard</h1>

            {/* Display Latest Temperature */}
            <div className="bg-blue-100 p-4 rounded-lg shadow mb-6 text-center">
                {error ? (
                    <p className="text-red-500">{error}</p>
                ) : temperature !== null ? (
                    <div>
                        <p className="text-lg">Current Temperature:</p>
                        <p className="text-4xl font-bold">{temperature.toFixed(2)}°C</p>
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
            </div>

            {/* Time Range Selector */}
            <div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
                <h2 className="text-lg font-semibold mb-2">Select Time Range</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <input
                            type="datetime-local"
                            className="border rounded-md p-2 w-full"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <input
                            type="datetime-local"
                            className="border rounded-md p-2 w-full"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>


            {/* Download CSV Button */}
            <button
                className="bg-green-500 text-white px-4 py-2 rounded-lg shadow mb-6"
                onClick={downloadCSV}
            >
                Download CSV
            </button>

            {/* Line Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Historical Temperature Data</h2>
                <div style={{ height: "300px" }}>
                    <Line
                        data={{
                            labels: chartData.labels,
                            datasets: [
                                {
                                    label: "Temperature (°C)",
                                    data: chartData.dataPoints,
                                    fill: false,
                                    borderColor: "rgba(75,192,192,1)",
                                    backgroundColor: "rgba(75,192,192,0.4)",
                                    tension: 0.4,
                                },
                            ],
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default TempDashboard;
