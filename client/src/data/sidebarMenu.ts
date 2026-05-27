import {
  BarChart3,
  Building2,
  Calculator,
  Home,
  PackageSearch,
  Search,
  Truck,
  Warehouse,
} from 'lucide-react';
import React from 'react';

export type SidebarItem = {
  id: string;
  icon: React.ElementType;
  label: string;
  path: string;
  requiredRoleMask?: number;
  children?: SidebarItem[];
};

export const sidebarMenu: SidebarItem[] = [
  { id: 'home', icon: Home, label: 'Trang chủ', path: '/' },
  { id: 'warehouse', icon: Warehouse, label: 'Quản lý kho', path: '/warehouse', requiredRoleMask: 1 | 2 },
  { id: 'delivery', icon: PackageSearch, label: 'Quản lý giao hàng', path: '/delivery', requiredRoleMask: 4 | 8 },
  { id: 'trips', icon: Truck, label: 'Quản lý xe', path: '/trips', requiredRoleMask: 8 },
  { id: 'search', icon: Search, label: 'Tìm kiếm', path: '/search' },
  { id: 'finance', icon: Calculator, label: 'Tài chính', path: '/finance', requiredRoleMask: 16 },
  { id: 'dashboard', icon: BarChart3, label: 'Dashboard BGĐ', path: '/dashboard', requiredRoleMask: 32 | 64 },
  { id: 'admin', icon: Building2, label: 'Quản trị', path: '/admin', requiredRoleMask: 64 },
];

export const getVisibleMenu = (roleMask: number): SidebarItem[] =>
  sidebarMenu.filter((item) => !item.requiredRoleMask || (roleMask & item.requiredRoleMask) !== 0);

export const extraMenuItems: SidebarItem[] = [];
