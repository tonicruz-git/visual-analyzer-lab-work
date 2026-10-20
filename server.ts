import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client with recommended aistudio-build telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API route for Chat with Analyzer
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, datasetMeta, sampleRows, activeFilters, currentCharts } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const latestMessage = messages[messages.length - 1].content;
    const datasetName = datasetMeta?.name || 'Uploaded Dataset';
    const rowCount = datasetMeta?.rowCount ?? 0;
    const inViewCount = datasetMeta?.filteredRowCount ?? rowCount;
    const columns = datasetMeta?.columns || [];

    // Filter conversation history to user/assistant turns excluding greeting
    const rawHistory = messages.slice(0, messages.length - 1);
    const validHistory = rawHistory.filter(
      (m: any) => m.id !== 'welcome' && !m.content?.startsWith('Hello! I am **Analyzer**')
    );

    // Build rigorous dynamic system prompt strictly bound to the uploaded dataset
    const columnSummary = columns
      .map(
        (c: any) =>
          `- ${c.name} (${c.type}): ${c.uniqueCount} distinct values${
            c.type === 'number'
              ? `, min=${c.min ?? 'N/A'}, max=${c.max ?? 'N/A'}, avg=${c.avg !== undefined ? Math.round(c.avg * 100) / 100 : 'N/A'}, sum=${c.sum !== undefined ? Math.round(c.sum * 100) / 100 : 'N/A'}`
              : `, samples: [${(c.distinctValues || c.sampleValues || []).slice(0, 6).join(', ')}]`
          }`
      )
      .join('\n');

    const systemPrompt = `You are Analyzer, an expert data scientist and quantitative analyst embedded in Visual Analyzer.

CRITICAL INSTRUCTION - STRICT DYNAMIC DATASET SCOPE:
- You are analyzing SOLELY AND EXCLUSIVELY the active dataset provided by the user: "${datasetName}".
- NEVER refer to, assume, or hallucinate context, entities, or column names from any previous datasets (such as SaaS Sales, Stock Market, HR, or other preloaded samples).
- All numbers, statistics, column references, and insights MUST stem strictly from this active dataset.
- Available columns in "${datasetName}":
${columnSummary || '(No columns detected)'}

- Dataset Metrics:
  * Total Rows: ${rowCount}
  * Rows currently in scope/filtered: ${inViewCount}
  * Active Filters: ${JSON.stringify(activeFilters || {})}
  * Current Dashboard Charts: ${JSON.stringify(currentCharts || [])}
  * Sample Records (first ${sampleRows?.length || 0} rows):
${JSON.stringify(sampleRows || [], null, 2)}

ANALYTICAL GUIDELINES:
1. Ground your answers in the actual columns, values, and calculations of "${datasetName}".
2. Structure your insights clearly with Markdown headers, bullet points, and **bold metric callouts**.
3. If the user asks for insights, trends, or outliers, calculate and cite actual numbers (minimums, maximums, averages, or counts) from the schema and sample rows.
4. If recommending a visualization, you MUST choose columns that exist in "${datasetName}". Output the recommendation inside a \`chart_suggestion\` code fence:
\`\`\`chart_suggestion
{
  "title": "Concise Chart Title",
  "subtitle": "Subtitle describing the insight",
  "type": "bar" | "line" | "area" | "scatter" | "pie" | "donut" | "histogram" | "kpi" | "heatmap" | "radar",
  "xAxis": "ExactColumnNameFromDataset",
  "yAxis": "ExactNumericColumnNameFromDataset",
  "groupBy": "OptionalExactColumnName",
  "aggregation": "sum" | "mean" | "count" | "min" | "max",
  "colorPalette": "indigo" | "emerald" | "blue" | "amber" | "sunset" | "purple"
}
\`\`\`
The application parses this block and offers the user a 1-click button to immediately add it to their dashboard.

5. Be concise, precise, mathematically sound, and directly focused on "${datasetName}".`;

    // Prioritized list of high-performance models to guarantee resilient responses
    const CANDIDATE_MODELS = [
      'gemini-3.5-flash',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
    ];

    // Attempt Gemini call with model failover
    if (process.env.GEMINI_API_KEY) {
      const contents: any[] = [];
      for (const msg of validHistory) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: latestMessage }],
      });

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.4,
            },
          });

          const replyText = response.text;
          if (replyText && replyText.trim().length > 0) {
            res.json({ reply: replyText });
            return;
          }
        } catch (geminiErr: any) {
          console.warn(`Model ${modelName} unavailable (${geminiErr?.status || geminiErr?.message}), trying next model...`);
        }
      }
    }

    // Query-aware dynamic statistical analysis engine
    // Parses user's question, identifies target columns and intent, and computes real math from the data
    const queryLower = latestMessage.toLowerCase();
    const numCols = columns.filter((c: any) => c.type === 'number');
    const catCols = columns.filter((c: any) => c.type === 'string' || c.type === 'boolean');
    const dateCols = columns.filter((c: any) => c.type === 'date');

    // Identify explicitly or implicitly referenced columns
    const matchedNumCols = numCols.filter((c: any) =>
      queryLower.includes(c.name.toLowerCase())
    );
    const matchedCatCols = catCols.filter((c: any) =>
      queryLower.includes(c.name.toLowerCase())
    );

    const targetNum = matchedNumCols[0] || numCols[0];
    const secondaryNum = matchedNumCols[1] || numCols[1] || targetNum;
    const targetCat = matchedCatCols[0] || catCols[0];

    // Intent detection
    const isTopQuery = /(highest|top|max|peak|leader|most|greatest|best)/i.test(queryLower);
    const isBottomQuery = /(lowest|bottom|min|worst|least|smallest)/i.test(queryLower);
    const isAvgQuery = /(average|mean|typical)/i.test(queryLower);
    const isSumQuery = /(total|sum|overall|aggregate)/i.test(queryLower);
    const isOutlierQuery = /(outlier|anomaly|deviat|unusual|abnormal)/i.test(queryLower);
    const isCompareQuery = /(compare|versus|vs|breakdown|by|distribution|group)/i.test(queryLower);
    const isCorrelationQuery = /(correlat|relationship|depend|impact|affect)/i.test(queryLower);
    const isChartQuery = /(chart|graph|plot|visualiz|recommend)/i.test(queryLower);

    let reply = `### Analysis: ${latestMessage.trim()}\n\n`;
    reply += `*Dataset:* **${datasetName}** (${inViewCount.toLocaleString()} rows in view)\n\n`;

    if (isTopQuery && targetNum && sampleRows.length > 0) {
      // Find top records
      const sorted = [...sampleRows]
        .filter((r: any) => r[targetNum.name] !== undefined && r[targetNum.name] !== null)
        .sort((a: any, b: any) => Number(b[targetNum.name]) - Number(a[targetNum.name]));

      const topItem = sorted[0];
      const topVal = topItem ? Number(topItem[targetNum.name]).toLocaleString() : 'N/A';
      const labelCol = targetCat?.name;
      const topLabel = labelCol && topItem ? topItem[labelCol] : 'Top Entry';

      reply += `#### Highest Recorded **${targetNum.name}**\n`;
      reply += `- **Peak Value:** **${topVal}** (${labelCol ? `${labelCol}: ${topLabel}` : ''})\n`;
      reply += `- **Dataset Maximum:** ${targetNum.max !== undefined ? targetNum.max.toLocaleString() : 'N/A'}\n`;
      reply += `- **Dataset Average:** ${targetNum.avg !== undefined ? Math.round(targetNum.avg * 100) / 100 : 'N/A'}\n\n`;

      if (sorted.length > 1) {
        reply += `**Top Rankings:**\n`;
        sorted.slice(0, 5).forEach((r: any, idx: number) => {
          const l = labelCol ? r[labelCol] : `Row ${idx + 1}`;
          const val = Number(r[targetNum.name]).toLocaleString();
          reply += `${idx + 1}. **${l}**: ${val}\n`;
        });
        reply += `\n`;
      }

      if (targetCat) {
        reply += `\`\`\`chart_suggestion
{
  "title": "Top ${targetNum.name} by ${targetCat.name}",
  "subtitle": "Ranked highest to lowest",
  "type": "bar",
  "xAxis": "${targetCat.name}",
  "yAxis": "${targetNum.name}",
  "aggregation": "sum",
  "colorPalette": "indigo"
}
\`\`\``;
      }
    } else if (isBottomQuery && targetNum && sampleRows.length > 0) {
      // Find bottom records
      const sorted = [...sampleRows]
        .filter((r: any) => r[targetNum.name] !== undefined && r[targetNum.name] !== null)
        .sort((a: any, b: any) => Number(a[targetNum.name]) - Number(b[targetNum.name]));

      const bottomItem = sorted[0];
      const bottomVal = bottomItem ? Number(bottomItem[targetNum.name]).toLocaleString() : 'N/A';
      const labelCol = targetCat?.name;
      const bottomLabel = labelCol && bottomItem ? bottomItem[labelCol] : 'Lowest Entry';

      reply += `#### Lowest Recorded **${targetNum.name}**\n`;
      reply += `- **Lowest Value:** **${bottomVal}** (${labelCol ? `${labelCol}: ${bottomLabel}` : ''})\n`;
      reply += `- **Dataset Minimum:** ${targetNum.min !== undefined ? targetNum.min.toLocaleString() : 'N/A'}\n`;
      reply += `- **Dataset Average:** ${targetNum.avg !== undefined ? Math.round(targetNum.avg * 100) / 100 : 'N/A'}\n\n`;

      if (sorted.length > 1) {
        reply += `**Lowest Rankings:**\n`;
        sorted.slice(0, 5).forEach((r: any, idx: number) => {
          const l = labelCol ? r[labelCol] : `Row ${idx + 1}`;
          const val = Number(r[targetNum.name]).toLocaleString();
          reply += `${idx + 1}. **${l}**: ${val}\n`;
        });
        reply += `\n`;
      }
    } else if (isAvgQuery && targetNum) {
      reply += `#### Statistical Summary for \`${targetNum.name}\`:\n`;
      reply += `- **Calculated Average (Mean):** **${targetNum.avg !== undefined ? Math.round(targetNum.avg * 100) / 100 : 'N/A'}**\n`;
      reply += `- **Median:** ${targetNum.median !== undefined ? targetNum.median : 'N/A'}\n`;
      reply += `- **Spread:** Minimum of ${targetNum.min ?? 'N/A'} to Maximum of ${targetNum.max ?? 'N/A'}\n`;
      reply += `- **Total Sum:** ${targetNum.sum !== undefined ? targetNum.sum.toLocaleString() : 'N/A'}\n\n`;

      if (secondaryNum && secondaryNum.name !== targetNum.name) {
        reply += `#### For \`${secondaryNum.name}\`:\n`;
        reply += `- **Average:** ${secondaryNum.avg !== undefined ? Math.round(secondaryNum.avg * 100) / 100 : 'N/A'}\n`;
        reply += `- **Range:** ${secondaryNum.min ?? 'N/A'} to ${secondaryNum.max ?? 'N/A'}\n\n`;
      }
    } else if (isCorrelationQuery && targetNum && secondaryNum && secondaryNum.name !== targetNum.name && sampleRows.length > 2) {
      // Calculate Pearson correlation coefficient
      const xVals = sampleRows.map((r: any) => Number(r[targetNum.name]) || 0);
      const yVals = sampleRows.map((r: any) => Number(r[secondaryNum.name]) || 0);
      const n = xVals.length;
      const xMean = xVals.reduce((a: number, b: number) => a + b, 0) / n;
      const yMean = yVals.reduce((a: number, b: number) => a + b, 0) / n;

      let num = 0;
      let denX = 0;
      let denY = 0;
      for (let i = 0; i < n; i++) {
        const dx = xVals[i] - xMean;
        const dy = yVals[i] - yMean;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      }
      const r = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;
      const roundedR = Math.round(r * 100) / 100;

      let strength = 'Weak or negligible correlation';
      if (Math.abs(r) > 0.7) strength = r > 0 ? 'Strong positive correlation' : 'Strong negative correlation';
      else if (Math.abs(r) > 0.3) strength = r > 0 ? 'Moderate positive correlation' : 'Moderate negative correlation';

      reply += `#### Correlation between \`${targetNum.name}\` and \`${secondaryNum.name}\`:\n`;
      reply += `- **Pearson Correlation Coefficient (r):** **${roundedR}**\n`;
      reply += `- **Interpretation:** **${strength}** across ${n} sampled records.\n\n`;

      reply += `\`\`\`chart_suggestion
{
  "title": "${targetNum.name} vs ${secondaryNum.name}",
  "subtitle": "Correlation r = ${roundedR}",
  "type": "scatter",
  "xAxis": "${targetNum.name}",
  "yAxis": "${secondaryNum.name}",
  "aggregation": "mean",
  "colorPalette": "blue"
}
\`\`\``;
    } else if (targetCat && targetNum && sampleRows.length > 0) {
      // Breakdown by category
      const groups: Record<string, { sum: number; count: number }> = {};
      sampleRows.forEach((r: any) => {
        const cat = String(r[targetCat.name] ?? 'Unknown');
        const num = Number(r[targetNum.name]) || 0;
        if (!groups[cat]) groups[cat] = { sum: 0, count: 0 };
        groups[cat].sum += num;
        groups[cat].count += 1;
      });

      const sortedGroups = Object.entries(groups).sort((a, b) => b[1].sum - a[1].sum);
      const totalSum = sortedGroups.reduce((acc, curr) => acc + curr[1].sum, 0);

      reply += `#### Breakdown of \`${targetNum.name}\` across \`${targetCat.name}\`:\n\n`;
      reply += `| ${targetCat.name} | Total ${targetNum.name} | Average | Share |\n`;
      reply += `| :--- | :--- | :--- | :--- |\n`;
      sortedGroups.slice(0, 6).forEach(([cat, data]) => {
        const share = totalSum > 0 ? Math.round((data.sum / totalSum) * 1000) / 10 : 0;
        const avg = Math.round((data.sum / data.count) * 100) / 100;
        reply += `| **${cat}** | ${data.sum.toLocaleString()} | ${avg.toLocaleString()} | ${share}% |\n`;
      });
      reply += `\n`;

      reply += `\`\`\`chart_suggestion
{
  "title": "${targetNum.name} by ${targetCat.name}",
  "subtitle": "Aggregated breakdown",
  "type": "bar",
  "xAxis": "${targetCat.name}",
  "yAxis": "${targetNum.name}",
  "aggregation": "sum",
  "colorPalette": "emerald"
}
\`\`\``;
    } else {
      // General overview
      reply += `#### Overview of Key Dimensions:\n`;
      if (targetNum) {
        reply += `- **Primary Metric (${targetNum.name}):** Avg ${targetNum.avg !== undefined ? Math.round(targetNum.avg * 100) / 100 : 'N/A'}, Min ${targetNum.min ?? 'N/A'}, Max ${targetNum.max ?? 'N/A'}\n`;
      }
      if (targetCat) {
        const samples = (targetCat.distinctValues || targetCat.sampleValues || []).slice(0, 5);
        reply += `- **Key Dimension (${targetCat.name}):** ${targetCat.uniqueCount} distinct values [${samples.join(', ')}]\n`;
      }
      reply += `\nTry asking specific questions such as:\n`;
      if (targetNum && targetCat) {
        reply += `- *"Which ${targetCat.name} has the highest ${targetNum.name}?"*\n`;
        reply += `- *"Compare ${targetNum.name} by ${targetCat.name}"*\n`;
      }
      if (numCols.length >= 2) {
        reply += `- *"Is there a correlation between ${numCols[0].name} and ${numCols[1].name}?"*\n`;
      }
    }

    res.json({ reply });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to process dataset query.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
