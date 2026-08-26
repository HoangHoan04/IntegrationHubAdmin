export interface RouteConfig {
  key: string;
  label: string;
  path: string;
  icon?: string;
  isShow?: boolean;
  permission?: string;
  children?: Record<string, RouteConfig>;
}

export interface SidebarMenuItem {
  key: string;
  label: string;
  path: string;
  icon?: string;
  isShow?: boolean;
  permission?: string;
  children?: SidebarMenuItem[];
}

export const ROUTES_CONFIG = {
  DASHBOARD: {
    key: 'DASHBOARD',
    label: 'Dashboard Tổng quan',
    path: '/dashboard',
    icon: 'dashboard',
  },

  INTEGRATION_CONFIG: {
    key: 'INTEGRATION_CONFIG',
    label: 'Cấu hình Tích hợp',
    path: '/integration-config/mappings',
    icon: 'api',
    children: {
      MAPPINGS: {
        key: 'MAPPINGS',
        label: 'Event Mappings',
        path: '/integration-config/mappings',
        icon: 'fork',
      },
      CREDENTIALS: {
        key: 'CREDENTIALS',
        label: 'Cấu hình Xác thực',
        path: '/integration-config/credentials',
        icon: 'key',
      },
      ADAPTERS: {
        key: 'ADAPTERS',
        label: 'Danh sách Adapters',
        path: '/integration-config/adapters',
        icon: 'appstore',
      },
    },
  },

  LOGS_GROUP: {
    key: 'LOGS_GROUP',
    label: 'Nhật ký Giao dịch',
    path: '/logs/sync-logs',
    icon: 'file-text',
    children: {
      SYNC_LOGS: {
        key: 'SYNC_LOGS',
        label: 'Lịch sử Đồng bộ',
        path: '/logs/sync-logs',
        icon: 'history',
      },
      WEBHOOK_LOGS: {
        key: 'WEBHOOK_LOGS',
        label: 'Nhật ký Webhooks',
        path: '/logs/webhooks',
        icon: 'cloud-download',
      },
    },
  },

  TOOLS_GROUP: {
    key: 'TOOLS_GROUP',
    label: 'Công cụ & Thử nghiệm',
    path: '/playground',
    icon: 'tool',
    children: {
      PLAYGROUND: {
        key: 'PLAYGROUND',
        label: 'Test Playground',
        path: '/playground',
        icon: 'experiment',
      },
    },
  },
} as const satisfies Record<string, RouteConfig>;

export function getRouteByPath(path: string): RouteConfig | undefined {
  const routes = ROUTES_CONFIG as unknown as Record<string, RouteConfig>;
  let bestMatch: RouteConfig | undefined = undefined;

  const traverse = (routeList: Record<string, RouteConfig>) => {
    for (const key of Object.keys(routeList)) {
      const r = routeList[key];
      if (r.path === path) {
        bestMatch = r;
        return;
      }
      if (r.children) {
        traverse(r.children);
      }
    }
  };

  traverse(routes);
  return bestMatch;
}

export function convertRoutesToMenuItems(
  config: Record<string, RouteConfig>,
): SidebarMenuItem[] {
  const items: SidebarMenuItem[] = [];

  for (const key of Object.keys(config)) {
    const route = config[key];
    if (route.isShow === false) continue;

    const item: SidebarMenuItem = {
      key: route.key,
      label: route.label,
      path: route.path,
      icon: route.icon,
      permission: route.permission,
    };

    if (route.children) {
      item.children = convertRoutesToMenuItems(route.children);
    }

    items.push(item);
  }

  return items;
}

export function filterMenuByPermission(
  items: SidebarMenuItem[],
  hasPermission: (permission?: string) => boolean,
): SidebarMenuItem[] {
  return items
    .filter((item) => hasPermission(item.permission))
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: filterMenuByPermission(item.children, hasPermission),
        };
      }
      return item;
    });
}

export function getFirstNavigableRoute(route: RouteConfig): RouteConfig | undefined {
  if (!route.children) return route;
  const children = Object.values(route.children);
  if (children.length === 0) return route;
  return children[0];
}
