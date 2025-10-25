// Global Chart.js dark preset
import {
  Chart as ChartJS, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, ArcElement, Filler
} from "chart.js";

ChartJS.register(
  BarElement, LineElement, PointElement, CategoryScale, LinearScale,
  Tooltip, Legend, ArcElement, Filler
);

ChartJS.defaults.color = "#e5e7eb";               // text slate-200
ChartJS.defaults.borderColor = "rgba(255,255,255,0.1)";
ChartJS.defaults.plugins.legend.labels.boxWidth = 10;
ChartJS.defaults.plugins.tooltip.backgroundColor = "rgba(17,24,39,0.9)"; // gray-900
ChartJS.defaults.scale.grid.color = "rgba(255,255,255,0.08)";
ChartJS.defaults.font.family = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial";
