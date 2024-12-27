import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactSpeedometer from "react-d3-speedometer";


const TemperatureDashboard: React.FC = () => {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemperature = async () => {

      const AIO_USERNAME = import.meta.env.VITE_USERNAME;
      const FEED_KEY = import.meta.env.VITE_FEED_KEY;


      const url = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${FEED_KEY}/data`;
      console.log(url);
      
      try {
        const response = await axios.get(url, {
          headers: {
            // "X-AIO-Key": AIO_KEY,
          },
        });

        const data = response.data;
        if (data.length > 0) {
          const latestEntry = data[0]; // Assuming the latest data is the first entry
          setTemperature(parseFloat(parseFloat(latestEntry.value).toFixed(2)));
          // setTemperature(parseFloat(latestEntry.value));

        } else {
          setError("No data found in the feed.");
        }
      } catch (err) {
        setError("Failed to fetch data from Adafruit IO.");
        console.error(err);
      }
    };

    fetchTemperature();

    // Poll every 5 seconds
    const interval = setInterval(fetchTemperature, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900">
      <h1 className="text-2xl font-bold mb-4 text-white">รายงานอุณหภูมิ</h1>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : temperature !== null ? (
        <div className="w-full max-w-xs">
          <ReactSpeedometer
            maxValue={50} // Adjust the maximum value as per your range
            value={temperature}
            needleColor="red"
            startColor="blue"
            endColor="red"
            segments={5}
            height={200}
            width={300}
            textColor="white"
          />
          <p className="text-center mt-2 text-lg text-white">อุณหภูมิภายในถัง : {temperature}°C</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default TemperatureDashboard;
