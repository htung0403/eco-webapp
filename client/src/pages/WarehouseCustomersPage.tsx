import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WarehouseCustomerList from './warehouse/customers/WarehouseCustomerList';

export default function WarehouseCustomersPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <button
        type="button"
        onClick={() => navigate('/warehouse')}
        className="flex h-10 w-fit items-center gap-2 rounded-lg border border-border px-3 text-[13px] font-bold text-muted-foreground hover:bg-muted"
      >
        <ArrowLeft size={15} />
        Quay lại module Kho
      </button>
      <WarehouseCustomerList manageable />
    </div>
  );
}
