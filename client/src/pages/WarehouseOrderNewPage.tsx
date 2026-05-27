import React, { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertTriangle, ArrowLeft, Banknote, Box, CreditCard, Loader2, MapPin, PackagePlus, Phone, Ruler, Scale, ShieldAlert, StickyNote, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

import { SearchableSelect } from '../components/ui/SearchableSelect';
import { ApiError, apiRequest } from '../lib/api';
import CreateWaybillSuccessDialog from './warehouse/orders/dialogs/CreateWaybillSuccessDialog';
import type { BadgeConfig, CreatedWaybill, HubSummary, PaymentType, UserSummary } from './warehouse/orders/types';

const USER_PROFILE_KEY = 'eco_user_profile';
const CREATE_ROLES = 1 | 32 | 64;
const phonePattern = /^(0[3|5|7|8|9])+([0-9]{8})$/;

type ContactForm = {
  name: string;
  phone: string;
  address: string;
};

type CreateWaybillFormState = {
  sender: ContactForm;
  receiver: ContactForm;
  originHubId: string;
  destHubId: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  paymentType: PaymentType | '';
  costAmount: string;
  codNote: string;
};

type CreateWaybillPayload = {
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  origin_hub_id: string;
  dest_hub_id: string;
  weight: number;
  freight_amount?: number;
  cod_amount?: number;
  note?: string;
};

const initialFormState: CreateWaybillFormState = {
  sender: { name: '', phone: '', address: '' },
  receiver: { name: '', phone: '', address: '' },
  originHubId: '',
  destHubId: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  paymentType: 'PP',
  costAmount: '',
  codNote: '',
};

const statusConfig: Record<string, BadgeConfig> = {
  RECEIVED: { label: 'Đã tạo đơn', className: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const paymentConfig: Record<string, BadgeConfig> = {
  PP: { label: 'PP · Người gửi trả', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  CC: { label: 'CC · Người nhận trả', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  COD: { label: 'COD', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const getStoredUser = (): UserSummary | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as UserSummary; } catch { return null; }
};

const extractList = <T,>(payload: T[] | { data?: T[]; items?: T[]; hubs?: T[] }): T[] => Array.isArray(payload) ? payload : payload.data || payload.items || payload.hubs || [];
const normalizeId = (value: unknown) => value === null || value === undefined ? '' : String(value);
const normalizeActive = (hub: HubSummary) => hub.is_active === undefined && !hub.status ? true : hub.is_active === true || hub.is_active === 'true' || hub.is_active === 1 || String(hub.status || '').toUpperCase() === 'ACTIVE';
const formatHub = (hub: HubSummary) => [hub.code?.toUpperCase(), hub.name].filter(Boolean).join(' · ') || `Hub #${hub.id}`;
const hasCreateRole = (roleMask: number) => (roleMask & CREATE_ROLES) !== 0;
const toPositiveNumber = (value: string) => Number(value);
const formatNumber = (value: number) => Number.isFinite(value) ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '0';
const getTodayCodePart = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const buildWaybillCode = (datePart: string, sequence: number) => `ECO${datePart}-${String(sequence).padStart(3, '0')}`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12px] font-semibold text-red-500">{message}</p>;
}

function FormInput({ label, icon: Icon, required, error, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: React.ElementType; required?: boolean; error?: string }) {
  return (
    <label className={clsx('block', className)}>
      <span className="text-[13px] font-bold text-foreground">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="relative mt-1.5">
        <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input {...props} className={clsx('h-10 w-full rounded-lg border border-border bg-muted/10 px-3 pl-9 text-[13px] font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10', error && 'border-red-300 focus:border-red-400')} />
      </div>
      <FieldError message={error} />
    </label>
  );
}

function FormTextarea({ label, icon: Icon, error, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; icon: React.ElementType; error?: string }) {
  return (
    <label className={clsx('block', className)}>
      <span className="text-[13px] font-bold text-foreground">{label}</span>
      <div className="relative mt-1.5">
        <Icon size={15} className="absolute left-3 top-3 text-muted-foreground" />
        <textarea {...props} className={clsx('min-h-24 w-full rounded-lg border border-border bg-muted/10 px-3 py-2 pl-9 text-[13px] font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10', error && 'border-red-300 focus:border-red-400')} />
      </div>
      <FieldError message={error} />
    </label>
  );
}

export default function WarehouseOrderNewPage() {
  const navigate = useNavigate();
  const [user] = useState<UserSummary | null>(() => getStoredUser());
  const [hubs, setHubs] = useState<HubSummary[]>([]);
  const [isLoadingHubs, setIsLoadingHubs] = useState(true);
  const [hubError, setHubError] = useState('');
  const [formState, setFormState] = useState<CreateWaybillFormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdWaybill, setCreatedWaybill] = useState<CreatedWaybill | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isSuccessClosing, setIsSuccessClosing] = useState(false);

  const canCreate = hasCreateRole(user?.role_mask ?? 0);
  const hubOptions = useMemo(() => hubs.filter(normalizeActive).map(hub => ({ value: normalizeId(hub.id), label: formatHub(hub) })), [hubs]);
  const volumeCm3 = useMemo(() => {
    const length = toPositiveNumber(formState.length);
    const width = toPositiveNumber(formState.width);
    const height = toPositiveNumber(formState.height);
    if (length <= 0 || width <= 0 || height <= 0) return 0;
    return length * width * height;
  }, [formState.length, formState.width, formState.height]);
  const volumetricWeight = volumeCm3 / 5000;

  useEffect(() => {
    const loadHubs = async () => {
      setIsLoadingHubs(true);
      setHubError('');
      try {
        const response = await apiRequest<HubSummary[] | { data?: HubSummary[]; items?: HubSummary[]; hubs?: HubSummary[] }>('/hubs/active');
        setHubs(extractList(response).filter(normalizeActive));
      } catch (error) {
        setHubError(error instanceof ApiError ? error.message : 'Không thể tải danh sách bưu cục đang hoạt động.');
      } finally {
        setIsLoadingHubs(false);
      }
    };
    void loadHubs();
  }, []);

  const setField = <K extends keyof CreateWaybillFormState>(key: K, value: CreateWaybillFormState[K]) => {
    setFormState(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({ ...prev, [String(key)]: '' }));
    setSubmitError('');
  };

  const setContactField = (type: 'sender' | 'receiver', key: keyof ContactForm, value: string) => {
    setFormState(prev => ({ ...prev, [type]: { ...prev[type], [key]: value } }));
    setFieldErrors(prev => ({ ...prev, [`${type}.${key}`]: '' }));
    setSubmitError('');
  };


  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formState.sender.name.trim()) errors['sender.name'] = 'Tên người gửi là bắt buộc.';
    if (!formState.sender.address.trim()) errors['sender.address'] = 'Địa chỉ người gửi là bắt buộc.';
    if (!phonePattern.test(formState.sender.phone.trim())) errors['sender.phone'] = 'Số điện thoại người gửi không đúng định dạng VN.';
    if (!formState.receiver.name.trim()) errors['receiver.name'] = 'Tên người nhận là bắt buộc.';
    if (!formState.receiver.address.trim()) errors['receiver.address'] = 'Địa chỉ người nhận là bắt buộc.';
    if (!phonePattern.test(formState.receiver.phone.trim())) errors['receiver.phone'] = 'Số điện thoại người nhận không đúng định dạng VN.';
    if (!formState.originHubId) errors.originHubId = 'Vui lòng chọn hub đi.';
    if (!formState.destHubId) errors.destHubId = 'Vui lòng chọn hub đến.';
    if (formState.originHubId && formState.destHubId && formState.originHubId === formState.destHubId) errors.destHubId = 'Hub đi và đến không được trùng';
    if (toPositiveNumber(formState.weight) <= 0) errors.weight = 'Cân nặng phải lớn hơn 0.';
    if (toPositiveNumber(formState.length) <= 0) errors.length = 'Chiều dài phải lớn hơn 0.';
    if (toPositiveNumber(formState.width) <= 0) errors.width = 'Chiều rộng phải lớn hơn 0.';
    if (toPositiveNumber(formState.height) <= 0) errors.height = 'Chiều cao phải lớn hơn 0.';
    if (!formState.paymentType) errors.paymentType = 'Vui lòng chọn loại thanh toán.';
    if (Number(formState.costAmount) < 0 || !Number.isFinite(Number(formState.costAmount))) errors.costAmount = 'Cước phí phải lớn hơn hoặc bằng 0.';
    if (formState.paymentType === 'COD' && Number(formState.costAmount) <= 0) errors.costAmount = 'COD bắt buộc nhập cước phí lớn hơn 0.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (): CreateWaybillPayload => ({
    sender_name: formState.sender.name.trim(),
    sender_phone: formState.sender.phone.trim(),
    sender_address: formState.sender.address.trim(),
    receiver_name: formState.receiver.name.trim(),
    receiver_phone: formState.receiver.phone.trim(),
    receiver_address: formState.receiver.address.trim(),
    origin_hub_id: formState.originHubId,
    dest_hub_id: formState.destHubId,
    weight: Number(formState.weight),
    freight_amount: formState.paymentType === 'COD' ? 0 : Number(formState.costAmount),
    cod_amount: formState.paymentType === 'COD' ? Number(formState.costAmount) : undefined,
    note: [
      `dimensions_cm=${formState.length}x${formState.width}x${formState.height}`,
      `volumetric_weight=${formatNumber(volumetricWeight)}`,
      formState.paymentType === 'COD' && formState.codNote.trim() ? `COD: ${formState.codNote.trim()}` : '',
    ].filter(Boolean).join(' | '),
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canCreate || !validate()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await apiRequest<CreatedWaybill>('/waybills', { method: 'POST', body: buildPayload() });
      setCreatedWaybill({ ...response, current_state: response.current_state || 'RECEIVED', payment_type: response.payment_type || formState.paymentType });
      setIsSuccessOpen(true);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Không thể tạo vận đơn mới.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccess = () => {
    setIsSuccessClosing(true);
    window.setTimeout(() => { setIsSuccessOpen(false); setIsSuccessClosing(false); }, 250);
  };

  const resetForAnother = () => {
    setFormState(initialFormState);
    setFieldErrors({});
    setSubmitError('');
    setCreatedWaybill(null);
    setIsSuccessOpen(false);
  };

  const createdId = createdWaybill?.id || createdWaybill?.waybill_code || createdWaybill?.code;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => navigate('/warehouse/inventory')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/10 text-muted-foreground hover:bg-muted md:w-auto md:px-3">
              <ArrowLeft size={15} />
              <span className="ml-2 hidden text-[13px] font-medium md:inline">Quay lại</span>
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black text-foreground">Nhập đơn mới</h1>
              <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">Tạo vận đơn RECEIVED theo schema waybills.</p>
            </div>
          </div>
          <button type="submit" disabled={!canCreate || isSubmitting || isLoadingHubs} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2 text-[13px] font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <PackagePlus size={16} />}
            Tạo vận đơn
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-5">
          {!canCreate && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-[13px] font-semibold text-red-600"><ShieldAlert className="mr-2 inline" size={16} />Tài khoản cần quyền WAREHOUSE, MANAGER hoặc DIRECTOR để tạo vận đơn.</div>}
          {hubError && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] font-semibold text-amber-700"><AlertTriangle className="mr-2 inline" size={16} />{hubError}</div>}
          {submitError && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-[13px] font-semibold text-red-600"><AlertTriangle className="mr-2 inline" size={16} />{submitError}</div>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-[13px] font-bold text-foreground">Mã vận đơn</span>
              <div className="relative mt-1.5">
                <PackagePlus size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input readOnly value={buildWaybillCode(getTodayCodePart(), 1)} className="h-10 w-full cursor-not-allowed rounded-lg border border-border bg-muted/10 px-3 pl-9 text-[13px] font-medium text-muted-foreground outline-none" />
              </div>
            </label>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-4 flex items-center gap-2"><UserRound size={16} className="text-primary" /><h2 className="text-[13px] font-black uppercase tracking-wider text-primary">Người gửi</h2></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput label="Tên" icon={UserRound} required value={formState.sender.name} onChange={event => setContactField('sender', 'name', event.target.value)} error={fieldErrors['sender.name']} />
                <FormInput label="Số điện thoại" icon={Phone} required value={formState.sender.phone} onChange={event => setContactField('sender', 'phone', event.target.value)} error={fieldErrors['sender.phone']} placeholder="0901234567" />
                <FormTextarea label="Địa chỉ" icon={MapPin} value={formState.sender.address} onChange={event => setContactField('sender', 'address', event.target.value)} error={fieldErrors['sender.address']} className="md:col-span-2" />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-4 flex items-center gap-2"><UserRound size={16} className="text-primary" /><h2 className="text-[13px] font-black uppercase tracking-wider text-primary">Người nhận</h2></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput label="Tên" icon={UserRound} required value={formState.receiver.name} onChange={event => setContactField('receiver', 'name', event.target.value)} error={fieldErrors['receiver.name']} />
                <FormInput label="Số điện thoại" icon={Phone} required value={formState.receiver.phone} onChange={event => setContactField('receiver', 'phone', event.target.value)} error={fieldErrors['receiver.phone']} placeholder="0912345678" />
                <FormTextarea label="Địa chỉ" icon={MapPin} value={formState.receiver.address} onChange={event => setContactField('receiver', 'address', event.target.value)} error={fieldErrors['receiver.address']} className="md:col-span-2" />
              </div>
            </div>

            <label className="block">
              <span className="text-[13px] font-bold text-foreground">Hub đi <span className="text-red-500">*</span></span>
              <SearchableSelect options={hubOptions} value={formState.originHubId} onValueChange={value => setField('originHubId', value)} placeholder={isLoadingHubs ? 'Đang tải hub...' : 'Chọn hub đi'} disabled={isLoadingHubs} className={clsx('mt-1.5 h-10 rounded-lg', fieldErrors.originHubId && 'border-red-300')} />
              <FieldError message={fieldErrors.originHubId} />
            </label>

            <label className="block">
              <span className="text-[13px] font-bold text-foreground">Hub đến <span className="text-red-500">*</span></span>
              <SearchableSelect options={hubOptions} value={formState.destHubId} onValueChange={value => setField('destHubId', value)} placeholder={isLoadingHubs ? 'Đang tải hub...' : 'Chọn hub đến'} disabled={isLoadingHubs} className={clsx('mt-1.5 h-10 rounded-lg', fieldErrors.destHubId && 'border-red-300')} />
              <FieldError message={fieldErrors.destHubId} />
            </label>

            <FormInput label="Cân nặng (kg)" icon={Scale} required type="number" min="0" step="0.01" value={formState.weight} onChange={event => setField('weight', event.target.value)} error={fieldErrors.weight} />
            <FormInput label="Chiều dài (cm)" icon={Ruler} required type="number" min="0" step="0.1" value={formState.length} onChange={event => setField('length', event.target.value)} error={fieldErrors.length} />
            <FormInput label="Chiều rộng (cm)" icon={Ruler} required type="number" min="0" step="0.1" value={formState.width} onChange={event => setField('width', event.target.value)} error={fieldErrors.width} />
            <FormInput label="Chiều cao (cm)" icon={Box} required type="number" min="0" step="0.1" value={formState.height} onChange={event => setField('height', event.target.value)} error={fieldErrors.height} />

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-[13px] font-bold text-blue-700">Thể tích tự động</p>
              <p className="mt-1 text-xl font-black text-blue-800">{formatNumber(volumeCm3)} cm³</p>
              <p className="mt-1 text-[12px] font-medium text-blue-700/80">length × width × height</p>
            </div>

            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <span className="text-[13px] font-bold text-foreground">Loại thanh toán <span className="text-red-500">*</span></span>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {(['PP', 'CC', 'COD'] as PaymentType[]).map(type => (
                  <button key={type} type="button" onClick={() => setField('paymentType', type)} className={clsx('rounded-lg border px-3 py-2 text-left transition-all', formState.paymentType === type ? 'border-primary bg-blue-50 text-primary ring-2 ring-primary/10' : 'border-border bg-white text-foreground hover:bg-muted')}>
                    <span className="text-[13px] font-black">{type}</span>
                    <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{type === 'PP' ? 'Người gửi trả' : type === 'CC' ? 'Người nhận trả' : 'Thu hộ'}</p>
                  </button>
                ))}
              </div>
              <FieldError message={fieldErrors.paymentType} />
            </div>

            <FormInput label="Cước phí" icon={Banknote} required type="number" min="0" step="1000" value={formState.costAmount} onChange={event => setField('costAmount', event.target.value)} error={fieldErrors.costAmount} />

            {formState.paymentType === 'COD' && <FormTextarea label="Ghi chú COD" icon={StickyNote} value={formState.codNote} onChange={event => setField('codNote', event.target.value)} className="md:col-span-2" />}

            <div className="md:col-span-2 rounded-lg border border-border bg-muted/10 px-4 py-3 text-[13px] font-medium text-muted-foreground">
              <CreditCard className="mr-2 inline text-primary" size={15} />PP/CC gửi cước qua `freight_amount`. COD gửi số tiền qua `cod_amount`. Kích thước được lưu vào ghi chú do DTO hiện tại chưa nhận field riêng.
            </div>
          </div>
        </div>
      </form>

      <CreateWaybillSuccessDialog isOpen={isSuccessOpen} isClosing={isSuccessClosing} waybill={createdWaybill} statusConfig={statusConfig} paymentConfig={paymentConfig} onClose={closeSuccess} onCreateAnother={resetForAnother} onReceive={() => createdId && navigate(`/warehouse/orders/${createdId}/receive`)} onPrint={() => createdId && navigate(`/print/waybill/${createdId}`)} />
    </div>
  );
}





