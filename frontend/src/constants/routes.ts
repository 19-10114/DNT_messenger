export const HOME = '/';
export const DASHBOARD = '/dashboard';
export const TRANSACTIONS = '/dashboard/transactions';
export const TRANSACTIONS_BIKES = '/dashboard/transactions/bikes';
export const TRANSACTIONS_PARTS = '/dashboard/transactions/parts';
export const TRANSACTIONS_NEW = '/dashboard/transactions/new';
export const TRANSACTIONS_PAYMENTS = '/dashboard/transactions/new-payment';
/**
 * Venta por sucursal (transferencias entre sucursales): la única forma de
 * crear una transacción de motos o repuestos. `TRANSACTIONS_NEW` redirige
 * aquí; el formulario viejo queda solo para editar.
 */
export const TRANSACTIONS_BRANCH_SALE = '/dashboard/transactions/branches';
export const TRANSACTIONS_BRANCH_SALE_TAB = (tab: 'motos' | 'repuestos') =>
  `${TRANSACTIONS_BRANCH_SALE}?tab=${tab}`;
export const CATEGORIES = '/dashboard/categories';
export const PRODUCTS = '/dashboard/products';
export const PRODUCTS_BIKES = '/dashboard/products/bikes';
export const PRODUCTS_PARTS = '/dashboard/products/parts';
export const USERS = '/dashboard/users';
export const ANALYTICS = '/dashboard/analytics';
export const USD_TABLE = '/dashboard/analytics/usd-table';
export const REPORTS = '/dashboard/reports';
export const SALES_REPORTS = '/dashboard/reports/sales';
export const DAILY_REPORTS = '/dashboard/reports/daily';
export const SALES_TARGETS_REPORT = '/dashboard/reports/targets';
export const BALANCE_TABLE = '/dashboard/branches';
export const BRANCH_MANAGEMENT = '/dashboard/branches/management';
export const BRANCH_DEBT = '/dashboard/branches/debt';
export const BRANCH_CASH = '/dashboard/branches/cash';
export const CONCILIATION = '/dashboard/conciliation';
export const CONCILIATION_PAYMENTS =
  '/dashboard/conciliation/conciliation-payments';
export const CONCILIATION_DELIVERIES =
  '/dashboard/conciliation/conciliation-deliveries';
export const ORDERS = '/dashboard/orders';
export const ORDERS_NEW = '/dashboard/orders/new';
export const PRE_ORDERS_NEW = '/dashboard/orders/new?is-pre-orden=true';
export const ORDERS_PAYMENT = '/dashboard/orders/payment';
export const ORDERS_MODIFY = '/dashboard/orders/modify';
export const PRODUCTS_UPDATE_PRICES = '/dashboard/products/update-prices';
export const INVOICE_CREATE = '/dashboard/invoices/create';
export const DELIVERY_NOTES = '/dashboard/delivery-notes';
export const PURCHASES = '/dashboard/purchases';
export const PURCHASES_ORDERS = '/dashboard/purchases/orders';
export const PURCHASES_NEW = '/dashboard/purchases/new';
/** Aprobaciones de Empire Keeway: lo aprobado por modelo y lo recibido. */
export const APPROVALS = '/dashboard/purchases/approvals';
export const APPROVALS_NEW = '/dashboard/purchases/approvals/new';
export const APPROVALS_PENDING = '/dashboard/purchases/approvals/pending';
export const APPROVAL_DETAIL = (approvalId: number | string) =>
  `${APPROVALS}/${approvalId}`;
export const APPROVAL_EDIT = (approvalId: number | string) =>
  `${APPROVALS}/${approvalId}/edit`;
export const PURCHASES_EDIT = (purchaseOrderId: number | string) =>
  `/dashboard/purchases/edit/${purchaseOrderId}`;
export const PROCUREMENT_ANALYSIS = '/dashboard/purchases/procurement-analysis';
export const DAILY_SALES_CHART = '/dashboard/analytics/daily-sales';
export const TOP_SELLER_PARTS = '/dashboard/products/parts/top-seller';
export const BIKES_INVENTORY = '/dashboard/inventories/bikes';
export const BIKES_HISTORY = '/dashboard/inventories/bikes-history';
export const PARTS_INVENTORY = '/dashboard/inventories/parts';
export const BIKES_NEW = '/dashboard/products/bikes/new';
export const BIKES_UPDATE_PRICE = '/dashboard/products/update-prices';
export const SELLERS_REPORT = '/dashboard/reports/sellers';
export const SURVEYS = '/dashboard/surveys';
/**
 * Páginas públicas armadas por bloques (promos, encuestas, eventos). Se ven en
 * `/p/<slug>`; la administración es solo de Super Admin.
 */
export const PAGES = '/dashboard/pages';
export const PAGES_NEW = '/dashboard/pages/new';
export const PAGE_EDIT = (pageId: number | string) => `${PAGES}/${pageId}`;
export const PUBLIC_PAGE = (slug: string) => `/p/${slug}`;
export const USED_BIKES = '/dashboard/used-bikes';
/** Ficha de una moto usada concreta; solo lectura y reservada a admin */
export const USED_BIKE_DETAIL = (usedBikeId: number | string) =>
  `${USED_BIKES}/${usedBikeId}`;
export const MECHANICS_REPORT = '/dashboard/reports/mechanics';
export const PARTS_REPORT = '/dashboard/reports/parts';
export const ARRANCA_BALANCE_REPORT = '/dashboard/reports/arranca';
export const ARRANCA_MC_REPORT = '/dashboard/reports/arranca-mc';
export const TRANSACTIONS_SERVICES = '/dashboard/transactions/services';
export const CLIENTS_HISTORY = '/dashboard/clients/history';
export const CLIENTS_BALANCE = '/dashboard/clients/balance';
export const GPS = '/dashboard/gps';
export const GPS_MONITORING = '/dashboard/gps/monitoring';
export const GPS_LOGS = '/dashboard/gps/logs';
/** Solicitudes de motos que hace Arranca a una sucursal de Moto Candela */
export const ARRANCA_REQUESTS = '/dashboard/arranca-requests';
export const ARRANCA_REQUESTS_PENDING = '/dashboard/arranca-requests/pending';
export const ARRANCA_REQUEST_DETAIL = (bikeRequestId: number | string) =>
  `${ARRANCA_REQUESTS}/${bikeRequestId}`;
/** Registro de actividad ("quién hizo qué") */
export const ACTIVITY = '/dashboard/activity';
export const CATEGORY_UTILITY_REPORT = '/dashboard/reports/utility-by-category';
// Registrar y editar gastos son modales sobre el listado: no hay más rutas.
export const EXPENSES = '/dashboard/expenses';
/** Pre Gastos: los gastos pendientes de aprobación y los rechazados. */
export const EXPENSES_REQUESTS = '/dashboard/expenses/pre';
/** Retenciones de IVA e ISLR de los gastos aprobados, por quincena. */
export const EXPENSES_RETENTIONS = '/dashboard/expenses/retentions';
/** Proveedores con su perfil de retención (solo administración). */
export const EXPENSES_SUPPLIERS = '/dashboard/expenses/suppliers';
/**
 * Soporte: cualquier usuario reporta y sigue sus reportes; el equipo (Super
 * Admin) ve todos en la misma página y cambia el estado desde el detalle.
 */
export const SUPPORT = '/dashboard/support';
export const SUPPORT_TICKET = (ticketId: number | string) =>
  `${SUPPORT}/${ticketId}`;

export const MENU_LAYOUT = [
  {
    title: 'Inicio',
    href: DASHBOARD,
    manager: true,
    administrator: true,
    finance: true,
    //allowedRoles: ['admin']
  },
  {
    // Sin `requiresAdmin` en la raíz: cajeros y vendedores entran por las
    // pantallas de clientes. "Todos" lo sigue exigiendo.
    title: 'Usuarios',
    href: '#',
    partsAdmin: true,
    cashier: true,
    seller: true,
    manager: true,
    administrator: true,
    submenu: [
      {
        title: 'Todos',
        href: USERS,
        requiresAdmin: true,
        partsAdmin: true,
        manager: true,
        administrator: true,
        //allowedRoles: ['admin', 'parts_admin'],
      },
      {
        title: 'Historial de Clientes',
        href: CLIENTS_HISTORY,
        partsAdmin: true,
        cashier: true,
        seller: true,
        manager: true,
        administrator: true,
      },
      {
        title: 'Saldo de Clientes',
        href: CLIENTS_BALANCE,
        partsAdmin: true,
        cashier: true,
        seller: true,
        manager: true,
        administrator: true,
      },
    ],
  },
  {
    title: 'Inventarios',
    href: '#',
    seller: true,
    partsAdmin: true,
    storage: true,
    mainStorage: true,
    manager: true,
    administrator: true,
    //allowedRoles: ['admin', 'parts_admin', 'seller'],
    submenu: [
      {
        title: 'Motos',
        href: BIKES_INVENTORY,
        seller: true,
        storage: true,
        mainStorage: true,
        manager: true,
        administrator: true,
        //allowedRoles: ['admin', 'seller'],
      },
      {
        title: 'Historial de Motos',
        href: BIKES_HISTORY,
        seller: true,
        storage: true,
        mainStorage: true,
        manager: true,
        administrator: true,
      },
      {
        title: 'Repuestos',
        href: PARTS_INVENTORY,
        seller: true,
        partsAdmin: true,
        storage: true,
        mainStorage: true,
        manager: true,
        administrator: true,
        //allowedRoles: ['admin', 'parts_admin', 'seller'],
      },
    ],
  },
  {
    title: 'Ventas',
    href: '#',
    partsAdmin: true,
    cashier: true,
    seller: true,
    manager: true,
    administrator: true,
    submenu: [
      {
        title: 'Pre Ordenes',
        href: DELIVERY_NOTES,
        partsAdmin: true,
        cashier: true,
        seller: true,
        manager: true,
        administrator: true,
        //allowedRoles: ['admin', 'parts_admin', 'cashier', 'seller'],
      },
      {
        title: 'Ordenes',
        href: ORDERS,
        partsAdmin: true,
        cashier: true,
        manager: true,
        administrator: true,
        //allowedRoles: ['admin', 'parts_admin', 'cashier'],
      },
    ],
  },
  {
    title: 'Motos Usadas',
    href: USED_BIKES,
    manager: true,
    seller: true,
    administrator: true,
  },
  {
    title: 'GPS',
    href: '#',
    manager: true,
    administrator: true,
    submenu: [
      {
        title: 'Monitoreo',
        href: GPS_MONITORING,
        manager: true,
        administrator: true,
      },
      {
        title: 'Registros',
        href: GPS_LOGS,
        manager: true,
        administrator: true,
      },
    ],
  },
  {
    title: 'Solicitudes Arranca',
    href: '#',
    manager: true,
    administrator: true,
    submenu: [
      {
        title: 'Solicitudes',
        href: ARRANCA_REQUESTS,
        manager: true,
        administrator: true,
      },
      {
        title: 'Motos por entregar',
        href: ARRANCA_REQUESTS_PENDING,
        manager: true,
        administrator: true,
      },
    ],
  },
  {
    title: 'Reportes',
    href: REPORTS,
    partsAdmin: true,
    manager: true,
    administrator: true,
    //allowedRoles: ['admin', 'parts_admin'],
    submenu: [
      {
        title: 'Ventas',
        href: SALES_REPORTS,
        partsAdmin: true,
        manager: true,
        administrator: true,
        //allowedRoles: ['admin', 'parts_admin'],
      },
      {
        title: 'Diario',
        href: DAILY_REPORTS,
        manager: true,
        administrator: true,
        //allowedRoles: ['admin', 'parts_admin'],
      },
      {
        title: 'Metas de ventas',
        href: SALES_TARGETS_REPORT,
        manager: true,
        administrator: true,
      },
      {
        title: 'Vendedores',
        href: SELLERS_REPORT,
        partsAdmin: true,
        manager: true,
        administrator: true,
        //allowedRoles: ['admin', 'parts_admin'],
      },
      {
        title: 'Mecánicos',
        href: MECHANICS_REPORT,
        partsAdmin: true,
        manager: true,
        administrator: true,
      },
      {
        title: 'Balance Arranca',
        href: ARRANCA_BALANCE_REPORT,
        manager: true,
        administrator: true,
      },
      {
        title: 'Arranca - MC',
        href: ARRANCA_MC_REPORT,
        manager: true,
        administrator: true,
      },
      {
        title: 'Dashboard Gerencial',
        href: CATEGORY_UTILITY_REPORT,
        requiresAdmin: true,
      },
      {
        title: 'Reporte de Repuestos',
        href: PARTS_REPORT,
        partsAdmin: true,
        manager: true,
        administrator: true,
      },
    ],
  },
  {
    title: 'Compras',
    href: PURCHASES,
    seller: true,
    manager: true,
    administrator: true,
    submenu: [
      {
        title: 'Pre-Ordenes',
        href: PURCHASES,
        seller: true,
        manager: true,
        administrator: true,
      },
      {
        title: 'Órdenes',
        href: PURCHASES_ORDERS,
        seller: true,
        manager: true,
        administrator: true,
      },
      {
        title: 'Aprobaciones Empire',
        href: APPROVALS,
        manager: true,
        administrator: true,
      },
      {
        title: 'Motos por recibir',
        href: APPROVALS_PENDING,
        manager: true,
        administrator: true,
      },
      {
        title: 'Procura de Repuestos',
        href: PROCUREMENT_ANALYSIS,
        partsAdmin: true,
        manager: true,
        administrator: true,
      },
    ],
  },
  {
    title: 'Transacciones',
    href: '#',
    partsAdmin: true,
    manager: true,
    administrator: true,
    //allowedRoles: ['admin', 'parts_admin'],
    submenu: [
      {
        title: 'Nueva transferencia',
        href: TRANSACTIONS_BRANCH_SALE,
        partsAdmin: true,
        manager: true,
        administrator: true,
      },
      {
        title: 'Transacciones de Motos',
        href: TRANSACTIONS_BIKES,
        manager: true,
        administrator: true,
      },
      {
        title: 'Transacciones de Repuestos',
        href: TRANSACTIONS_PARTS,
        partsAdmin: true,
        manager: true,
        administrator: true,
        //allowedRoles: ['admin', 'parts_admin'],
      },
      {
        title: 'Transacciones de Servicios',
        href: TRANSACTIONS_SERVICES,
        partsAdmin: true,
        manager: true,
        administrator: true,
      },
    ],
  },
  {
    // Finanzas ve el módulo entero; fuera de aquí solo tiene Inicio (y desde
    // ahí la caja de la sucursal).
    title: 'Gastos',
    href: '#',
    cashier: true,
    manager: true,
    administrator: true,
    finance: true,
    submenu: [
      {
        title: 'Pre Gastos',
        href: EXPENSES_REQUESTS,
        cashier: true,
        manager: true,
        administrator: true,
        finance: true,
      },
      {
        title: 'Gastos',
        href: EXPENSES,
        cashier: true,
        manager: true,
        administrator: true,
        finance: true,
      },
      {
        title: 'Retenciones',
        href: EXPENSES_RETENTIONS,
        cashier: true,
        manager: true,
        administrator: true,
        finance: true,
      },
      {
        // Los gestiona la administración y finanzas; el resto los elige en el
        // gasto.
        title: 'Proveedores',
        href: EXPENSES_SUPPLIERS,
        administrator: true,
        finance: true,
      },
    ],
  },
  {
    title: 'Pagos',
    href: TRANSACTIONS_PAYMENTS,
    partsAdmin: true,
    manager: true,
    administrator: true,
    //allowedRoles: ['admin', 'parts_admin'],
  },
  {
    title: 'Herramientas',
    href: '#',
    partsAdmin: true,
    manager: true,
    administrator: true,
    submenu: [
      {
        title: 'Productos',
        href: '#',
        partsAdmin: true,
        manager: true,
        administrator: true,
        //allowedRoles: ['admin', 'parts_admin'],
        submenu: [
          {
            title: 'Motos',
            href: PRODUCTS_BIKES,
            manager: true,
            administrator: true,
            //allowedRoles: ['admin', 'parts_admin'],
          },
          {
            title: 'Repuestos',
            href: PRODUCTS_PARTS,
            partsAdmin: true,
            manager: true,
            administrator: true,
            //allowedRoles: ['admin', 'parts_admin'],
          },
          {
            title: 'Más vendidos',
            href: '#',
            partsAdmin: true,
            manager: true,
            administrator: true,
            submenu: [
              {
                title: 'Repuestos',
                href: TOP_SELLER_PARTS,
                partsAdmin: true,
                manager: true,
                administrator: true,
                //allowedRoles: ['admin', 'parts_admin'],
              },
            ],
          },
        ],
      },
      {
        title: 'Categorias',
        href: CATEGORIES,
        manager: true,
        administrator: true,
      },
      {
        title: 'Encuestas',
        href: SURVEYS,
      },
      {
        title: 'Páginas',
        href: PAGES,
        requiresSuperAdmin: true,
      },
      {
        title: 'Sucursales',
        href: '#',
        manager: true,
        administrator: true,
        submenu: [
          {
            title: 'Gestión',
            href: BRANCH_MANAGEMENT,
            requiresAdmin: true,
            manager: true,
            administrator: true,
          },
          {
            title: 'Deuda entre sucursales',
            href: BRANCH_DEBT,
            manager: true,
            administrator: true,
          },
        ],
      },
      {
        title: 'Actividad',
        href: ACTIVITY,
        // Solo Super Admin por ahora (mismo criterio que el backend)
        requiresSuperAdmin: true,
      },
      {
        title: 'Generar Factura',
        href: INVOICE_CREATE,
        manager: true,
        administrator: true,
      },
      {
        title: 'Gráficas',
        href: '#',
        manager: true,
        administrator: true,
        //allowedRoles: ['admin', 'parts_admin'],
        submenu: [
          {
            title: 'Ventas diarias',
            href: DAILY_SALES_CHART,
            requiresAdmin: true,
            manager: true,
            administrator: true,
            //allowedRoles: ['admin', 'parts_admin'],
          },
        ],
      },
    ],
  },
  {
    title: 'Soporte',
    href: SUPPORT,
    // Para todos: el menú oculta un item a cada rol que no tenga su bandera
    seller: true,
    cashier: true,
    partsAdmin: true,
    storage: true,
    mainStorage: true,
    manager: true,
    administrator: true,
    mechanic: true,
  },
];
