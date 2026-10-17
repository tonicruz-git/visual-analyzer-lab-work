import { parseCSV } from '../utils/csvParser';
import { Dataset, ChartConfig } from '../types/data';

const SAAS_SALES_CSV = `Date,Region,Product,Segment,Revenue,Cost,Profit,UnitsSold,DiscountPct,CustomerCSAT
2024-01-15,North America,Enterprise Cloud,Enterprise,45200,18500,26700,12,5,4.8
2024-01-18,Europe,Pro Suite,Mid-Market,24300,11200,13100,28,10,4.6
2024-01-22,Asia Pacific,Enterprise Cloud,Enterprise,51800,21000,30800,14,0,4.9
2024-01-28,North America,Starter Pack,SMB,8900,3200,5700,55,15,4.2
2024-02-04,Latin America,API Developer,Startup,12400,4800,7600,32,10,4.4
2024-02-10,Europe,Enterprise Cloud,Enterprise,48900,19800,29100,13,5,4.7
2024-02-14,North America,Pro Suite,Mid-Market,31200,13500,17700,34,5,4.5
2024-02-21,Asia Pacific,Starter Pack,SMB,10500,3900,6600,62,20,4.1
2024-02-27,North America,API Developer,Startup,16800,6200,10600,41,5,4.8
2024-03-03,Europe,Pro Suite,SMB,18900,8100,10800,22,10,4.3
2024-03-09,Asia Pacific,Enterprise Cloud,Enterprise,54200,22100,32100,15,0,4.9
2024-03-15,North America,Enterprise Cloud,Enterprise,49500,20100,29400,13,5,4.7
2024-03-22,Latin America,Starter Pack,SMB,7200,2800,4400,45,15,4.0
2024-03-29,Europe,API Developer,Startup,14100,5300,8800,36,5,4.6
2024-04-05,North America,Pro Suite,Mid-Market,33500,14200,19300,37,10,4.6
2024-04-12,Asia Pacific,Pro Suite,Mid-Market,28900,12600,16300,31,10,4.5
2024-04-18,North America,Starter Pack,SMB,9400,3400,6000,58,20,4.3
2024-04-24,Europe,Enterprise Cloud,Enterprise,52100,21400,30700,14,5,4.8
2024-05-02,Latin America,Enterprise Cloud,Enterprise,38400,16200,22200,10,5,4.6
2024-05-08,North America,API Developer,Startup,18200,6900,11300,44,0,4.9
2024-05-15,Europe,Pro Suite,Mid-Market,29800,12900,16900,33,10,4.4
2024-05-22,Asia Pacific,Enterprise Cloud,Enterprise,56400,23000,33400,16,0,5.0
2024-05-29,North America,Enterprise Cloud,Enterprise,53000,21500,31500,14,5,4.8
2024-06-05,North America,Starter Pack,SMB,10200,3700,6500,64,15,4.4
2024-06-12,Europe,API Developer,Startup,15600,5900,9700,39,5,4.7
2024-06-19,Asia Pacific,Pro Suite,Mid-Market,32100,13800,18300,35,5,4.6
2024-06-26,Latin America,Pro Suite,Mid-Market,21500,9700,11800,25,10,4.2
2024-07-03,North America,Enterprise Cloud,Enterprise,58200,23600,34600,16,0,4.9
2024-07-10,Europe,Enterprise Cloud,Enterprise,54800,22400,32400,15,5,4.8
2024-07-17,Asia Pacific,Starter Pack,SMB,11800,4300,7500,70,15,4.3
2024-07-24,North America,Pro Suite,Mid-Market,35600,15100,20500,39,10,4.7
2024-07-31,Latin America,API Developer,Startup,13900,5400,8500,35,5,4.5
2024-08-07,North America,API Developer,Startup,19500,7400,12100,48,0,5.0
2024-08-14,Europe,Pro Suite,SMB,22400,9500,12900,26,10,4.5
2024-08-21,Asia Pacific,Enterprise Cloud,Enterprise,61200,24800,36400,17,0,4.9
2024-08-28,North America,Starter Pack,SMB,11000,4000,7000,68,20,4.2
2024-09-04,Latin America,Enterprise Cloud,Enterprise,41200,17300,23900,11,5,4.7
2024-09-11,Europe,Enterprise Cloud,Enterprise,57600,23500,34100,16,5,4.9
2024-09-18,North America,Enterprise Cloud,Enterprise,64200,25900,38300,18,0,5.0
2024-09-25,Asia Pacific,Pro Suite,Mid-Market,34500,14700,19800,38,10,4.6
2024-10-02,Europe,Starter Pack,SMB,10800,4100,6700,65,15,4.4
2024-10-09,North America,Pro Suite,Mid-Market,37800,16000,21800,41,5,4.8
2024-10-16,Asia Pacific,API Developer,Startup,17200,6500,10700,43,5,4.7
2024-10-23,Latin America,Starter Pack,SMB,8100,3100,5000,50,20,4.1
2024-10-30,North America,Enterprise Cloud,Enterprise,67800,27200,40600,19,0,5.0
2024-11-06,Europe,Pro Suite,Mid-Market,33200,14100,19100,37,10,4.5
2024-11-13,Asia Pacific,Enterprise Cloud,Enterprise,65400,26500,38900,18,0,4.9
2024-11-20,North America,Starter Pack,SMB,12400,4500,7900,75,15,4.3
2024-11-27,Latin America,API Developer,Startup,15200,5900,9300,38,5,4.6
2024-12-04,Europe,Enterprise Cloud,Enterprise,62100,25200,36900,17,5,4.9
2024-12-11,North America,Enterprise Cloud,Enterprise,72500,28900,43600,20,0,5.0
2024-12-18,Asia Pacific,Starter Pack,SMB,13200,4800,8400,78,15,4.4
2024-12-25,Europe,API Developer,Startup,16900,6400,10500,42,5,4.8
2024-12-31,North America,Pro Suite,Mid-Market,39500,16700,22800,43,10,4.7`;

const STOCKS_CSV = `Ticker,Company,Sector,MarketCapB,PERatio,RevGrowthPct,ProfitMarginPct,DividendYieldPct,ESGScore,YTDChangePct
AAPL,Apple Inc,Technology,3250,33.4,8.1,26.3,0.52,78,21.5
MSFT,Microsoft Corp,Technology,3120,36.2,15.4,35.8,0.71,84,18.4
NVDA,NVIDIA Corp,Technology,2980,58.4,122.5,55.2,0.08,72,142.3
GOOGL,Alphabet Inc,Technology,2150,24.8,13.7,24.1,0.45,74,25.8
AMZN,Amazon.com,Consumer Discretionary,1980,44.1,11.8,7.9,0.00,68,28.2
META,Meta Platforms,Technology,1420,28.5,22.1,34.5,0.38,65,58.4
TSLA,Tesla Inc,Consumer Discretionary,780,62.3,3.5,6.2,0.00,61,-12.4
LLY,Eli Lilly,Healthcare,860,115.2,26.0,22.8,0.60,82,48.6
AVGO,Broadcom Inc,Technology,790,38.5,43.2,36.1,1.25,76,52.1
JPM,JPMorgan Chase,Financials,620,11.8,9.4,32.4,2.28,71,24.3
V,Visa Inc,Financials,570,30.2,9.8,54.7,0.76,80,12.8
UNH,UnitedHealth,Healthcare,540,21.5,14.6,6.1,1.42,75,8.2
WMT,Walmart Inc,Consumer Staples,530,31.8,6.1,2.8,1.22,70,36.5
MA,Mastercard,Financials,440,33.1,11.2,46.8,0.58,82,14.7
PG,Procter & Gamble,Consumer Staples,390,26.4,3.2,18.9,2.41,85,9.4
JNJ,Johnson & Johnson,Healthcare,380,15.8,2.3,21.6,3.08,83,-1.2
COST,Costco Wholesale,Consumer Staples,375,52.3,9.1,2.6,0.53,79,32.1
HD,Home Depot,Consumer Discretionary,365,24.1,0.6,10.2,2.45,73,9.6
BAC,Bank of America,Financials,310,13.2,5.1,27.2,2.54,77,18.9
ABBV,AbbVie Inc,Healthcare,320,16.4,4.2,23.5,3.48,72,19.2
NFLX,Netflix Inc,Communication,305,42.8,16.8,20.4,0.00,74,44.8
CRM,Salesforce Inc,Technology,280,41.2,11.0,17.4,0.51,88,14.5
ORCL,Oracle Corp,Technology,340,32.4,7.4,23.1,1.18,70,54.2
AMD,Advanced Micro,Technology,260,112.5,8.9,5.2,0.00,75,10.5
NEE,NextEra Energy,Clean Energy,160,22.8,12.4,27.6,2.65,92,26.4
ENPH,Enphase Energy,Clean Energy,16,28.4,-38.2,9.1,0.00,89,-28.5
CAT,Caterpillar Inc,Industrial,180,16.2,8.6,18.2,1.52,69,22.3
GE,GE Aerospace,Industrial,195,35.1,18.4,12.6,0.65,77,74.5`;

const CLIMATE_CITIES_CSV = `City,Country,Continent,PopulationM,AvgTempC,RainfallMM,AirQualityIndex,GreenSpacePct,RenewablePowerPct,WalkabilityScore
Tokyo,Japan,Asia,37.4,16.2,1530,34,22,24,91
New York,USA,North America,8.3,13.1,1260,42,28,32,88
London,UK,Europe,8.9,11.5,690,38,33,48,86
Paris,France,Europe,2.1,12.8,650,44,26,38,94
Singapore,Singapore,Asia,5.9,27.8,2160,28,47,15,84
Copenhagen,Denmark,Europe,0.8,9.2,610,18,42,82,96
Sydney,Australia,Oceania,5.3,18.6,1220,22,46,36,78
Berlin,Germany,Europe,3.6,10.4,570,31,41,56,89
Toronto,Canada,North America,2.8,9.8,830,32,38,45,82
Seoul,South Korea,Asia,9.7,13.2,1370,55,27,18,87
Amsterdam,Netherlands,Europe,0.9,10.6,840,24,35,42,98
Stockholm,Sweden,Europe,1.0,7.4,540,16,48,74,90
Vienna,Austria,Europe,1.9,11.4,620,21,51,68,93
Zurich,Switzerland,Europe,0.4,9.9,1080,19,45,76,92
Oslo,Norway,Europe,0.7,6.8,760,15,58,95,89
Helsinki,Finland,Europe,0.6,6.3,650,14,52,64,88
San Francisco,USA,North America,0.8,14.6,510,35,34,52,86
Madrid,Spain,Europe,3.3,15.8,440,46,35,46,85
Barcelona,Spain,Europe,1.6,16.5,600,48,24,39,90
Buenos Aires,Argentina,South America,3.1,18.2,1140,40,21,28,81
Sao Paulo,Brazil,South America,12.3,20.1,1450,62,18,72,74
Mexico City,Mexico,North America,9.2,16.9,820,78,16,22,76
Cairo,Egypt,Africa,10.1,22.4,25,124,8,12,65
Mumbai,India,Asia,12.5,27.5,2420,142,12,16,72
Bangkok,Thailand,Asia,10.5,28.6,1650,86,14,14,70
Vancouver,Canada,North America,0.7,11.1,1460,19,44,84,87
Melbourne,Australia,Oceania,5.1,15.7,650,25,39,38,82
Auckland,New Zealand,Oceania,1.6,15.2,1210,17,45,81,77
Reykjavik,Iceland,Europe,0.1,5.2,800,11,54,99,85
Dubai,UAE,Middle East,3.5,28.2,95,95,9,14,58`;

export interface SampleDefinition {
  id: string;
  name: string;
  description: string;
  csv: string;
  recommendedCharts: Omit<ChartConfig, 'id'>[];
}

export const SAMPLE_DATASETS: SampleDefinition[] = [
  {
    id: 'saas_sales',
    name: 'SaaS Revenue & Sales Performance',
    description: 'B2B subscription revenue, customer segments, profit margins, and satisfaction metrics across 4 continents.',
    csv: SAAS_SALES_CSV,
    recommendedCharts: [
      {
        title: 'Total Revenue by Region',
        subtitle: 'Regional revenue generation breakdown',
        type: 'bar',
        xAxis: 'Region',
        yAxis: 'Revenue',
        groupBy: 'Product',
        aggregation: 'sum',
        colorPalette: 'indigo',
        showGrid: true,
        showLegend: true,
        showValues: false,
        numberFormat: 'currency',
        sortOrder: 'desc',
        width: '1/2',
      },
      {
        title: 'Monthly Revenue Progression',
        subtitle: 'Chronological sales growth across product categories',
        type: 'line',
        xAxis: 'Date',
        yAxis: 'Revenue',
        groupBy: 'Product',
        aggregation: 'sum',
        colorPalette: 'blue',
        curve: 'smooth',
        showGrid: true,
        showLegend: true,
        numberFormat: 'currency',
        width: '1/2',
      },
      {
        title: 'Revenue Share by Customer Segment',
        subtitle: 'Enterprise vs Mid-Market vs SMB vs Startup',
        type: 'donut',
        xAxis: 'Segment',
        yAxis: 'Revenue',
        aggregation: 'sum',
        colorPalette: 'sunset',
        showLegend: true,
        showValues: true,
        numberFormat: 'currency',
        width: '1/3',
      },
      {
        title: 'Profit vs Revenue Distribution',
        subtitle: 'Margin efficiency across deal sizes',
        type: 'scatter',
        xAxis: 'Revenue',
        yAxis: 'Profit',
        groupBy: 'Region',
        sizeField: 'UnitsSold',
        aggregation: 'sum',
        colorPalette: 'emerald',
        showGrid: true,
        showLegend: true,
        numberFormat: 'currency',
        width: '1/3',
      },
      {
        title: 'Customer Satisfaction Score by Product',
        subtitle: 'Average CSAT on a 5-point scale',
        type: 'bar',
        xAxis: 'Product',
        yAxis: 'CustomerCSAT',
        aggregation: 'mean',
        colorPalette: 'amber',
        isHorizontal: true,
        showGrid: true,
        showValues: true,
        numberFormat: 'decimal',
        width: '1/3',
      },
    ],
  },
  {
    id: 'stocks_analysis',
    name: 'Tech & Market Stocks Valuation',
    description: 'Market cap, P/E ratio, revenue growth rate, profit margins, and ESG ratings for prominent companies.',
    csv: STOCKS_CSV,
    recommendedCharts: [
      {
        title: 'Top 10 Companies by Market Cap ($B)',
        subtitle: 'Largest market valuation leaders',
        type: 'bar',
        xAxis: 'Company',
        yAxis: 'MarketCapB',
        aggregation: 'sum',
        colorPalette: 'blue',
        showGrid: true,
        showValues: true,
        numberFormat: 'compact',
        sortOrder: 'desc',
        topN: 10,
        width: '1/2',
      },
      {
        title: 'Revenue Growth % vs Profit Margin %',
        subtitle: 'Growth efficiency quadrant with Market Cap sizing',
        type: 'scatter',
        xAxis: 'RevGrowthPct',
        yAxis: 'ProfitMarginPct',
        groupBy: 'Sector',
        sizeField: 'MarketCapB',
        aggregation: 'mean',
        colorPalette: 'purple',
        showGrid: true,
        showLegend: true,
        numberFormat: 'percent',
        width: '1/2',
      },
      {
        title: 'Market Cap Distribution by Sector',
        subtitle: 'Capital allocation across market segments',
        type: 'pie',
        xAxis: 'Sector',
        yAxis: 'MarketCapB',
        aggregation: 'sum',
        colorPalette: 'sunset',
        showLegend: true,
        showValues: true,
        numberFormat: 'compact',
        width: '1/3',
      },
      {
        title: 'ESG Sustainability Score by Sector',
        subtitle: 'Average ESG governance score (0-100)',
        type: 'bar',
        xAxis: 'Sector',
        yAxis: 'ESGScore',
        aggregation: 'mean',
        colorPalette: 'emerald',
        isHorizontal: true,
        showGrid: true,
        showValues: true,
        numberFormat: 'decimal',
        sortOrder: 'desc',
        width: '1/3',
      },
      {
        title: 'P/E Ratio Frequency Distribution',
        subtitle: 'Valuation multiple spread across all equities',
        type: 'histogram',
        xAxis: 'PERatio',
        yAxis: 'MarketCapB',
        aggregation: 'count',
        colorPalette: 'amber',
        showGrid: true,
        numberFormat: 'decimal',
        width: '1/3',
      },
    ],
  },
  {
    id: 'climate_cities',
    name: 'Global Urban Sustainability & Climate',
    description: 'City air quality index, renewable power adoption %, green space coverage, and walkability scores.',
    csv: CLIMATE_CITIES_CSV,
    recommendedCharts: [
      {
        title: 'Renewable Power % by Continent',
        subtitle: 'Average clean energy adoption in metropolitan areas',
        type: 'bar',
        xAxis: 'Continent',
        yAxis: 'RenewablePowerPct',
        aggregation: 'mean',
        colorPalette: 'emerald',
        showGrid: true,
        showValues: true,
        numberFormat: 'percent',
        sortOrder: 'desc',
        width: '1/2',
      },
      {
        title: 'Air Quality Index vs Green Space %',
        subtitle: 'Lower AQI is cleaner air; bubble size reflects Population',
        type: 'scatter',
        xAxis: 'AirQualityIndex',
        yAxis: 'GreenSpacePct',
        groupBy: 'Continent',
        sizeField: 'PopulationM',
        aggregation: 'mean',
        colorPalette: 'blue',
        showGrid: true,
        showLegend: true,
        numberFormat: 'decimal',
        width: '1/2',
      },
      {
        title: 'Top 10 Cities by Walkability Score',
        subtitle: 'Pedestrian-friendly urban centers',
        type: 'bar',
        xAxis: 'City',
        yAxis: 'WalkabilityScore',
        aggregation: 'mean',
        colorPalette: 'indigo',
        isHorizontal: true,
        showGrid: true,
        showValues: true,
        numberFormat: 'decimal',
        sortOrder: 'desc',
        topN: 10,
        width: '1/2',
      },
      {
        title: 'Cleanest Air Index by City (Lowest AQI)',
        subtitle: 'Cities with the lowest particulate exposure',
        type: 'bar',
        xAxis: 'City',
        yAxis: 'AirQualityIndex',
        aggregation: 'min',
        colorPalette: 'emerald',
        showGrid: true,
        showValues: true,
        numberFormat: 'decimal',
        sortOrder: 'asc',
        topN: 10,
        width: '1/2',
      },
    ],
  },
];

export function loadDefaultDataset(): { dataset: Dataset; charts: ChartConfig[] } {
  const sample = SAMPLE_DATASETS[0];
  const dataset = parseCSV(sample.csv, sample.name, 'sample');
  const charts: ChartConfig[] = sample.recommendedCharts.map((rc, idx) => ({
    ...rc,
    id: 'chart_' + Date.now() + '_' + idx,
  }));
  return { dataset, charts };
}
