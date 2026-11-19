import { Pagination } from '@/models/pagination.model';

/**
 * Verbos del registro de actividad. Vocabulario cerrado que define el backend
 * (`activity.models.Verb`); la parte antes del punto es la sección.
 */
export type ActivityVerb =
  | 'used_bike.registered'
  | 'used_bike.taken'
  | 'used_bike.evaluated'
  | 'used_bike.approved'
  | 'used_bike.rejected'
  | 'used_bike.cancelled'
  | 'used_bike.status_changed'
  | 'used_bike.deleted'
  | 'order.preorder_created'
  | 'order.created'
  | 'order.preorder_billed'
  | 'order.cancelled'
  | 'order.reverted'
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.deleted'
  | 'transaction.reverted'
  | 'inventory.purchase_loaded'
  | 'inventory.reconciled'
  | 'arranca_balance.created'
  | 'arranca_balance.updated'
  | 'arranca_balance.approved'
  | 'arranca_balance.declined'
  | 'purchase_order.created'
  | 'purchase_order.updated'
  | 'purchase_order.approved'
  | 'purchase_order.rejected'
  | 'expense.requested'
  | 'expense.registered'
  | 'expense.updated'
  | 'expense.approved'
  | 'expense.rejected'
  | 'expense.withdrawn'
  | 'expense.cancelled'
  | 'expense.category_created'
  | 'expense.category_updated'
  | 'cash_withdrawal.registered'
  | 'cash_withdrawal.cancelled'
  | 'supplier.created'
  | 'supplier.updated'
  | 'supplier.deactivated'
  | 'supplier.activated'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.bulk_updated'
  | 'price.created'
  | 'price.updated'
  | 'price.bulk_updated'
  | 'rate.updated'
  | 'gps.created'
  | 'gps.updated'
  | 'gps.deleted'
  | 'service.registered'
  | 'branch.created'
  | 'branch.updated'
  | 'branch.deleted'
  | 'survey.created'
  | 'survey.updated'
  | 'survey.archived'
  | 'survey.published'
  | 'survey.response_submitted'
  | 'survey.response_updated'
  | 'media.carousel_created'
  | 'media.carousel_updated'
  | 'media.carousel_deleted'
  | 'media.product_image_created'
  | 'media.product_image_updated'
  | 'user.created'
  | 'user.updated'
  | 'user.role_changed'
  | 'user.deleted'
  | 'client.created'
  | 'client.updated'
  | 'client.deleted'
  | 'client.balances_recomputed'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password_reset_requested'
  | 'auth.password_reset'
  | 'support.ticket_created'
  | 'support.ticket_status_changed'
  | 'support.ticket_closed';

/** La parte del verbo antes del punto */
export type ActivitySection =
  | 'used_bike'
  | 'order'
  | 'transaction'
  | 'inventory'
  | 'purchase_order'
  | 'expense'
  | 'cash_withdrawal'
  | 'supplier'
  | 'product'
  | 'price'
  | 'rate'
  | 'gps'
  | 'service'
  | 'arranca_balance'
  | 'branch'
  | 'client'
  | 'user'
  | 'auth'
  | 'survey'
  | 'media'
  | 'support';

/**
 * Tipo de entidad sobre la que se actuó (`target_model` en el backend). No
 * coincide con la sección: un precio se muestra bajo su producto, una carga
 * masiva bajo su sucursal.
 */
export type ActivityTargetModel =
  | 'used_bike'
  | 'order'
  | 'transaction'
  | 'purchase_order'
  | 'expense'
  | 'expense_category'
  | 'cash_withdrawal'
  | 'supplier'
  | 'product'
  | 'price'
  | 'rate'
  | 'gps'
  | 'arranca_balance'
  | 'branch'
  | 'client'
  | 'user'
  | 'survey'
  | 'carousel_image'
  | 'support_ticket';

/** Una acción registrada: quién hizo qué, sobre qué y cuándo */
export interface ActivityEvent {
  id: number;
  verb: ActivityVerb;
  actor: number | null;
  /** Nombre del actor; se conserva aunque el usuario se elimine */
  actorLabel: string;
  branch: number | null;
  branchName: string | null;
  client: number | null;
  clientName: string | null;
  targetModel: ActivityTargetModel;
  targetId: number;
  /** Cómo se nombra el objetivo: placa, nota de entrega, factura o `#id` */
  targetLabel: string;
  /** Contexto propio de cada verbo (costo, estado anterior, tipo de orden…) */
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityActorOption {
  id: number;
  label: string;
}

export interface ActivityFeedPage extends Pagination<ActivityEvent> {
  /** Actores que coinciden con los filtros actuales, salvo el de actor */
  staticData?: { actors: ActivityActorOption[] };
}

export interface GetActivityFeedQueryParams {
  page?: number;
  pageSize?: number;
  actor?: number;
  /** `0` o ausente = todas las sucursales */
  branch?: number;
  section?: ActivitySection;
  verb?: ActivityVerb;
  /**
   * Texto libre: placa, SKU, nota o factura, IMEI, nombre del cliente, o un
   * número (con o sin `#`) que coincide con el id del objetivo.
   */
  q?: string;
  /** YYYY-MM-DD */
  start?: string;
  /** YYYY-MM-DD */
  finish?: string;
}

export interface ActivityEnvelope<T> {
  message: string;
  data: T;
}
