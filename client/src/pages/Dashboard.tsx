import React, { useState } from 'react';
import { BarChart3, Building2, Calculator, PackageSearch, Search, Truck, Warehouse } from 'lucide-react';
import { clsx } from 'clsx';
import { ActionCard } from '../components/ui/ActionCard';

const dashboardModules = [
  {
    icon: Warehouse,
    title: 'Quản lý kho & bưu cục',
    description: 'Tồn kho, nhập đơn, tiếp nhận, manifest và đóng xếp hàng.',
    href: '/warehouse',
    colorScheme: 'blue' as const,
  },
  {
    icon: PackageSearch,
    title: 'Quản lý giao hàng',
    description: 'Phân tuyến, bàn giao tài xế, COD và giao hàng chặng cuối.',
    href: '/delivery',
    colorScheme: 'emerald' as const,
  },
  {
    icon: Truck,
    title: 'Quản lý xe vận tải',
    description: 'Chuyến xe, chi phí, đội xe nội bộ và chấm điểm tài xế.',
    href: '/trips',
    colorScheme: 'teal' as const,
  },
  {
    icon: Search,
    title: 'Tìm kiếm chuyên sâu',
    description: 'Tra cứu tổng hợp vận đơn, chuyến xe và dữ liệu liên quan.',
    href: '/search',
    colorScheme: 'purple' as const,
  },
  {
    icon: Calculator,
    title: 'Tài chính kế toán',
    description: 'Đối soát COD, duyệt chi phí và tiền mặt bưu cục.',
    href: '/finance',
    colorScheme: 'amber' as const,
  },
  {
    icon: BarChart3,
    title: 'Dashboard BGĐ',
    description: 'KPI toàn công ty, quá hạn SLA và báo cáo doanh thu.',
    href: '/dashboard',
    colorScheme: 'orange' as const,
  },
  {
    icon: Building2,
    title: 'Dùng chung',
    description: 'Bưu cục, xe & tài xế, NCC, in phiếu và hồ sơ cá nhân.',
    href: '/admin',
    colorScheme: 'blue' as const,
  },
];

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chuc-nang' | 'danh-dau' | 'tat-ca'>('chuc-nang');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Chào buổi tối, <span className="text-primary">Lê Minh Công</span> 👋
        </h1>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-1 flex items-center gap-1 mb-6 w-fit">
        {[
          { key: 'chuc-nang', label: 'Chức năng' },
          { key: 'danh-dau', label: 'Đánh dấu' },
          { key: 'tat-ca', label: 'Tất cả' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={clsx(
              'px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200',
              activeTab === tab.key
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'danh-dau' ? (
        <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-2xl border border-border">
          Chưa có module nào được đánh dấu.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {dashboardModules.map((module) => (
            <ActionCard key={module.href} {...module} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

