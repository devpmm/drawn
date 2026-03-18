// Shared constants

// Design tokens
export const BRAND_COLOR = '#FFA033';
export const BORDER_COLOR = '#e0ddd8';
export const PAGE_BG = '#f9f7f4';
export const SURFACE_BG = '#fff';
export const BANNER_BG = '#eeecea';
export const TEXT_PRIMARY = '#1a1a1a';
export const TEXT_SECONDARY = '#888';
export const TEXT_MUTED = '#aaa';
export const FONT_STACK = "var(--font-rubik), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// Chart type options
// Must match CHART_TYPE_NAMES in lib/prompts.js
export const CHART_TYPES = {
  auto: 'Auto',
  flowchart: 'Flowchart',
  mindmap: 'Mind Map',
  orgchart: 'Org Chart',
  sequence: 'Sequence Diagram',
  class: 'UML Class Diagram',
  er: 'ER Diagram',
  gantt: 'Gantt Chart',
  timeline: 'Timeline',
  tree: 'Tree Diagram',
  network: 'Network Topology',
  architecture: 'Architecture Diagram',
  dataflow: 'Data Flow Diagram',
  state: 'State Diagram',
  swimlane: 'Swim Lane',
  concept: 'Concept Map',
  fishbone: 'Fishbone Diagram',
  swot: 'SWOT Analysis',
  pyramid: 'Pyramid Chart',
  funnel: 'Funnel Chart',
  venn: 'Venn Diagram',
  matrix: 'Matrix Chart',
  infographic: 'Infographic'
};
