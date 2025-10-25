"use client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

// pastikan semua scale/elemen terdaftar
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function DailyRevenueChart({ rows }) {
  const labels = rows.map(r => r.date);
  const data = {
    labels,
    datasets: [
      {
        label: "Pendapatan",
        data: rows.map(r => r.total || 0),
        backgroundColor: "rgba(79,139,255,0.7)",
        borderRadius: 10,
        maxBarThickness: 40,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: {
      x: { grid: { display: false } },
      y: {
        ticks: { callback: v => "Rp " + new Intl.NumberFormat("id-ID").format(v) }
      }
    }
  };
  return <div className="h-72 md:h-80"><Bar data={data} options={options}/></div>;
}
