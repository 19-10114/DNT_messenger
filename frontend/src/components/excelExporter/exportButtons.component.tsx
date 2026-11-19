'use client';
import React from 'react';
import { exportToXLSX } from './exportXSLX';

interface ExportButtonProps<T> {
  data: T[];
  title?: string;
  fileName?: string;
  getAllData?: () => Promise<T[]>;
}
const ExportButton: React.FC<ExportButtonProps<any>> = ({
  data,
  title = 'Exportar a XLSX',
  fileName,
  getAllData,
}) => {
  const handleExportClick = async (fileName: string) => {
    if (getAllData) {
      const allData = await getAllData();
      exportToXLSX(allData, fileName);
    } else {
      exportToXLSX(data, fileName);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => handleExportClick(fileName || '')}
        className="cursor-pointer rounded bg-primary px-4 py-[10px] font-bold text-white"
      >
        {title}
      </button>
    </div>
  );
};

export default ExportButton;
