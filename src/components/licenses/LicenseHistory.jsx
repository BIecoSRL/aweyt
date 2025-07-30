import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar as CalendarIcon, Filter, Building, FileDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const LICENSE_STATUSES = ['nuevo', 'activo', 'inactivo', 'cancelado', 'renovado'];
const PLAN_TYPES = ['all', 'decontado', 'cuotas'];

const LicenseHistory = () => {
  const [licenses, setLicenses] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    date: null,
    planType: 'all'
  });

  useEffect(() => {
    const storedCompanies = JSON.parse(localStorage.getItem('aweyt_companies')) || [];
    const allLicenses = storedCompanies.map(company => ({
      id: company.id,
      companyName: company.name,
      status: company.status || 'nuevo',
      expiryDate: company.licenseExpiry,
      cost: company.cost,
      currency: company.currency,
      frequency: company.paymentFrequency,
      installments: company.installments
    }));
    setLicenses(allLicenses);
  }, []);

  const filteredLicenses = useMemo(() => {
    let tempLicenses = [...licenses];

    if (filters.status !== 'all') {
      tempLicenses = tempLicenses.filter(l => l.status === filters.status);
    }

    if (filters.date) {
      tempLicenses = tempLicenses.filter(l => {
        const expiry = new Date(l.expiryDate);
        return expiry >= filters.date.from && expiry <= filters.date.to;
      });
    }

    if (filters.planType !== 'all') {
      if (filters.planType === 'decontado') {
        tempLicenses = tempLicenses.filter(l => l.installments <= 1);
      } else {
        tempLicenses = tempLicenses.filter(l => l.installments > 1);
      }
    }

    return tempLicenses;
  }, [filters, licenses]);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'activo':
      case 'renovado':
      case 'nuevo':
        return 'success';
      case 'inactivo':
        return 'warning';
      case 'cancelado':
        return 'destructive';
      default:
        return 'default';
    }
  };
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({...prev, [key]: value}));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte Historial de Licencias", 14, 15);
    doc.autoTable({
        head: [['Empresa', 'Estado', 'Expiración', 'Costo', 'Modalidad']],
        body: filteredLicenses.map(l => [
            l.companyName,
            l.status,
            new Date(l.expiryDate).toLocaleDateString(),
            `${l.cost} ${l.currency}`,
            l.installments > 1 ? 'Cuotas' : 'De Contado'
        ])
    });
    doc.save("reporte_licencias.pdf");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-800">Historial de Licencias</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-5 w-5 text-slate-500" />
          <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Estados</SelectItem>
              {LICENSE_STATUSES.map(status => (
                <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.planType} onValueChange={(v) => handleFilterChange('planType', v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Planes</SelectItem>
              <SelectItem value="decontado">De Contado</SelectItem>
              <SelectItem value="cuotas">Cuotas</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.date ? `${format(filters.date.from, 'LLL dd, y')} - ${format(filters.date.to, 'LLL dd, y')}` : "Filtrar por fecha de expiración"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={filters.date} onSelect={(d) => handleFilterChange('date', d)} />
            </PopoverContent>
          </Popover>
           <Button onClick={exportPDF} variant="outline"><FileDown className="h-4 w-4 mr-2" />Imprimir</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="divide-y divide-slate-100">
          {filteredLicenses.length > 0 ? filteredLicenses.map((license, index) => (
            <motion.div
              key={license.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-lg">
                  <Building className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{license.companyName}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    {license.cost} {license.currency} / {license.frequency === 'monthly' ? 'mes' : 'año'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 w-full md:w-auto">
                 <div className="text-left md:text-right">
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    Expira: {new Date(license.expiryDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={getStatusVariant(license.status)} className="capitalize">{license.status}</Badge>
              </div>
            </motion.div>
          )) : (
            <p className="text-center p-8 text-slate-500">No hay licencias que coincidan con los filtros.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LicenseHistory;