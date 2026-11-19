import React, { useEffect, useState } from 'react';
import { useToken } from '@/stores/auth/auth.store';
import { useAuthService } from '@/stores/auth/auth.store';
import { UserModel } from '@/models/user.model';
import { CloseIcon } from '@/app/icons/close';
import '@/components/componentStyle.css';

interface UserDetailsModalProps {
  userId: string | number;
  onClose: () => void;
}

function UserDetailsModal({ userId, onClose }: UserDetailsModalProps) {
  const token = useToken() || '';
  const authService = useAuthService();
  const [userDetails, setUserDetails] = useState<UserModel | null>(null);

  useEffect(() => {
    async function fetchUserDetails() {
      const userDetails = await authService.getUserById(
        userId.toString(),
        token
      );
      if (userDetails) {
        setUserDetails(userDetails);
      }
    }

    fetchUserDetails();
  }, [userId, token, authService]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-50"></div>
      <div className="modal-container bg-white w-11/12 md:max-w-3xl mx-auto rounded shadow-lg z-50">
        <div className="modal-content py-4 text-left px-6 overflow-y-auto">
          <div className="flex justify-between items-center pb-3">
            <p className="text-2xl font-bold green-text">Detalle del Usuario</p>
            <button
              title="CloseModal"
              className="modal-close"
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
          {userDetails ? (
            <div>
              <table className="w-full">
                <tbody>
                  {userDetails ? (
                    <>
                      <tr>
                        <td className="font-bold py-1">Número de teléfono</td>
                        <td>{userDetails.phoneNumber}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-1">
                          Posicion en la empresa
                        </td>
                        <td>{userDetails.position}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-1">Sueldo mensual</td>
                        <td>{userDetails.monthlyIncome}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td>Cargando detalles del usuario...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-lg">Cargando detalles del arrendamiento...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDetailsModal;
