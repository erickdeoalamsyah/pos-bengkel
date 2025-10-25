"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function DoughnutCategories({ rows }) {
  // Debug data untuk melihat struktur sebenarnya
  console.log("Data rows:", rows);

  // Ekstrak data dengan handling yang lebih baik
  const labels = (rows || []).map(r => {
    // Cek semua kemungkinan properti yang mungkin ada
    if (r.categoryName) return r.categoryName;
    if (r.name) return r.name;
    if (r.category) return r.category;
    if (r.label) return r.label;
    return "Tanpa Kategori";
  });
  
  const data = (rows || []).map(r => {
    if (r.revenue) return Number(r.revenue);
    if (r.amount) return Number(r.amount);
    if (r.value) return Number(r.value);
    if (r.total) return Number(r.total);
    return 0;
  });

  if (!rows || rows.length === 0) {
    return <div className="h-72 md:h-80 flex items-center justify-center text-sm text-slate-400">
      Tidak ada data pada rentang ini
    </div>;
  }

  const colors = ["#60A5FA","#34D399","#F59E0B","#F472B6","#A78BFA","#22D3EE","#F43F5E","#10B981"];
  const total = data.reduce((a,b) => a + b, 0) || 1;

  const chart = {
    labels,
    datasets: [{
      data,
      backgroundColor: colors.slice(0, data.length),
      borderWidth: 1,
      borderColor: '#ffffff',
      hoverBorderWidth: 3,
      hoverBorderColor: '#ffffff',
      hoverOffset: 10
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        align: "center",
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500',
          },
          generateLabels: (chart) => {
            const ds = chart.data.datasets[0];
            return chart.data.labels.map((label, i) => {
              const val = ds.data[i] || 0;
              const pct = Math.round((val / total) * 100);
              return { 
                text: `${label} - ${pct}%`, 
                fillStyle: ds.backgroundColor[i], 
                strokeStyle: ds.backgroundColor[i],
                lineWidth: 0,
                fontColor: '#fff',
              };
            });
          }
        }
      },
      tooltip: {
        backgroundColor: '#020618',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: (ctx) => {
            const value = ctx.raw || 0;
            const percentage = Math.round((value / total) * 100);
            return [
              `${ctx.label}: Rp ${new Intl.NumberFormat("id-ID").format(value)}`,
              `Persentase: ${percentage}%`
            ];
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true
    },
  };

  // Plugin custom untuk menampilkan text di tengah
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw(chart) {
      const { ctx, chartArea: { width, height } } = chart;
      ctx.save();
      
      // Background circle di tengah
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
      ctx.fillStyle = '#1c1d1c';
      ctx.fill();
      
      // Text utama (Total)
      ctx.font = ' 14px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Total Pendapatan', centerX, centerY - 12);
      
      // Text jumlah
      ctx.font = ' 14px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Rp ${new Intl.NumberFormat('id-ID').format(total)}`, centerX, centerY + 12);
      
      ctx.restore();
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Chart Container */}
      <div className="h-72 md:h-80 w-full">
        <Doughnut 
          data={chart} 
          options={options}
          plugins={[centerTextPlugin]}
        />
      </div>
      
      {/* Custom Legend di bawah chart - lebih rapi */}
      <div className="mt-6 w-full max-w-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {labels.map((label, index) => {
            const value = data[index] || 0;
            const percentage = Math.round((value / total) * 100);
            const color = colors[index % colors.length];
            
            return (
              <div key={index} className="flex items-center space-x-3 p-2 bg-gray-300 rounded-lg">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {label}
                  </div>
                  <div className="text-xs text-gray-700">
                    Rp {new Intl.NumberFormat("id-ID").format(value)} • {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}