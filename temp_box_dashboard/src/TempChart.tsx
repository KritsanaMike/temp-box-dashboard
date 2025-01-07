
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { saveAs } from "file-saver"; // For saving files
import "chart.js/auto";
import { Chart as ChartJS, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

ChartJS.register(...registerables, zoomPlugin);

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


            const url = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${FEED_KEY}/data?limit=1000`;
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
                    // const labels = generateLabels(data.reverse());
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
            alert("ไม่มีข้อมูลสำหรับดาวห์โหลดป");
            return;
        }
        // Convert input dates to ISO format
        const start = startDate ? new Date(startDate).toISOString() : null;
        const end = endDate ? new Date(endDate).toISOString() : null;

        // Filter data
        const filteredData = allData.filter((entry) => {
            const entryDate = new Date(entry.created_at); // API date
            return (
                (!start || entryDate >= new Date(start)) &&
                (!end || entryDate <= new Date(end))
            );
        });

        if (filteredData.length === 0) {
            alert("No data available for the selected time range.");
            return;
        }

        // Create CSV content
        // Format the timestamps to "DD-MM-YYYYTHH:MM:SS" format (24-hour time)
        const formattedData = filteredData.map((entry) => {
            const entryDate = new Date(entry.created_at);

            // Get the date part (DD-MM-YYYY)
            const day = String(entryDate.getDate()).padStart(2, "0");
            const month = String(entryDate.getMonth() + 1).padStart(2, "0"); // getMonth() returns 0-based index
            const year = entryDate.getFullYear();

            // Get the time part (HH:MM:SS) — 24-hour format
            const hours = String(entryDate.getHours()).padStart(2, "0");
            const minutes = String(entryDate.getMinutes()).padStart(2, "0");
            const seconds = String(entryDate.getSeconds()).padStart(2, "0");

            // Concatenate the formatted date and time
            const formattedTimestamp = `${day}-${month}-${year}T${hours}:${minutes}:${seconds}`;
            return `${formattedTimestamp},${entry.value}`;
        });

        // Create CSV content with the custom formatted timestamps
        const csvContent =
            "data:text/csv;charset=utf-8," +
            ["Timestamp,Value"].concat(formattedData).join("\n");

        const blob = new Blob([decodeURIComponent(encodeURI(csvContent))], { type: "text/csv" });
        saveAs(blob, "temperature_data.csv");
    };
    
    return (
        <div className="p-4 max-w-screen-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-center">รายงานอุณหภูมิ</h1>

            {/* Display Latest Temperature */}
            <div className="bg-blue-100 p-4 rounded-lg shadow mb-6 text-center">
                {error ? (
                    <p className="text-red-500">{error}</p>
                ) : temperature !== null ? (
                    <div>
                        <p className="text-lg">อุณหภูมิล่าสุด</p>
                        <p className="text-4xl font-bold">{temperature.toFixed(2)}°C</p>
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
            </div>

            {/* Time Range Selector */}
            <div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
                <h2 className="text-lg font-semibold mb-2">ช่วงเวลาที่ต้องการดาวน์โหลด</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">เริ่มต้น</label>
                        <input
                            type="datetime-local"
                            className="border rounded-md p-2 w-full"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">สิ้นสุด</label>
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
                ดาวน์โหลดไฟล์ CSV
            </button>


            {/* Line Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">ประวัติข้อมูลอุณหภูมิ</h2>
                <div style={{ width: "100%" }}>
                    <Line
                        data={{
                            labels: chartData.labels,
                            datasets: [
                                {
                                    label: "อุณหภูมิ (°C)",
                                    data: chartData.dataPoints,
                                    fill: false,
                                    borderColor: "rgba(75,192,192,1)",
                                    backgroundColor: "rgba(75,192,192,0.4)",
                                    tension: 0.4,
                                },
                            ],
                        }}


                        options={{
                            responsive: true,
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        title: function (tooltipItems) {
                                            const index = tooltipItems[0].dataIndex;
                                            return `Timestamp: ${chartData.labels[index]}`;
                                        },
                                        label: function (tooltipItem) {
                                            const value = tooltipItem.raw;
                                            return `Temperature: ${(value as number).toFixed(2)}°C`;
                                        },
                                    },
                                },
                                zoom: {
                                    pan: {
                                        enabled: true,
                                        mode: "x", // Allow panning in the x-axis
                                    },
                                    zoom: {
                                        wheel: {
                                            enabled: true, // Enable zooming with the mouse wheel
                                        },
                                        pinch: {
                                            enabled: true, // Enable zooming with touch gestures
                                        },
                                        mode: "x", // Allow zooming in the x-axis
                                    },
                                },
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default TempDashboard;
