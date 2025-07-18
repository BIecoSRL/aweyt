import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building, ShieldCheck, AlertTriangle, DollarSign, Calendar, TrendingUp, PieChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { addDays, isBefore, format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, color, unit }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`${color} p-6 rounded-xl shadow-sm`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-lg">{title}</p>
        <p className="text-3xl font-bold">{value}<span className="text-lg">{unit}</span></p>
      </div>
      <Icon className="h-8 w-8" />
    </div>
  </motion.div>
);

const ChartCard = ({ title, children, icon: Icon }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
    >
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800">
            <Icon className="h-5 w-5 text-blue-500" />
            {title}
        </h3>
        {children}
    </motion.div>
);

const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const storedCompanies = JSON.parse(localStorage.getItem('turnosmart_companies')) || [];
    setCompanies(storedCompanies);
  }, []);

  const stats = useMemo(() => {
    const totalCompanies = companies.length;
    const activeLicenses = companies.filter(c => c.status === 'activo').length;
    
    const revenue = companies.reduce((acc, company) => {
        (company.payments || []).forEach(p => {
            if (p.status === 'paid') {
                acc.paid += p.amount;
            } else {
                acc.pending += p.amount;
            }
        });
        return acc;
    }, { paid: 0, pending: 0 });

    const statusCounts = companies.reduce((acc, company) => {
        acc[company.status] = (acc[company.status] || 0) + 1;
        return acc;
    }, {});
    
    const planTypeCounts = companies.reduce((acc, company) => {
        const type = company.paymentFrequency === 'monthly' ? 'Cuotas' : 'De Contado';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    return { totalCompanies, activeLicenses, revenue, statusCounts, planTypeCounts };
  }, [companies]);

  const licensesExpiringSoon = useMemo(() => {
    const today = new Date();
    return companies
      .filter(c => {
        if (!c.licenseExpiry || !c.expiryAlertDays) return false;
        const alertDate = addDays(new Date(c.licenseExpiry), -c.expiryAlertDays);
        return isBefore(alertDate, today) && isBefore(today, new Date(c.licenseExpiry));
      })
      .sort((a, b) => new Date(a.licenseExpiry) - new Date(b.licenseExpiry));
  }, [companies]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Dashboard Ejecutivo</h2>
        <p className="text-slate-500">Resumen del estado del negocio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Empresas" value={stats.totalCompanies} icon={Building} color="bg-blue-100 text-blue-800" />
        <StatCard title="Licencias Activas" value={stats.activeLicenses} icon={ShieldCheck} color="bg-cyan-100 text-cyan-800" />
        <StatCard title="Ingresos" value={stats.revenue.paid.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })} icon={DollarSign} color="bg-green-100 text-green-800" />
        <StatCard title="Cuentas por Cobrar" value={stats.revenue.pending.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })} icon={TrendingUp} color="bg-yellow-100 text-yellow-800" />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Licencias por Estado" icon={PieChart}>
                <div className="space-y-2">
                    {Object.entries(stats.statusCounts).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                            <span className="capitalize text-slate-600">{status}</span>
                            <span className="font-bold text-slate-800">{count}</span>
                        </div>
                    ))}
                </div>
            </ChartCard>
            <ChartCard title="Planes por Modalidad" icon={PieChart}>
                 <div className="space-y-2">
                    {Object.entries(stats.planTypeCounts).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                            <span className="capitalize text-slate-600">{type}</span>
                            <span className="font-bold text-slate-800">{count}</span>
                        </div>
                    ))}
                </div>
            </ChartCard>
       </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Licencias por Vencer (Próximos 60 días)
        </h3>
        <div className="space-y-3">
          {licensesExpiringSoon.length > 0 ? licensesExpiringSoon.map(company => (
            <div key={company.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
              <div>
                <p className="font-medium text-slate-700">{company.name}</p>
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Vence el: {format(new Date(company.licenseExpiry), 'dd/MM/yyyy')}
                </p>
              </div>
              <Badge variant={company.status === 'activo' ? 'success' : 'warning'} className="capitalize">{company.status}</Badge>
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