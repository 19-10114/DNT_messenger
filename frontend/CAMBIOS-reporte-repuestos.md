# Reporte de Repuestos — cambios en el frontend

Branch: `salva-reporte-repuestos` (creada desde `main` ya actualizado, incluye
todo lo de `salva-reporte-mecanico` ya mergeado). Depende de los endpoints
nuevos del backend, documentados en `CAMBIOS-reporte-repuestos.md` dentro de
`moto-candela-be`.

---

## 1. Archivos nuevos

| Archivo | Qué es |
|---|---|
| `src/components/tables/partsReportTable.component.tsx` | Página completa: KPIs (ingreso/costo/utilidad total + métodos de pago), filtros (repuesto, rango de fechas), y dos pestañas — "Repuestos Vendidos" (columnas ID/SKU/Repuesto/Cantidad Vendida/Ingreso/Costo/Utilidad; la cantidad vendida es el link clicable que abre el detalle por venta individual, con columna "Orden" — cada venta con orden asociada tiene un botón que abre `OrderDetailsModal`) y "Órdenes con Repuestos" (reutiliza `useBranchOrdersList` con `category: 'parts'`, cada fila abre `OrderDetailsModal`). |
| `src/app/dashboard/reports/parts/page.tsx` | Página nueva **"Reporte de Repuestos"**. |
| `src/services/transactions/types/PartsReport.type.ts` | Tipos del reporte y del detalle por venta. |

## 2. Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/services/transactions/transactions.service.ts` | Nuevos métodos `getPartsSoldReport` y `getPartSaleDetail`. |
| `src/constants/routes.ts` | Nueva ruta `PARTS_REPORT` + entrada "Repuestos" en el sidebar (bajo "Reportes"). |

## 3. Cómo probarlo localmente

1. Login: `salvacovelo` / `TestLocal123!`.
2. Cambiar de sucursal a una con actividad real de repuestos (`Prueba` no tiene ninguna en los datos locales; `Valencia` sí).
3. Reportes → Repuestos. Pestaña "Repuestos Vendidos" por defecto; clic en "Ver ventas" abre el detalle de cada venta individual (fecha, sucursal, cantidad, precio, costo, utilidad).
4. Pestaña "Órdenes con Repuestos" no mostrará nada localmente — `orders_order` está vacío en la DB local (gap conocido, no un bug de esta feature).

## 4. Bugs reportados y arreglados en esta ronda

- **`useOrderForBikeSale` (usado por "Ver orden" desde el modal de moto y el reporte de repuestos) no traía `seller` ni `paymentMethods` reales** — mapeaba `paymentMethods: []` a mano y ni siquiera intentaba mapear `seller`. El tipo `GetOrderById.type.ts` además tenía `seller?: number` cuando el backend ya devuelve el objeto completo (`OrderReadSerializer` anida `SellerSerializer`). Arreglado: se mapean `seller` (id/nombre/apellido) y `paymentMethods` (con `amountUsd`/`amountBs` según la moneda) desde la respuesta real.
- **`hidePaymentInfo` en `OrderDetailsModal` ocultaba la sección "Cliente" además de "Métodos de pago"** (nombre del prop engañoso — también tapaba el cliente). Se quitó ese prop en los dos sitios donde se abre el modal fuera de la página de Órdenes (modal de moto, reporte de repuestos), así que ahora se ve igual que al abrirlo desde Órdenes: Vendedor, Cliente y Métodos de pago completos.

## 5. Pendiente / decisiones abiertas

- Ninguna nueva — hereda el gap de `orders_order` ya documentado para la feature anterior.
