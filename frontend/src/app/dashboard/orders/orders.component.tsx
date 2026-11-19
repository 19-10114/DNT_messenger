'use client';
import { Pagination } from '@/models/pagination.model';
import { LeaseModel } from '@/models/lease.model';
import { Button } from '@/components/ui/button.component';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { UserModel } from '@/models/user.model';
import { exportToXLSX } from './exportToXLSX';
import { useState } from 'react';

interface OrdersListProps {
  paginatedOrders?: Pagination<LeaseModel>;
  users: { [userId: string]: UserModel };
  selectedOptions: { [key: number]: string };
  handleOptionChange: (leaseId: number, newStatus: string) => void;
}

export function OrdersList({
  paginatedOrders,
  users,
  selectedOptions,
  handleOptionChange,
}: OrdersListProps) {
  const leases = paginatedOrders?.results || [];
  const [selectedPaymentLeaseId, setSelectedPaymentLeaseId] = useState<
    number | null
  >(null);
  const [selectedUserId, setSelectedUserId] = useState<string | ''>('');
  const [selectedUserDetailsId, setSelectedUserDetailsId] = useState<
    string | null
  >(null);

  const openPaymentDetailsModal = (leaseId: number, userId: string) => {
    setSelectedPaymentLeaseId(leaseId);
    setSelectedUserId(userId);
  };

  const closePaymentDetailsModal = () => {
    setSelectedPaymentLeaseId(null);
  };

  const openUserDetailsModal = (userId: string) => {
    setSelectedUserDetailsId(userId);
  };

  return (
    <>
      <div>
        <div>
          {leases.length === 0 ? (
            <p>No hay arrendamientos que mostrar.</p>
          ) : (
            <>
              <div className="text-sm overflow-x-auto bg-white rounded-lg ">
                <table className="min-w-full table-auto border-collapse border border-gray-200">
                  <thead className="bg-primary text-white text-center text-xs font-medium uppercase tracking-wider">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">Cédula</th>
                      <th className="p-2">Contrato</th>
                      <th className="p-2">Estado</th>
                      <th className="p-2">Usuario</th>
                      <th className="p-2">Fecha de Creación</th>
                      <th className="p-2">Producto</th>
                      <th className="px-2">Precio del Producto</th>
                      <th className="p-2">Pago Inicial</th>
                      <th className="p-2">Pago Mensual</th>
                      <th className="p-2">Número de Cuotas</th>
                      <th className="p-2">Tipo de pago</th>
                      <th className="p-2">Sede</th>
                      <th className="p-2">Fecha de conciliación</th>
                      <th className="p-2">Fecha de Entrega</th>
                      <th className="p-2">Fecha de Siguiente Pago</th>
                      <th className="p-2">Tipo</th>
                      <th>Opciones</th>
                      <th>Modificar orden</th>
                      <th>Pago</th>
                      <th>Entregar Moto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders?.results?.map((lease, index) => (
                      <tr
                        key={lease.id}
                        className={
                          index % 2 === 0
                            ? 'bg-gray-200 text-center'
                            : 'bg-white text-center'
                        }
                      >
                        <td className="p-2 text-green-500 hover:underline">
                          <button
                            onClick={() =>
                              openPaymentDetailsModal(lease.id, lease.user)
                            }
                          >
                            {lease.id}
                          </button>
                        </td>
                        <td className="p-2 text-green-500 hover:underline">
                          <button
                            onClick={() => openUserDetailsModal(lease.user)}
                          >
                            {users[lease.user]?.countryUserId}
                          </button>
                        </td>
                        <td className="p-2">{lease?.contractId}</td>
                        {/* <td className="text-xs">{lease.status}</td> */}
                        <td className="p-2 whitespace-nowrap">
                          {users[lease.user]?.firstName}{' '}
                          {users[lease.user]?.lastName}
                        </td>
                        <td>{formatDate(lease.createdAt)}</td>
                        <td>{lease.product}</td>
                        <td>{lease.fullProductPrice}</td>
                        <td>{lease.initialFee}</td>
                        <td>{lease.monthlyFee}</td>
                        <td>{lease.feesNumber}</td>
                        <td>{lease.paymentType}</td>
                        <td>{lease.location}</td>
                        <td>{formatDate(lease.collectionDate)}</td>
                        <td>{formatDate(lease.deliveredDate)}</td>
                        <td>{formatDate(lease.nextPaymentDate)}</td>
                        <td>{lease.type}</td>
                        <td>
                          <select
                            title="Cambiar estado de la orden"
                            className={`py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 text-center text-xs ${
                              index % 2 === 0 ? 'bg-gray-200' : 'bg-white'
                            }`}
                            value={selectedOptions[lease.id] || ''}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              handleOptionChange(lease.id, newStatus);
                            }}
                          >
                            <option value="PENDING_APPROVAL">
                              PENDING APPROVAL
                            </option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="CANCELED">CANCELED</option>
                            <option value="FINISHED">FINISHED</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <Link
                            href={`/dashboard/orders/modify?leaseId=${lease.id}`}
                          >
                            <Button>Modificar Orden</Button>
                          </Link>
                        </td>
                        <td className="p-2">
                          <Link
                            href={`/dashboard/payments/new?leaseId=${lease.id}`}
                          >
                            <Button>Crear Pagos</Button>
                          </Link>
                        </td>
                        <td className="p-2">
                          <Link
                            href={`/dashboard/orders/deliver?leaseId=${lease.id}`}
                          >
                            <Button>Entregar Moto</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="py-4">
                <Button onClick={() => exportToXLSX(leases)}>
                  Descargar XLSX
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
