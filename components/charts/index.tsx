import React, { useState, useMemo } from 'react';

// --- Monthly Cashflow Chart (Bar Chart) ---
interface MonthlyCashflowChartProps {
  data: { month: string; balance: number; income: number; expense: number; }[];
}

export const MonthlyCashflowChart: React.FC<MonthlyCashflowChartProps> = ({ data }) => {
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number; activeBar: string; } | null>(null);
  const width = 500;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const { bars, yAxisLabels, xAxisLabels, zeroLineY } = useMemo(() => {
    const validData = data.filter(d => !isNaN(d.balance) && d.balance !== null);
    if (validData.length === 0) {
        return { bars: [], yAxisLabels: [], xAxisLabels: [], zeroLineY: height / 2};
    }

    const maxBalance = Math.max(...validData.map(d => d.balance), 0);
    const minBalance = Math.min(...validData.map(d => d.balance), 0);
    let range = maxBalance - minBalance;
    if (range === 0) range = Math.abs(maxBalance * 2) || 1000;


    const yScale = (val: number) => padding.top + ((maxBalance - val) / range) * (height - padding.top - padding.bottom);
    const zeroLineY = yScale(0);
    
    const barWidth = (width - padding.left - padding.right) / validData.length * 0.7;

    const bars = validData.map((d, i) => {
      const x = padding.left + (i * ((width - padding.left - padding.right) / validData.length)) + ((width - padding.left - padding.right) / validData.length / 2) - barWidth/2;
      const barHeight = Math.abs(yScale(d.balance) - zeroLineY);
      const y = d.balance >= 0 ? yScale(d.balance) : zeroLineY;

      return {
        x,
        y,
        height: barHeight,
        width: barWidth,
        fill: d.balance >= 0 ? '#10B981' : '#EF4444',
        month: new Date(d.month + '-02').toLocaleString('default', { month: 'short' }),
        value: d.balance,
        income: d.income,
        expense: d.expense,
        fullMonth: d.month
      };
    });

    const yAxisTicks = 5;
    const yAxisLabels = Array.from({ length: yAxisTicks + 1 }).map((_, i) => {
      const value = minBalance + (range / yAxisTicks) * i;
      return {
        y: yScale(value),
        label: (value / 1000).toFixed(0) + 'k'
      };
    });

    const xAxisLabels = bars.map(bar => ({ x: bar.x + bar.width / 2, label: bar.month }));

    return { bars, yAxisLabels, xAxisLabels, zeroLineY };
  }, [data, height, width, padding]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const ctm = svg.getScreenCTM();
    if (!ctm) return; // Guard against null CTM
    
    const svgPoint = pt.matrixTransform(ctm.inverse());
    const mouseX = svgPoint.x;
    
    const activeBar = bars.find(bar => mouseX >= bar.x && mouseX <= bar.x + bar.width);

    if (activeBar) {
      const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
      
      const content = `
        <div class="font-bold text-sm mb-1">${new Date(activeBar.fullMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
        <div class="text-xs space-y-1 w-48">
            <div class="flex justify-between items-center"><span>Receitas:</span><span class="font-semibold text-green-400 ml-2">${formatCurrency(activeBar.income)}</span></div>
            <div class="flex justify-between items-center"><span>Despesas:</span><span class="font-semibold text-red-400 ml-2">${formatCurrency(activeBar.expense)}</span></div>
            <div class="border-t border-gray-600 my-1"></div>
            <div class="flex justify-between items-center"><span>Saldo Final:</span><span class="font-bold text-base ml-2">${formatCurrency(activeBar.value)}</span></div>
        </div>
      `;

      const svgRect = svg.getBoundingClientRect();
      const relativeX = e.clientX - svgRect.left;
      const relativeY = e.clientY - svgRect.top;

      setTooltip({
        content: content,
        x: relativeX,
        y: relativeY,
        activeBar: activeBar.fullMonth,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
            <linearGradient id="gradient-green" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="gradient-red" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
        </defs>

        {/* Y Axis */}
        {yAxisLabels.map(label => (
          <g key={label.y}>
            <line x1={padding.left - 5} y1={label.y} x2={width - padding.right} y2={label.y} className="stroke-gray-200 dark:stroke-gray-700" strokeDasharray="2" />
            <text x={padding.left - 10} y={label.y + 4} textAnchor="end" fontSize="10" className="fill-gray-500 dark:fill-gray-400">{label.label}</text>
          </g>
        ))}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} className="stroke-gray-300 dark:stroke-gray-600" />

        {/* X Axis */}
        {xAxisLabels.map(label => (
          <text key={label.x} x={label.x} y={height - padding.bottom + 15} textAnchor="middle" fontSize="10" className="fill-gray-500 dark:fill-gray-400">{label.label}</text>
        ))}
        
        {/* Zero Line */}
        <line x1={padding.left} y1={zeroLineY} x2={width - padding.right} y2={zeroLineY} className="stroke-gray-400 dark:stroke-gray-500" />

        {/* Bars */}
        {bars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            fill={bar.value >= 0 ? "url(#gradient-green)" : "url(#gradient-red)"}
            rx="4"
            className="transition-opacity duration-200"
            style={{ opacity: tooltip && tooltip.activeBar !== bar.fullMonth ? 0.5 : 1 }}
          />
        ))}
      </svg>
      {tooltip && (
        <div
          className="absolute bg-gray-900 bg-opacity-90 backdrop-blur-sm text-white text-xs rounded-lg shadow-lg py-2 px-4 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 15 }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        >
        </div>
      )}
    </div>
  );
};


// --- Wealth Projection Chart (Area Chart) ---
interface WealthProjectionChartProps {
    data: { year: number; aportes: number; growth: number }[];
    principalLabel?: string;
    growthLabel?: string;
}

export const WealthProjectionChart: React.FC<WealthProjectionChartProps> = ({ data, principalLabel = "Aportes", growthLabel = "Crescimento (Juros)" }) => {
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
    const width = 500;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };

    const { areaPathAportes, areaPathTotal, points, yAxisLabels, xAxisLabels } = useMemo(() => {
        if (data.length === 0) return { areaPathAportes: '', areaPathTotal: '', points: [], yAxisLabels: [], xAxisLabels: [] };

        const maxValue = Math.max(...data.map(d => d.aportes + d.growth));
        const xScale = (yearIndex: number) => padding.left + yearIndex * ((width - padding.left - padding.right) / (data.length - 1 || 1));
        const yScale = (value: number) => height - padding.bottom - (value / maxValue) * (height - padding.top - padding.bottom);

        const createAreaPath = (d: (typeof data[0])[], key: 'aportes' | 'total') => {
            let path = `M ${xScale(0)},${yScale(key === 'aportes' ? d[0].aportes : d[0].aportes + d[0].growth)}`;
            d.slice(1).forEach((p, i) => {
                path += ` L ${xScale(i + 1)},${yScale(key === 'aportes' ? p.aportes : p.aportes + p.growth)}`;
            });
            path += ` L ${xScale(d.length - 1)},${height - padding.bottom} L ${xScale(0)},${height - padding.bottom} Z`;
            return path;
        };

        const points = data.map((d, i) => ({
            x: xScale(i),
            y: yScale(d.aportes + d.growth),
            year: d.year,
            total: d.aportes + d.growth,
            aportes: d.aportes,
            growth: d.growth,
        }));

        const yAxisTicks = 5;
        const yAxisLabels = Array.from({ length: yAxisTicks + 1 }).map((_, i) => {
            const value = (maxValue / yAxisTicks) * i;
            return {
                y: yScale(value),
                label: (value / 1000).toFixed(0) + 'k'
            };
        });

        const xAxisLabels = data.map((d, i) => ({ x: xScale(i), label: `Ano ${d.year}` }));

        return {
            areaPathAportes: createAreaPath(data, 'aportes'),
            areaPathTotal: createAreaPath(data, 'total'),
            points,
            yAxisLabels,
            xAxisLabels,
        };
    }, [data, width, height, padding]);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (points.length === 0) return;
        
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;

        const ctm = svg.getScreenCTM();
        if (!ctm) return; // Guard against null CTM
        
        const svgPoint = pt.matrixTransform(ctm.inverse());
        const mouseX = svgPoint.x;
        
        const closestPoint = points.reduce((prev, curr) => 
            Math.abs(curr.x - mouseX) < Math.abs(prev.x - mouseX) ? curr : prev
        );

        const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

        const content = `
            <div class="font-bold text-sm mb-1">Ano ${closestPoint.year}</div>
            <div class="text-xs space-y-1 w-48">
                <div class="flex justify-between items-center"><span>${principalLabel}:</span><span class="font-semibold text-blue-300 ml-2">${formatCurrency(closestPoint.aportes)}</span></div>
                <div class="flex justify-between items-center"><span>${growthLabel}:</span><span class="font-semibold text-teal-300 ml-2">${formatCurrency(closestPoint.growth)}</span></div>
                <div class="border-t border-gray-600 my-1"></div>
                <div class="flex justify-between items-center"><span>Patrimônio Total:</span><span class="font-bold text-base ml-2">${formatCurrency(closestPoint.total)}</span></div>
            </div>
        `;

        const svgRect = svg.getBoundingClientRect();
        const relativeX = e.clientX - svgRect.left;
        const relativeY = e.clientY - svgRect.top;

        setTooltip({
            content,
            x: relativeX,
            y: relativeY
        });
    };

    return (
        <div className="relative w-full h-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
                {/* Y Axis */}
                {yAxisLabels.map(label => (
                    <g key={label.y}>
                        <line x1={padding.left - 5} y1={label.y} x2={width - padding.right} y2={label.y} stroke="#374151" strokeDasharray="2" />
                        <text x={padding.left - 10} y={label.y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{label.label}</text>
                    </g>
                ))}
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#4b5563" />

                {/* X Axis */}
                {xAxisLabels.map((label, i) => (
                    i % Math.max(1, Math.floor(data.length / 6)) === 0 && <text key={label.x} x={label.x} y={height - padding.bottom + 15} textAnchor="middle" fontSize="10" fill="#9ca3af">{label.label}</text>
                ))}
                <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#4b5563" />

                {/* Areas */}
                <path d={areaPathTotal} fill="#0d9488" fillOpacity="0.3" />
                <path d={areaPathAportes} fill="#2563eb" fillOpacity="0.4" />

                {/* Hover circles */}
                {points.map(p => <circle key={p.x} cx={p.x} cy={p.y} r="3" fill="#f0fdfa" className="pointer-events-none" />)}
            </svg>
            {tooltip && (
                <div
                    className="absolute bg-gray-900 bg-opacity-90 backdrop-blur-sm text-white text-xs rounded-lg shadow-lg py-2 px-4 pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{ left: tooltip.x, top: tooltip.y - 15 }}
                    dangerouslySetInnerHTML={{ __html: tooltip.content }}
                />
            )}
            <div className="flex justify-center items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 opacity-70"></div> {principalLabel}</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-500 opacity-70"></div> {growthLabel}</div>
            </div>
        </div>
    );
};