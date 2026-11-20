// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane
/** Showcase tool plugins and hash routing. */

import { mountCardGrid, mountCardStack } from "./samples/index.js";
import { demoThemeManager } from "./theme.js";

export type DemoToolContext = {
  host: HTMLElement;
  viewport: HTMLElement;
  optionsPanel: HTMLElement | null;
  artboardState?: unknown;
};

export type DemoToolPlugin = {
  id: string;
  label: string;
  description: string;
  usesOptionsPanel?: boolean;
  mount: (ctx: DemoToolContext) => Promise<void>;
  captureArtboardState?: (ctx: DemoToolContext) => unknown;
};

export type DemoToolGroup = {
  id: string;
  label: string;
  toolIds: readonly string[];
};

export type DemoToolRoute = {
  groupId: string;
  itemId: string;
};

export const cardGridTool: DemoToolPlugin = {
  id: "card-grid",
  label: "Grid",
  description: "3×2 lattice via cube canvas library.",
  async mount({ host }) {
    mountCardGrid(host, demoThemeManager().getTheme().colors);
  },
};

export const cardStackTool: DemoToolPlugin = {
  id: "card-stack",
  label: "Stack",
  description: "Three stacks on the middle row (3, 7, and 14 cards).",
  async mount({ host }) {
    mountCardStack(host, demoThemeManager().getTheme().colors);
  },
};

export const ALL_DEMO_TOOLS: readonly DemoToolPlugin[] = [cardGridTool, cardStackTool];

export const DEMO_TOOL_GROUPS = [
  {
    id: "showcase",
    label: "Showcase",
    toolIds: ["card-grid", "card-stack"],
  },
] as const;

const TOOL_BY_ID = new Map<string, DemoToolPlugin>(
  ALL_DEMO_TOOLS.map((tool) => [tool.id, tool]),
);

function toolsForGroup(group: DemoToolGroup): DemoToolPlugin[] {
  return group.toolIds.map((id) => {
    const tool = TOOL_BY_ID.get(id);
    if (!tool) {
      throw new Error(`Unknown demo tool id: ${id}`);
    }
    return tool;
  });
}

export type ToolbarAppGroup = {
  id: string;
  label: string;
  tools: readonly DemoToolPlugin[];
};

export const TOOLBAR_APP_GROUPS: readonly ToolbarAppGroup[] = DEMO_TOOL_GROUPS.map((group) => ({
  id: group.id,
  label: group.label,
  tools: toolsForGroup(group),
}));

export function findToolRoute(route: DemoToolRoute): DemoToolPlugin | undefined {
  const group = TOOLBAR_APP_GROUPS.find((entry) => entry.id === route.groupId);
  return group?.tools.find((tool) => tool.id === route.itemId);
}

export function defaultToolRoute(): DemoToolRoute {
  const group = TOOLBAR_APP_GROUPS[0];
  const tool = group?.tools[0];
  return { groupId: group?.id ?? "showcase", itemId: tool?.id ?? "card-grid" };
}

function groupForToolId(toolId: string): ToolbarAppGroup | undefined {
  return TOOLBAR_APP_GROUPS.find((group) => group.tools.some((tool) => tool.id === toolId));
}

export function toolRouteForToolId(toolId: string): DemoToolRoute | null {
  const group = groupForToolId(toolId);
  if (!group) {
    return null;
  }
  return { groupId: group.id, itemId: toolId };
}

export function parseToolRouteHash(raw: string): DemoToolRoute | null {
  const hash = raw.replace(/^#/, "").trim().split("&view=")[0]?.trim() ?? "";
  if (!hash) {
    return null;
  }
  const slash = hash.indexOf("/");
  if (slash >= 0) {
    const groupId = hash.slice(0, slash);
    const itemId = hash.slice(slash + 1);
    const group = TOOLBAR_APP_GROUPS.find((entry) => entry.id === groupId);
    const tool = group?.tools.find((entry) => entry.id === itemId);
    if (group && tool) {
      return { groupId, itemId };
    }
    return null;
  }
  const group = groupForToolId(hash);
  if (!group) {
    return null;
  }
  return { groupId: group.id, itemId: hash };
}

export function toolRouteHash(route: DemoToolRoute): string {
  return `#${route.groupId}/${route.itemId}`;
}
