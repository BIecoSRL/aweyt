
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building, ShieldCheck, AlertTriangle, DollarSign, Calendar, TrendingUp, PieChart, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { addDays, isBefore, format, isPast } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, bgColor, iconColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  </motion.div>
);

const CurrencyStatCard = ({ currency, stats }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
    >
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800">Resumen Financiero ({currency})</h3>
            <DollarSign className="h-6 w-6 text-green-500" />
        </div>
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Ingresos Pagados</span>
                <span className="font-bold text-green-600">{stats.paid.toLocaleString(undefined, { style: 'currency', currency, currencyDisplay: 'symbol' })}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-500" />Cuotas Pendientes</span>
                <span className="font-bold text-yellow-600">{stats.pending.toLocaleString(undefined, { style: 'currency', currency, currencyDisplay: 'symbol' })}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" />Cuotas Vencidas</span>
                <span className="font-bold text-red-600">{stats.overdue.toLocaleString(undefined, { style: 'currency', currency, currencyDisplay: 'symbol' })}</span>
            </div>
        </div>
    </motion.div>
);


const ChartCard = ({ title, children, icon: Icon }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
    >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-3 text-slate-800">
            <Icon className="h-5 w-5 text-blue-500" />
            {title}
        </h3>
        {children}
    </motion.div>
);

const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const storedCompanies = JSON.parse(localStorage.getItem('aweyt_companies')) || [];
    setCompanies(storedCompanies);
  }, []);

  const stats = useMemo(() => {
    const totalCompanies = companies.length;
    
    const revenueByCurrency = companies.reduce((acc, company) => {
        const currency = company.currency || 'USD';
        if (!acc[currency]) {
            acc[currency] = { paid: 0, pending: 0, overdue: 0 };
        }

        (company.payments || []).forEach(p => {
            const amount = p.amount || 0;
            if (p.status === 'paid') {
                acc[currency].paid += amount;
            } else {
                acc[currency].pending += amount;
                if (p.dueDate && isPast(new Date(p.dueDate))) {
                    acc[currency].overdue += amount;
                }
            }
        });
        return acc;
    }, {});

    const statusCounts = companies.reduce((acc, company) => {
        const status = company.status || 'desconocido';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    
    const planTypeCounts = companies.reduce((acc, company) => {
        const type = (company.installments || 1) > 1 ? 'Cuotas' : 'De Contado';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    return { totalCompanies, revenueByCurrency, statusCounts, planTypeCounts };
  }, [companies]);

  const licensesExpiringSoon = useMemo(() => {
    const today = new Date();
    const alertLimit = addDays(today, 60); // Check licenses expiring in the next 60 days
    return companies
      .filter(c => {
        if (!c.licenseExpiry) return false;
        const expiryDate = new Date(c.licenseExpiry);
        return isBefore(expiryDate, alertLimit) && !isPast(expiryDate);
      })
      .sort((a, b) => new Date(a.licenseExpiry) - new Date(b.licenseExpiry));
  }, [companies]);

  return (
    <div className="space-y-8 bg-slate-50 p-1">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Dashboard Ejecutivo</h2>
        <p className="text-slate-500">Resumen del estado del negocio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Empresas" value={stats.totalCompanies} icon={Building} bgColor="bg-blue-100" iconColor="text-blue-600" />
        <StatCard title="Planes a Cuotas" value={stats.planTypeCounts['Cuotas'] || 0} icon={TrendingUp} bgColor="bg-green-100" iconColor="text-green-600" />
        <StatCard title="Planes de Contado" value={stats.planTypeCounts['De Contado'] || 0} icon={DollarSign} bgColor="bg-indigo-100" iconColor="text-indigo-600" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.keys(stats.revenueByCurrency).map(currency => (
              <CurrencyStatCard key={currency} currency={currency} stats={stats.revenueByCurrency[currency]} />
          ))}
          {Object.keys(stats.revenueByCurrency).length === 0 && (
             <p className="text-slate-500 col-span-full text-center py-8">No hay datos financieros para mostrar.</p>
          )}
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Licencias por Estado" icon={PieChart}>
                <div className="space-y-3 pt-2">
                    {Object.entries(stats.statusCounts).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between text-sm">
                            <span className="capitalize text-slate-600">{status}</span>
                            <span className="font-bold text-slate-800">{count}</span>
                        </div>
                    ))}
                    {Object.keys(stats.statusCounts).length === 0 && <p className="text-slate-500 text-center">Sin datos</p>}
                </div>
            </ChartCard>
            <ChartCard title="Modalidad de Licencias" icon={ShieldCheck}>
                 <div className="space-y-3 pt-2">
                    {Object.entries(stats.planTypeCounts).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between text-sm">
                            <span className="capitalize text-slate-600">{type}</span>
                            <span className="font-bold text-slate-800">{count}</span>
                        </div>
                    ))}
                    {Object.keys(stats.planTypeCounts).length === 0 && <p className="text-slate-500 text-center">Sin datos</p>}
                </div>
            </ChartCard>
       </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-3 text-slate-800">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Licencias por Vencer (Próximos 60 días)
        </h3>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {licensesExpiringSoon.length > 0 ? licensesExpiringSoon.map(company => (
            <div key={company.id} className="flex items-center justify-between py-2 pr-2 border-b border-slate-100 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-md">
                    <Building className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">{company.name}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Vence el: {format(new Date(company.licenseExpiry), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
              <Badge variant={company.status === 'activo' ? 'success' : 'warning'} className="capitalize text-xs">{company.status}</Badge>
            </div>
          )) : (
            <p className="text-slate-500 text-center py-4">No hay licencias por vencer próximamente.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;