/**
 * Utility functions for handling product data in transaction forms
 */

import { UseFormReturn } from 'react-hook-form';

interface Product {
  id: number;
  plate: string;
  color: string;
  serialNumber: string;
  inNumber: string;
  year: string;
  receptionDate: Date;
  amount: number;
  product: ProductClass;
  notes: string;
  orderId: string;
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: number;
  createdAt: Date;
  quantity: number;
  prices: Prices;
}

interface Prices {
  cost: number;
  dpPrice: number;
  epPrice: number;
  price: number;
  bulkPrice: number;
}

interface ProductClass {
  id: number;
  name: string;
  model: string;
  brand: string;
}

// Mapeo entre IDs compuestos (para UI) y IDs base (para backend)
const idMapping: Record<string, string> = {};

const ProductUtils = {
  /**
   * Gets the ID from a product object, handling different product structures
   * Returns a composite ID for UI display purposes
   */
  getId: (product: Product): string => {
    let baseId = '';

    // For inventory products (they have id and product object)
    if (product.product && product.product.id) {
      baseId = product.product.id.toString();
    }
    // For direct products from allBikes/allParts (they have id directly)
    else if (product.id) {
      baseId = product.id.toString();
    }

    // Para motos, añadir identificadores adicionales para hacerlos únicos
    // Primero intentamos con SKU, luego con placa si está disponible
    if (baseId) {
      let compositeId = baseId;

      if (product.sku) {
        compositeId = `${baseId}_${product.sku}`;
      } else if (product.plate) {
        compositeId = `${baseId}_${product.plate}`;
      }

      // Guardar el mapeo entre ID compuesto y ID base
      idMapping[compositeId] = baseId;

      return compositeId;
    }

    // Si no hay identificadores adicionales, devolver el ID base
    return baseId || '';
  },

  /**
   * Gets the base ID from a composite ID for backend operations
   */
  getBaseId: (compositeId: string): string => {
    // Si existe en el mapeo, devolver el ID base
    if (idMapping[compositeId]) {
      return idMapping[compositeId];
    }

    // Si no existe en el mapeo, puede ser que ya sea un ID base
    // o que el producto ya no esté disponible
    return compositeId;
  },

  /**
   * Gets the display name for a product based on its type
   * Avoids duplicating information when name already contains model or brand
   */
  getName: (product: Product, isMotorcycle: boolean): string => {
    // For inventory products
    if (product.product && product.product.name) {
      if (isMotorcycle) {
        // For motorcycles, include model and brand if available
        const name = product.product.name || '';
        const model = product.product.model || '';
        const plate = product.plate || '';
        const brand = product.product.brand || '';

        // Evitar duplicación: verificar si el nombre ya contiene el modelo
        const modelAlreadyInName = model && name.includes(model);

        // Construir el nombre evitando duplicación
        return `${brand} ${name} ${modelAlreadyInName ? '' : model} ${plate}`
          .replace(/\s+/g, ' ')
          .trim();
      }
      return product.product.name;
    }

    // For direct products
    if (isMotorcycle) {
      // For motorcycles, include model and brand if available
      if (product.model && product.brand) {
        const brand = product.brand || '';
        const model = product.model || '';
        const sku = product.sku || '';

        // Evitar duplicación: verificar si el nombre ya contiene el modelo o la marca
        const nameContainsModel =
          product.name && model && product.name.includes(model);
        const nameContainsBrand =
          product.name && brand && product.name.includes(brand);

        // Si el nombre ya contiene el modelo y la marca, usar solo el nombre
        if (nameContainsModel && nameContainsBrand && product.name) {
          return `${product.name} ${sku}`.trim();
        }

        // Construir el nombre evitando duplicación
        return `${brand} ${model} ${sku}`.replace(/\s+/g, ' ').trim();
      }
      return product.name || 'Moto sin nombre';
    } else {
      // For spare parts, prioritize name and include SKU if available
      if (product.name) {
        const sku = product.sku || '';
        const quantity = product.quantity
          ? `Cantidad:  ${product.quantity}`
          : '';
        return sku ? `${product.name} (${sku}) ${quantity}` : product.name;
      }
      if (product.model && product.brand) {
        const sku = product.sku || '';
        const quantity = product.quantity
          ? `Cantidad:  ${product.quantity}`
          : '';
        return sku
          ? `${product.brand} ${product.model} (${sku}) ${quantity}`
          : `${product.brand} ${product.model} ${quantity}`;
      }
    }

    return 'Producto sin nombre';
  },

  /**
   * Finds a product by its ID in a list of products
   */
  findProductById: (
    products: Product[],
    productId: string
  ): Product | undefined => {
    return products.find((product) => {
      const id = ProductUtils.getId(product);
      return id === productId;
    });
  },

  /**
   * Updates form fields with motorcycle-specific data
   */
  updateMotorcycleFields: (
    form: UseFormReturn<any>,
    product: Product
  ): void => {
    // Update plate if available
    if (product.plate) {
      form.setValue('plate', product.plate);
    }

    // Update year if available
    if (product.year) {
      form.setValue('year', product.year);
    }

    // Update color if available
    if (product.color) {
      form.setValue('color', product.color);
    }

    // Update inNumber if available
    if (product.inNumber) {
      form.setValue('in_number', product.inNumber);
    }

    // Update orderId if available
    if (product.orderId) {
      form.setValue('order_id', product.orderId);
    }

    // Update serialNumber if available
    if (product.serialNumber) {
      form.setValue('serial_number', product.serialNumber);
    }
  },
};

export default ProductUtils;
