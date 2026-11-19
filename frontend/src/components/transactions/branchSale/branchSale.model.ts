/**
 * Formas locales del módulo de venta por sucursal. No son las del backend: son
 * lo que el panel de la derecha edita antes de armar el `TransactionDataPayload`.
 */

/** Los precios que puede tener una unidad */
export interface BranchSalePrices {
  /** Lo que cuesta según la lista de precios: es el monto por defecto */
  cost?: number;
  /** Precio de lista; sólo se usa como respaldo si no hay costo */
  price: number;
  dpPrice?: number;
  epPrice?: number;
}

/**
 * Moto elegida para la venta. Sale del inventario ya precargada y todos sus
 * campos son editables menos la placa, que es la que identifica a la unidad.
 */
export interface BranchSaleBike {
  /**
   * Identifica a la **unidad** dentro de la selección. No sirve `productId`:
   * dos motos del mismo modelo comparten el id de producto.
   */
  rowKey: string;
  /** Id del producto: es lo que viaja como `product` en la transacción */
  productId: string;
  productName: string;
  brand: string;
  model: string;
  /** Solo lectura */
  plate: string;
  amount: string;
  orderId: string;
  receptionDate: Date;
  color: string;
  serialNumber: string;
  motorSerial: string;
  inNumber: string;
  year: string;
  /**
   * Se guardan para poder recalcular el monto si la sucursal de destino cambia
   * después de haber elegido la moto.
   */
  prices: BranchSalePrices;
}

/** Repuesto agregado a la venta, con su cantidad y su precio editables */
export interface BranchSalePart {
  /** Id del producto: viaja como `product` en la transacción */
  productId: string;
  sku: string;
  name: string;
  model: string;
  price: number;
  quantity: number;
  /** Tope de `quantity`: lo que hay en el inventario de la sucursal de origen */
  availableQuantity: number;
}
