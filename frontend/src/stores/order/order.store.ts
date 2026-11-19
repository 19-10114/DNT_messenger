import { create } from 'zustand';

export interface SelectedBike {
  id: string;
  plate: string;
  color: string;
  serialNumber: string;
  motorSerial?: string;
  inNumber?: string;
  outNumber?: string;
  productName: string;
  brand: string;
  quantity: number;
  price: number;
}

export interface SelectedPart {
  id: string;
  sku: string;
  name: string;
  model: string;
  price: number;
  quantity: number;
  availableQuantity: number;
}

export interface SelectedOtherProduct {
  id: string;
  sku: string;
  name: string;
  model: string;
  brand?: string;
  price: number;
  quantity: number;
  availableQuantity: number;
}

export interface PaymentMethod {
  id: string;
  type:
    | 'pago_movil'
    | 'efectivo_usd'
    | 'efectivo_bs'
    | 'zelle'
    | 'binance'
    | 'transferencia'
    | 'abono';
  amount: number;
  amount_bs?: number;
  currency: 'USD' | 'BS';
  reference?: string;
  description?: string;
  origin_bank?: string;
  target_bank?: string;
  origin_account?: string;
  target_account?: string;
  phone_number?: string;
}

export interface OrderPayment {
  productId: string;
  productType: 'bike' | 'part' | 'other';
  productName: string;
  totalAmount: number;
  paymentMethods: PaymentMethod[];
  remainingAmount: number;
}

export interface OrderDetails {
  invoice_number: string;
  type: 'purchase' | 'sale';
  notes: string;
  origin_branch: number;
  target_branch: number;
  total_invoice_bs: number;
  total_invoice_usd?: number;
  total_billed_usd?: number;
  rate?: number;
  client?: number;
  client_country_id?: string;
  client_name?: string;
  dom_reserve?: string;
  dom_number?: string;
  insurance_company?: string;
  insurance_number?: string;
  insurance_expiration?: string;
  observations?: string;
  seller?: string;
  sellerName?: string;
  status?: string;
}

export interface OrderTotalPayment {
  totalAmount: number;
  paymentMethods: PaymentMethod[];
  remainingAmount: number;
}

interface State {
  selectedBikes: SelectedBike[];
  selectedParts: SelectedPart[];
  selectedOthers: SelectedOtherProduct[];
  orderPayments: OrderPayment[];
  orderTotalPayment: OrderTotalPayment | null;
  orderDetails: OrderDetails | null;
  currentStep: 'selection' | 'payment' | 'confirmation';
  authorizeZeroPrice: boolean;
  paymentMode: 'per_product' | 'total_order';
  isDeliveryNote: boolean;
  deliveryNoteAmount: number;
  deliveryNoteNumber: string;
}

interface Actions {
  setSelectedBikes: (bikes: SelectedBike[]) => void;
  setSelectedParts: (parts: SelectedPart[]) => void;
  setSelectedOthers: (others: SelectedOtherProduct[]) => void;
  addSelectedBike: (bike: SelectedBike) => void;
  addSelectedPart: (part: SelectedPart) => void;
  addSelectedOther: (other: SelectedOtherProduct) => void;
  removeSelectedBike: (bikeId: string) => void;
  removeSelectedPart: (partId: string) => void;
  removeSelectedOther: (otherId: string) => void;
  updateBikePrice: (bikeId: string, price: number) => void;
  updateBikeOutNumber: (bikeId: string, outNumber: string) => void;
  updatePartPrice: (partId: string, price: number) => void;
  updatePartQuantity: (partId: string, quantity: number) => void;
  updateOtherPrice: (otherId: string, price: number) => void;
  updateOtherQuantity: (otherId: string, quantity: number) => void;
  clearSelectedBikes: () => void;
  clearSelectedParts: () => void;
  clearSelectedOthers: () => void;
  initializeOrderPayments: () => void;
  addPaymentMethod: (productId: string, paymentMethod: PaymentMethod) => void;
  removePaymentMethod: (productId: string, paymentMethodId: string) => void;
  updatePaymentMethod: (
    productId: string,
    paymentMethodId: string,
    updates: Partial<PaymentMethod>
  ) => void;
  setOrderDetails: (details: OrderDetails) => void;
  updateOrderDetails: (updates: Partial<OrderDetails>) => void;
  setPaymentMode: (mode: 'per_product' | 'total_order') => void;
  initializeOrderTotalPayment: () => void;
  addTotalPaymentMethod: (paymentMethod: PaymentMethod) => void;
  removeTotalPaymentMethod: (paymentMethodId: string) => void;
  updateTotalPaymentMethod: (
    paymentMethodId: string,
    updates: Partial<PaymentMethod>
  ) => void;
  setCurrentStep: (step: 'selection' | 'payment' | 'confirmation') => void;
  setAuthorizeZeroPrice: (authorize: boolean) => void;
  setIsDeliveryNote: (isDeliveryNote: boolean) => void;
  setDeliveryNoteAmount: (amount: number) => void;
  setDeliveryNoteNumber: (number: string) => void;
  clearOrder: () => void;
  getTotalAmount: () => number;
  hasZeroPriceItems: () => boolean;
  canProcessOrder: () => boolean;
}

export const useOrderStore = create<State & Actions>((set, get) => ({
  selectedBikes: [],
  selectedParts: [],
  selectedOthers: [],
  orderPayments: [],
  orderTotalPayment: null,
  orderDetails: null,
  currentStep: 'selection',
  authorizeZeroPrice: false,
  paymentMode: 'total_order',
  isDeliveryNote: false,
  deliveryNoteAmount: 0,
  deliveryNoteNumber: '',

  setSelectedBikes: (bikes) => set(() => ({ selectedBikes: bikes })),
  setSelectedParts: (parts) => set(() => ({ selectedParts: parts })),
  setSelectedOthers: (others) => set(() => ({ selectedOthers: others })),

  addSelectedBike: (bike) => {
    const state = get();
    if (state.selectedBikes.length > 0) {
      console.warn('Solo se puede agregar una moto por orden');
      return;
    }
    set(() => ({ selectedBikes: [bike] }));
  },

  addSelectedPart: (part) => {
    const state = get();
    const existingPart = state.selectedParts.find((p) => p.id === part.id);

    if (existingPart) {
      const updatedParts = state.selectedParts.map((p) =>
        p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p
      );
      set(() => ({ selectedParts: updatedParts }));
    } else {
      set(() => ({ selectedParts: [...state.selectedParts, part] }));
    }
  },

  addSelectedOther: (other) => {
    const state = get();
    const existingOther = state.selectedOthers.find((o) => o.id === other.id);

    if (existingOther) {
      const updatedOthers = state.selectedOthers.map((o) =>
        o.id === other.id ? { ...o, quantity: o.quantity + 1 } : o
      );
      set(() => ({ selectedOthers: updatedOthers }));
    } else {
      set(() => ({ selectedOthers: [...state.selectedOthers, other] }));
    }
  },

  removeSelectedBike: (bikeId) => {
    const state = get();
    set(() => ({
      selectedBikes: state.selectedBikes.filter((bike) => bike.id !== bikeId),
    }));
  },

  removeSelectedPart: (partId) => {
    const state = get();
    set(() => ({
      selectedParts: state.selectedParts.filter((part) => part.id !== partId),
    }));
  },

  removeSelectedOther: (otherId) => {
    const state = get();
    set(() => ({
      selectedOthers: state.selectedOthers.filter(
        (other) => other.id !== otherId
      ),
    }));
  },

  updateBikePrice: (bikeId, price) => {
    const state = get();
    const updatedBikes = state.selectedBikes.map((bike) =>
      bike.id === bikeId ? { ...bike, price: Math.max(0, price) } : bike
    );
    set(() => ({ selectedBikes: updatedBikes }));
  },

  updateBikeOutNumber: (bikeId, outNumber) => {
    const state = get();
    const digitsOnly = (outNumber || '').replace(/\D/g, '');
    const updatedBikes = state.selectedBikes.map((bike) =>
      bike.id === bikeId ? { ...bike, outNumber: digitsOnly } : bike
    );
    set(() => ({ selectedBikes: updatedBikes }));
  },

  updatePartPrice: (partId, price) => {
    const state = get();
    const updatedParts = state.selectedParts.map((part) =>
      part.id === partId ? { ...part, price: Math.max(0, price) } : part
    );
    set(() => ({ selectedParts: updatedParts }));
  },

  updateOtherPrice: (otherId, price) => {
    const state = get();
    const updatedOthers = state.selectedOthers.map((other) =>
      other.id === otherId ? { ...other, price: Math.max(0, price) } : other
    );
    set(() => ({ selectedOthers: updatedOthers }));
  },

  updatePartQuantity: (partId, quantity) => {
    const state = get();
    const part = state.selectedParts.find((p) => p.id === partId);

    if (!part) return;

    if (quantity <= 0) {
      get().removeSelectedPart(partId);
    } else if (quantity <= part.availableQuantity) {
      const updatedParts = state.selectedParts.map((p) =>
        p.id === partId ? { ...p, quantity } : p
      );
      set(() => ({ selectedParts: updatedParts }));
    }
  },

  updateOtherQuantity: (otherId, quantity) => {
    const state = get();
    const other = state.selectedOthers.find((o) => o.id === otherId);

    if (!other) return;

    if (quantity <= 0) {
      get().removeSelectedOther(otherId);
    } else if (quantity <= other.availableQuantity) {
      const updatedOthers = state.selectedOthers.map((o) =>
        o.id === otherId ? { ...o, quantity } : o
      );
      set(() => ({ selectedOthers: updatedOthers }));
    }
  },

  clearSelectedBikes: () => {
    set(() => ({ selectedBikes: [] }));
  },

  clearSelectedParts: () => {
    set(() => ({ selectedParts: [] }));
  },

  clearSelectedOthers: () => {
    set(() => ({ selectedOthers: [] }));
  },

  initializeOrderPayments: () => {
    const state = get();
    const payments: OrderPayment[] = [];

    state.selectedBikes.forEach((bike) => {
      payments.push({
        productId: bike.id,
        productType: 'bike',
        productName: `${bike.productName} - ${bike.brand}`,
        totalAmount: bike.price * bike.quantity,
        paymentMethods: [],
        remainingAmount: bike.price * bike.quantity,
      });
    });

    state.selectedParts.forEach((part) => {
      payments.push({
        productId: part.id,
        productType: 'part',
        productName: part.name,
        totalAmount: part.price * part.quantity,
        paymentMethods: [],
        remainingAmount: part.price * part.quantity,
      });
    });

    state.selectedOthers.forEach((other) => {
      payments.push({
        productId: other.id,
        productType: 'other',
        productName: other.name,
        totalAmount: other.price * other.quantity,
        paymentMethods: [],
        remainingAmount: other.price * other.quantity,
      });
    });

    set(() => ({ orderPayments: payments }));
  },

  addPaymentMethod: (productId, paymentMethod) => {
    const state = get();
    const updatedPayments = state.orderPayments.map((payment) => {
      if (payment.productId === productId) {
        const newPaymentMethods = [...payment.paymentMethods, paymentMethod];
        const totalPaid = newPaymentMethods.reduce(
          (sum, pm) => sum + pm.amount,
          0
        );
        return {
          ...payment,
          paymentMethods: newPaymentMethods,
          remainingAmount: Math.max(0, payment.totalAmount - totalPaid),
        };
      }
      return payment;
    });
    set(() => ({ orderPayments: updatedPayments }));
  },

  removePaymentMethod: (productId, paymentMethodId) => {
    const state = get();
    const updatedPayments = state.orderPayments.map((payment) => {
      if (payment.productId === productId) {
        const newPaymentMethods = payment.paymentMethods.filter(
          (pm) => pm.id !== paymentMethodId
        );
        const totalPaid = newPaymentMethods.reduce(
          (sum, pm) => sum + pm.amount,
          0
        );
        return {
          ...payment,
          paymentMethods: newPaymentMethods,
          remainingAmount: Math.max(0, payment.totalAmount - totalPaid),
        };
      }
      return payment;
    });
    set(() => ({ orderPayments: updatedPayments }));
  },

  updatePaymentMethod: (productId, paymentMethodId, updates) => {
    const state = get();
    const updatedPayments = state.orderPayments.map((payment) => {
      if (payment.productId === productId) {
        const newPaymentMethods = payment.paymentMethods.map((pm) =>
          pm.id === paymentMethodId ? { ...pm, ...updates } : pm
        );
        const totalPaid = newPaymentMethods.reduce(
          (sum, pm) => sum + pm.amount,
          0
        );
        return {
          ...payment,
          paymentMethods: newPaymentMethods,
          remainingAmount: Math.max(0, payment.totalAmount - totalPaid),
        };
      }
      return payment;
    });
    set(() => ({ orderPayments: updatedPayments }));
  },

  setOrderDetails: (details) => set(() => ({ orderDetails: details })),

  updateOrderDetails: (updates) => {
    const state = get();
    if (!state.orderDetails) return;
    set(() => ({
      orderDetails: { ...state.orderDetails!, ...updates },
    }));
  },

  setPaymentMode: (mode) => set(() => ({ paymentMode: mode })),

  initializeOrderTotalPayment: () => {
    const totalAmount = get().getTotalAmount();
    set(() => ({
      orderTotalPayment: {
        totalAmount,
        paymentMethods: [],
        remainingAmount: totalAmount,
      },
    }));
  },

  addTotalPaymentMethod: (paymentMethod) => {
    const state = get();
    if (!state.orderTotalPayment) return;

    const newPaymentMethods = [
      ...state.orderTotalPayment.paymentMethods,
      paymentMethod,
    ];
    const totalPaid = newPaymentMethods.reduce((sum, pm) => sum + pm.amount, 0);

    set(() => ({
      orderTotalPayment: {
        ...state.orderTotalPayment!,
        paymentMethods: newPaymentMethods,
        remainingAmount: Math.max(
          0,
          state.orderTotalPayment!.totalAmount - totalPaid
        ),
      },
    }));
  },

  removeTotalPaymentMethod: (paymentMethodId) => {
    const state = get();
    if (!state.orderTotalPayment) return;

    const newPaymentMethods = state.orderTotalPayment.paymentMethods.filter(
      (pm) => pm.id !== paymentMethodId
    );
    const totalPaid = newPaymentMethods.reduce((sum, pm) => sum + pm.amount, 0);

    set(() => ({
      orderTotalPayment: {
        ...state.orderTotalPayment!,
        paymentMethods: newPaymentMethods,
        remainingAmount: Math.max(
          0,
          state.orderTotalPayment!.totalAmount - totalPaid
        ),
      },
    }));
  },

  updateTotalPaymentMethod: (paymentMethodId, updates) => {
    const state = get();
    if (!state.orderTotalPayment) return;

    const newPaymentMethods = state.orderTotalPayment.paymentMethods.map(
      (pm) => (pm.id === paymentMethodId ? { ...pm, ...updates } : pm)
    );
    const totalPaid = newPaymentMethods.reduce((sum, pm) => sum + pm.amount, 0);

    set(() => ({
      orderTotalPayment: {
        ...state.orderTotalPayment!,
        paymentMethods: newPaymentMethods,
        remainingAmount: Math.max(
          0,
          state.orderTotalPayment!.totalAmount - totalPaid
        ),
      },
    }));
  },

  setCurrentStep: (step) => set(() => ({ currentStep: step })),
  setAuthorizeZeroPrice: (authorize) =>
    set(() => ({ authorizeZeroPrice: authorize })),
  setIsDeliveryNote: (isDeliveryNote) => set(() => ({ isDeliveryNote })),
  setDeliveryNoteAmount: (amount) =>
    set(() => ({ deliveryNoteAmount: amount })),
  setDeliveryNoteNumber: (number) =>
    set(() => ({ deliveryNoteNumber: number })),

  clearOrder: () =>
    set(() => ({
      selectedBikes: [],
      selectedParts: [],
      selectedOthers: [],
      orderPayments: [],
      orderTotalPayment: null,
      orderDetails: null,
      currentStep: 'selection',
      authorizeZeroPrice: false,
      paymentMode: 'total_order',
      isDeliveryNote: false,
      deliveryNoteAmount: 0,
      deliveryNoteNumber: '',
    })),

  getTotalAmount: () => {
    const state = get();
    const bikesTotal = state.selectedBikes.reduce(
      (sum, bike) => sum + bike.price * bike.quantity,
      0
    );
    const partsTotal = state.selectedParts.reduce(
      (sum, part) => sum + part.price * part.quantity,
      0
    );
    const othersTotal = state.selectedOthers.reduce(
      (sum, other) => sum + other.price * other.quantity,
      0
    );
    return bikesTotal + partsTotal + othersTotal;
  },

  hasZeroPriceItems: () => {
    const state = get();
    return [
      ...state.selectedBikes,
      ...state.selectedParts,
      ...state.selectedOthers,
    ].some((item) => item.price === 0);
  },

  canProcessOrder: () => {
    const state = get();
    const hasItems =
      state.selectedBikes.length > 0 ||
      state.selectedParts.length > 0 ||
      state.selectedOthers.length > 0;
    const zeroAuthorized =
      !get().hasZeroPriceItems() || state.authorizeZeroPrice;
    return hasItems && zeroAuthorized;
  },
}));

// Hooks para acceder al estado
export const useSelectedBikes = () =>
  useOrderStore((state) => state.selectedBikes);
export const useSelectedParts = () =>
  useOrderStore((state) => state.selectedParts);
export const useSelectedOthers = () =>
  useOrderStore((state) => state.selectedOthers);
export const useOrderPayments = () =>
  useOrderStore((state) => state.orderPayments);
export const useOrderTotalPayment = () =>
  useOrderStore((state) => state.orderTotalPayment);
export const useCurrentStep = () => useOrderStore((state) => state.currentStep);
export const useAuthorizeZeroPrice = () =>
  useOrderStore((state) => state.authorizeZeroPrice);
export const useOrderDetails = () =>
  useOrderStore((state) => state.orderDetails);
export const usePaymentMode = () => useOrderStore((state) => state.paymentMode);
export const useIsDeliveryNote = () =>
  useOrderStore((state) => state.isDeliveryNote);
export const useDeliveryNoteAmount = () =>
  useOrderStore((state) => state.deliveryNoteAmount);
export const useDeliveryNoteNumber = () =>
  useOrderStore((state) => state.deliveryNoteNumber);

// Hook para acceder a todas las acciones
export const useOrderActions = () => {
  const store = useOrderStore();
  return {
    setSelectedBikes: store.setSelectedBikes,
    setSelectedParts: store.setSelectedParts,
    setSelectedOthers: store.setSelectedOthers,
    addSelectedBike: store.addSelectedBike,
    addSelectedPart: store.addSelectedPart,
    addSelectedOther: store.addSelectedOther,
    removeSelectedBike: store.removeSelectedBike,
    removeSelectedPart: store.removeSelectedPart,
    removeSelectedOther: store.removeSelectedOther,
    updateBikePrice: store.updateBikePrice,
    updateBikeOutNumber: store.updateBikeOutNumber,
    updatePartPrice: store.updatePartPrice,
    updatePartQuantity: store.updatePartQuantity,
    updateOtherPrice: store.updateOtherPrice,
    updateOtherQuantity: store.updateOtherQuantity,
    clearSelectedBikes: store.clearSelectedBikes,
    clearSelectedParts: store.clearSelectedParts,
    clearSelectedOthers: store.clearSelectedOthers,
    initializeOrderPayments: store.initializeOrderPayments,
    addPaymentMethod: store.addPaymentMethod,
    removePaymentMethod: store.removePaymentMethod,
    updatePaymentMethod: store.updatePaymentMethod,
    setOrderDetails: store.setOrderDetails,
    updateOrderDetails: store.updateOrderDetails,
    setPaymentMode: store.setPaymentMode,
    initializeOrderTotalPayment: store.initializeOrderTotalPayment,
    addTotalPaymentMethod: store.addTotalPaymentMethod,
    removeTotalPaymentMethod: store.removeTotalPaymentMethod,
    updateTotalPaymentMethod: store.updateTotalPaymentMethod,
    setCurrentStep: store.setCurrentStep,
    setAuthorizeZeroPrice: store.setAuthorizeZeroPrice,
    setIsDeliveryNote: store.setIsDeliveryNote,
    setDeliveryNoteAmount: store.setDeliveryNoteAmount,
    setDeliveryNoteNumber: store.setDeliveryNoteNumber,
    clearOrder: store.clearOrder,
    getTotalAmount: store.getTotalAmount,
    hasZeroPriceItems: store.hasZeroPriceItems,
    canProcessOrder: store.canProcessOrder,
  };
};

// Hook para métodos de pago (compatibilidad)
export const usePaymentMethods = () => {
  const orderTotalPayment = useOrderStore((state) => state.orderTotalPayment);
  return orderTotalPayment?.paymentMethods || [];
};
