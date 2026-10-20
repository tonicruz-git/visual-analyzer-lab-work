import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Dataset, FilterState, ChartConfig } from '../types/data';
import {
  Sparkles,
  X,
  Send,
  Plus,
  RotateCcw,
  Copy,
  Check,
  Search,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Columns2,
  Rows3,
  BarChart3,
  Database,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  chartSuggestion?: Partial<ChartConfig>;
}

export interface AnalyzerChatProps {
  dataset: Dataset;
  filteredRows: Record<string, any>[];
  filterState: FilterState;
  charts: ChartConfig[];
  onAddSuggestedChart: (chart: ChartConfig) => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  layoutMode?: 'sidebar' | 'inline';
  onToggleLayoutMode?: () => void;
}

const createWelcomeMessage = (dataset: Dataset, inViewCount: number): ChatMessage => {
  const numCols = dataset.columns.filter((c) => c.type === 'number').map((c) => c.name);
  const catCols = dataset.columns.filter((c) => c.type === 'string' || c.type === 'boolean').map((c) => c.name);
  const dateCols = dataset.columns.filter((c) => c.type === 'date').map((c) => c.name);

  let schemaDetails = '';
  if (numCols.length > 0) schemaDetails += `\n• **Numeric Metrics:** ${numCols.slice(0, 5).join(', ')}${numCols.length > 5 ? ` (+${numCols.length - 5} more)` : ''}`;
  if (catCols.length > 0) schemaDetails += `\n• **Categorical Dimensions:** ${catCols.slice(0, 5).join(', ')}${catCols.length > 5 ? ` (+${catCols.length - 5} more)` : ''}`;
  if (dateCols.length > 0) schemaDetails += `\n• **Time / Dates:** ${dateCols.join(', ')}`;

  const rowSummary = inViewCount === dataset.rowCount
    ? `${dataset.rowCount.toLocaleString()} records`
    : `${inViewCount.toLocaleString()} in view (${dataset.rowCount.toLocaleString()} total records)`;

  return {
    id: 'welcome_' + dataset.id,
    role: 'assistant',
    content: `**Context Scope Initialized:** Active analysis workspace for **${dataset.name}** (${rowSummary}, ${dataset.columns.length} columns).${schemaDetails ? `\n\n**Schema Breakdown:**${schemaDetails}` : ''}

You can ask quantitative questions, request segment comparisons, investigate outliers, or ask for recommended charts to place on this dashboard.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

export const AnalyzerChat: React.FC<AnalyzerChatProps> = ({
  dataset,
  filteredRows,
  filterState,
  charts,
  onAddSuggestedChart,
  isOpen = true,
  onClose,
  className,
  layoutMode = 'sidebar',
  onToggleLayoutMode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage(dataset, filteredRows.length),
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedChartIds, setAppliedChartIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevDatasetIdRef = useRef(dataset.id);

  // Synchronize when active dataset changes
  useEffect(() => {
    if (prevDatasetIdRef.current !== dataset.id) {
      prevDatasetIdRef.current = dataset.id;
      setMessages([createWelcomeMessage(dataset, filteredRows.length)]);
      setAppliedChartIds(new Set());
      setInput('');
    }
  }, [dataset.id, dataset.name, dataset.rowCount, filteredRows.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Dynamically tailor suggested prompt questions to the actual uploaded CSV schema
  const suggestedPrompts = useMemo(() => {
    const numCols = dataset.columns.filter((c) => c.type === 'number');
    const catCols = dataset.columns.filter((c) => c.type === 'string' || c.type === 'boolean');
    const dateCols = dataset.columns.filter((c) => c.type === 'date');

    const prompts: string[] = [];

    if (numCols[0] && catCols[0]) {
      prompts.push(`Compare ${numCols[0].name} across ${catCols[0].name}`);
    }
    if (numCols[0]) {
      prompts.push(`Statistical outliers in ${numCols[0].name}`);
    }
    if (numCols.length >= 2) {
      prompts.push(`Correlation between ${numCols[0].name} & ${numCols[1].name}`);
    } else if (dateCols[0] && numCols[0]) {
      prompts.push(`Trend of ${numCols[0].name} over ${dateCols[0].name}`);
    }
    prompts.push(`Recommend best visualization for ${dataset.name}`);

    return prompts.slice(0, 4);
  }, [dataset]);

  // Parse chart suggestions from assistant text
  const extractChartSuggestion = (text: string): { cleanText: string; chart?: Partial<ChartConfig> } => {
    const regex = /```chart_suggestion\s*([\s\S]*?)\s*```/;
    const match = text.match(regex);
    if (!match) return { cleanText: text };

    try {
      const parsed = JSON.parse(match[1]);
      const cleanText = text.replace(regex, '').trim();
      return { cleanText, chart: parsed };
    } catch {
      return { cleanText: text };
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Build metadata payload strictly using current active dataset
      const datasetMeta = {
        id: dataset.id,
        name: dataset.name,
        rowCount: dataset.rowCount,
        filteredRowCount: filteredRows.length,
        source: dataset.source,
        columns: dataset.columns.map((c) => ({
          name: c.name,
          type: c.type,
          uniqueCount: c.uniqueCount,
          nullCount: c.nullCount,
          min: c.min,
          max: c.max,
          avg: c.avg,
          median: c.median,
          sum: c.sum,
          distinctValues: c.distinctValues.slice(0, 20),
          sampleValues: c.sampleValues.slice(0, 6),
        })),
      };

      const activeDataRows = filteredRows.length > 0 ? filteredRows : dataset.rows;
      const sampleRows = activeDataRows.length <= 100 ? activeDataRows : activeDataRows.slice(0, 60);
      const currentCharts = charts.map((c) => ({
        title: c.title,
        type: c.type,
        xAxis: c.xAxis,
        yAxis: c.yAxis,
        groupBy: c.groupBy,
        aggregation: c.aggregation,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ id: m.id, role: m.role, content: m.content })),
          datasetMeta,
          sampleRows,
          activeFilters: filterState,
          currentCharts,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const rawReply = data.reply || 'No response generated.';
      const { cleanText, chart } = extractChartSuggestion(rawReply);

      const assistantMsg: ChatMessage = {
        id: 'asst_' + Date.now(),
        role: 'assistant',
        content: cleanText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chartSuggestion: chart,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: `**Analysis Notice:** ${err.message || 'Unable to connect to Analyzer.'}\n\nPlease verify that your server is running or ask a more specific question about **${dataset.name}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyChart = (msgId: string, suggestion: Partial<ChartConfig>) => {
    const colNames = dataset.columns.map((c) => c.name);
    const validX = colNames.includes(suggestion.xAxis || '')
      ? suggestion.xAxis!
      : dataset.columns[0]?.name || '';
    const validY = colNames.includes(suggestion.yAxis || '')
      ? suggestion.yAxis!
      : dataset.columns.find((c) => c.type === 'number')?.name || validX;

    const fullChart: ChartConfig = {
      id: 'chart_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: suggestion.title || `${validY} by ${validX}`,
      subtitle: suggestion.subtitle || `Generated for ${dataset.name}`,
      type: (suggestion.type as any) || 'bar',
      xAxis: validX,
      yAxis: validY,
      groupBy: suggestion.groupBy && colNames.includes(suggestion.groupBy) ? suggestion.groupBy : undefined,
      aggregation: suggestion.aggregation || 'sum',
      colorPalette: suggestion.colorPalette || 'indigo',
      width: '1/2',
      ...suggestion,
    };

    onAddSuggestedChart(fullChart);
    setAppliedChartIds((prev) => new Set([...prev, msgId]));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isOpen === false) return null;

  const isInline = layoutMode === 'inline';

  return (
    <section
      aria-label="Dataset Intelligence & Query"
      className={`bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden transition-all ${
        isInline
          ? 'w-full mb-6 max-h-[680px]'
          : 'w-full h-[calc(100vh-8.5rem)] min-h-[560px] max-h-[820px]'
      } ${className || ''}`}
    >
      {/* Header: Styled exactly like ChartContainer for seamless dashboard unity */}
      <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Dataset Intelligence & Query
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-medium text-slate-700 truncate max-w-[140px] sm:max-w-[200px]" title={dataset.name}>
                {dataset.name}
              </span>
              <span>·</span>
              <span>{filteredRows.length.toLocaleString()} rows in view</span>
            </div>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-1 shrink-0">
          {onToggleLayoutMode && (
            <button
              onClick={onToggleLayoutMode}
              title={isInline ? 'Dock as side workbench' : 'Expand as full-width dashboard section'}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              {isInline ? (
                <Columns2 className="w-4 h-4" />
              ) : (
                <Rows3 className="w-4 h-4" />
              )}
            </button>
          )}

          <button
            onClick={() => setMessages([createWelcomeMessage(dataset, filteredRows.length)])}
            title="Reset conversation context for active dataset"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Collapse intelligence panel"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Natural Language Query Bar: Top placement for immediate dashboard affordance */}
      <div className="p-3 bg-slate-50/70 border-b border-slate-100 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask anything about ${dataset.name}... (e.g., correlations, outliers, distributions)`}
              disabled={isLoading}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-indigo-600 focus:border-indigo-600 transition-colors shadow-2xs"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-3.5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer text-xs font-medium flex items-center gap-1.5 shrink-0"
            title={`Analyze query for ${dataset.name}`}
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>

        {/* Dynamic Schema-Driven Prompt Suggestions */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <span className="text-[11px] font-medium text-slate-400 shrink-0">Suggested:</span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50/60 border border-slate-200/90 hover:border-indigo-200 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span>{prompt}</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Feed & Findings Log */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          if (isUser) {
            return (
              <div
                key={msg.id}
                className="bg-indigo-50/50 rounded-lg p-3.5 border border-indigo-100/80 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] text-indigo-700/80 mb-1">
                  <span className="font-semibold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <Search className="w-3 h-3 text-indigo-600" />
                    Query
                  </span>
                  <span className="text-slate-400 font-normal">{msg.timestamp}</span>
                </div>
                <p className="text-xs font-medium text-slate-900 leading-relaxed">
                  {msg.content}
                </p>
              </div>
            );
          }

          // Assistant Executive Findings Record
          return (
            <div
              key={msg.id}
              className="bg-white rounded-lg p-4 border border-slate-200/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Executive Findings</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span>{msg.timestamp}</span>
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                    title="Copy analysis summary"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Formatted body paragraphs */}
              <div className="space-y-2 text-xs text-slate-700 leading-relaxed font-sans">
                {msg.content.split('\n\n').map((paragraph, pIdx) => (
                  <p key={pIdx}>
                    {paragraph.split('**').map((chunk, cIdx) =>
                      cIdx % 2 === 1 ? (
                        <strong key={cIdx} className="font-semibold text-slate-900">
                          {chunk}
                        </strong>
                      ) : (
                        chunk
                      )
                    )}
                  </p>
                ))}
              </div>

              {/* Suggested Chart Preview Tile */}
              {msg.chartSuggestion && (
                <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/80 -mx-1 px-3 py-3 rounded-lg border border-slate-200/80">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-slate-900 text-xs font-semibold">
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Suggested Visualization: {msg.chartSuggestion.title}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200/60 font-semibold">
                      {msg.chartSuggestion.type}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3">
                    {msg.chartSuggestion.subtitle ||
                      `Visualizes ${msg.chartSuggestion.yAxis} grouped by ${msg.chartSuggestion.xAxis} (${msg.chartSuggestion.aggregation || 'sum'})`}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApplyChart(msg.id, msg.chartSuggestion!)}
                      disabled={appliedChartIds.has(msg.id)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full ${
                        appliedChartIds.has(msg.id)
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                      }`}
                    >
                      {appliedChartIds.has(msg.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Placed on Dashboard</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Dashboard Visualizations</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading State: Clean analytical indicator */}
        {isLoading && (
          <div className="bg-white rounded-lg p-3.5 border border-slate-200/80 text-xs text-slate-600 flex items-center gap-2.5 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
            <span className="font-medium text-slate-700">
              Synthesizing data insights for {dataset.name}...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </section>
  );
};
