<div align="center">
  <h1>Visual Analyzer</h1>
  <p>An interactive, multi-dimensional data visualization dashboard</p>
</div>

---

Visual Analyzer is built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Vite**. It allows users to ingest custom CSV data, explore real-time cross-filtering, inspect column metrics, and dynamically configure custom analytical charts.

---

## Key Features

- **Universal CSV Ingestion**: Upload custom `.csv` files, paste raw CSV text, or select from curated sample datasets (SaaS Sales, Equities, Climate & Urban Sustainability).
- **Auto Schema & Type Inference**: Automatically cleans data, detects primitive column types (`string`, `number`, `boolean`, `date`), and computes key column statistics (min, max, average, median, sample distribution, null counts).
- **Rich Visualization Types**: 
  - Bar & Stacked/Horizontal Bar Charts
  - Smooth Line & Area Progression Charts
  - Pie & Donut Distribution Charts
  - Scatter & Bubble Plots with custom sizing
  - Frequency Histograms
  - Pearson Correlation Matrix Heatmaps
  - KPI Metric Summary Cards with Sparklines
  - Radar / Spider Performance Charts
- **Interactive Dashboard & Cross-Filtering**: Click chart slices, bars, or scatter points to cross-filter the dataset across the entire dashboard in real time.
- **Global Filter Bar**: Real-time full-text search, categorical multi-select filters, and range sliders for numeric fields.
- **Interactive Data Grid**: Inspect raw tabular rows, sort by columns, paginate through dataset records, and export filtered data back to CSV.
- **Gemini API Ready**: Pre-configured with `@google/genai` for server-side AI-assisted analytics and natural language insights.

---

## Tech Stack

- **Framework**: React 19, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **Data Parsing & Motion**: PapaParse, Motion (Framer Motion)
- **AI Integration**: `@google/genai`

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **Package Manager**: `npm` or `bun`

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/visual-analyzer.git
   cd visual-analyzer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Provide your Gemini API key in `.env.local`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Vite development server on port 3000 |
| `npm run build` | Builds the project for production in `dist/` |
| `npm run preview` | Locally previews the production build |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Removes the `dist/` directory |

---

## Project Structure

```text
.
├── src/
│   ├── components/        # React UI components
│   │   ├── charts/        # Custom SVG visualizers (Bar, Line, Scatter, Donut, etc.)
│   │   ├── AddChartModal.tsx
│   │   ├── ChartCustomizer.tsx
│   │   ├── CsvUploadModal.tsx
│   │   ├── DataTable.tsx
│   │   ├── FilterBar.tsx
│   │   ├── Header.tsx
│   │   └── MetricSummaryStrip.tsx
│   ├── data/              # Curated datasets (SaaS Sales, Stocks, Climate)
│   ├── types/             # TypeScript type definitions (`Dataset`, `ChartConfig`, etc.)
│   ├── utils/             # Math compute, CSV parsing, formatting, & filtering engine
│   ├── App.tsx            # App root layout and global state router
│   └── main.tsx           # Entry point
├── .env.example           # Environment template
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## License

This project is licensed under the **Apache License 2.0**.

### Key Characteristics:
- **Permissive Use**: Free to use, modify, distribute, and sublicense for commercial or open-source projects.
- **Patent Rights**: Includes an explicit grant of patent rights from contributors to users.
- **Conditions**: You must retain original copyright notices, disclaimers, and a copy of the license in any distributions.