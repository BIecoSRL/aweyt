import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, FileText, CheckCircle, Building, Printer, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const IndependentInvoiceForm = ({ onSave, companies, systemSettings }) => {
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [items, setItems] = useState([{ description: '', quantity: 1, price: 0 }]);
    const { toast } = useToast();

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { description: '', quantity: 1, price: 0 }]);
    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    const generateInvoice = () => {
        if (!selectedCompanyId) {
            toast({ variant: 'destructive', title: 'Seleccione una empresa' });
            return;
        }
        const company = companies.find(c => c.id.toString() === selectedCompanyId);
        const doc = new jsPDF();
        
        if (systemSettings.logo) {
            doc.addImage(systemSettings.logo, 'PNG', 14, 10, 30, 30);
        }
        doc.setFontSize(22);
        doc.text(systemSettings.name || 'Aweyt', 50, 25);
        
        doc.setFontSize(12);
        doc.text(`Factura para: ${company.name}`, 14, 50);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 50);

        const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

        doc.autoTable({
            startY: 70,
            head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Total']],
            body: items.map(item => [item.description, item.quantity, item.price.toFixed(2), (item.quantity * item.price).toFixed(2)]),
            foot: [['', '', 'Total a Pagar', `${total.toFixed(2)}`]]
        });

        doc.save(`factura-manual-${company.name.replace(/\s/g, '_')}.pdf`);
        toast({ title: "Factura Manual Generada", description: `Se ha descargado la factura para ${company.name}.` });
        onSave();
    };

    return (
        <div className="space-y-4 py-4">
            <Select onValueChange={setSelectedCompanyId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>

            {items.map((item, index) => (
                <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                    <div className="grid grid-cols-3 gap-2 flex-1">
                        <div className="col-span-3 md:col-span-1"><Label>Descripción</Label><Input value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} /></div>
                        <div><Label>Cantidad</Label><Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)} /></div>
                        <div><Label>Precio</Label><Input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)} /></div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>&times;</Button>
                </div>
            ))}
            <Button variant="outline" onClick={addItem}>Añadir Item</Button>
            <Button onClick={generateInvoice} className="w-full">Generar Factura</Button>
        </div>
    );
};

const Finance = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [systemSettings, setSystemSettings] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const storedCompanies = JSON.parse(localStorage.getItem('aweyt_companies')) || [];
    setCompanies(storedCompanies);
    const storedSettings = JSON.parse(localStorage.getItem('aweyt_system_settings')) || {};
    setSystemSettings(storedSettings);
  }, []);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const generateInvoice = (company, payment) => {
    const doc = new jsPDF();
    
    if (systemSettings.logo) {
      doc.addImage(systemSettings.logo, 'PNG', 14, 10, 30, 30);
    }
    doc.setFontSize(22);
    doc.text(systemSettings.name || 'Aweyt', 50, 25);
    
    doc.setFontSize(12);
    doc.text(`Factura para: ${company.name}`, 14, 50);
    doc.text(`Dirección: ${company.address}`, 14, 56);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 50);
    doc.text(`Factura #: ${payment.id}`, 150, 56);

    doc.autoTable({
      startY: 70,
      head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Total']],
      body: [
        [
          `Cuota de Licencia Aweyt`,
          '1',
          `${payment.amount.toFixed(2)} ${company.currency}`,
          `${payment.amount.toFixed(2)} ${company.currency}`
        ]
      ],
      foot: [
        ['', '', 'Total a Pagar', `${payment.amount.toFixed(2)} ${company.currency}`]
      ]
    });

    const finalY = doc.lastAutoTable.finalY || 120;
    doc.setFontSize(10);
    doc.text('Información de Pago:', 14, finalY + 10);
    (systemSettings.bankAccounts || []).forEach((acc, index) => {
        doc.text(`${acc.bankName}: ${acc.accountNumber} (${acc.accountType})`, 14, finalY + 16 + (index * 6));
    });

    doc.save(`factura-${company.name.replace(/\s/g, '_')}-${payment.id}.pdf`);
    toast({ title: "Factura Generada", description: `Se ha descargado la factura para ${company.name}.` });
  };

  const generateStatement = (company) => {
    const doc = new jsPDF();
    
    if (systemSettings.logo) {
      doc.addImage(systemSettings.logo, 'PNG', 14, 10, 30, 30);
    }
    doc.setFontSize(22);
    doc.text(systemSettings.name || 'Aweyt', 50, 25);

    doc.setFontSize(16);
    doc.text(`Estado de Cuenta: ${company.name}`, 14, 50);
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 56);

    const tableBody = (company.payments || []).map((p, i) => [
      `Cuota ${i + 1}`,
      new Date(p.dueDate).toLocaleDateString(),
      `${p.amount.toFixed(2)} ${company.currency}`,
      p.status === 'paid' ? 'Pagado' : 'Pendiente'
    ]);

    doc.autoTable({
      startY: 70,
      head: [['Concepto', 'Fecha de Vencimiento', 'Monto', 'Estado']],
      body: tableBody,
    });

    const totalDue = (company.payments || []).filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
    const finalY = doc.lastAutoTable.finalY || 120;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Pendiente: ${totalDue.toFixed(2)} ${company.currency}`, 14, finalY + 10);

    doc.save(`estado-cuenta-${company.name.replace(/\s/g, '_')}.pdf`);
    toast({ title: "Estado de Cuenta Generado", description: `Se ha descargado el estado de cuenta para ${company.name}.` });
  };

  const markAsPaid = (companyId, paymentId) => {
    const updatedCompanies = companies.map(company => {
      if (company.id === companyId) {
        const updatedPayments = company.payments.map(p => {
          if (p.id === paymentId) {
            return { ...p, status: 'paid' };
          }
          return p;
        });
        return { ...company, payments: updatedPayments };
      }
      return company;
    });
    localStorage.setItem('aweyt_companies', JSON.stringify(updatedCompanies));
    setCompanies(updatedCompanies);
    toast({ title: "Pago Registrado", description: "El estado del pago ha sido actualizado a 'Pagado'." });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Facturación y Cobros</h2>
         <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Factura Manual</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Factura Independiente</DialogTitle>
                </DialogHeader>
                <IndependentInvoiceForm onSave={() => {}} companies={companies} systemSettings={systemSettings} />
            </DialogContent>
        </Dialog>
      </div>

       <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Label>Seleccionar Empresa para Ver Estado de Cuenta</Label>
            <Select onValueChange={(val) => setSelectedCompanyId(parseInt(val, 10))}>
                <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione una empresa..." />
                </SelectTrigger>
                <SelectContent>
                    {companies.map(company => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>


      {selectedCompany && (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
            <div className="p-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-lg">
                    <Building className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{selectedCompany.name}</p>
                    <p className="text-sm text-slate-500">
                      Total Plan: {selectedCompany.totalCost?.toFixed(2) || selectedCompany.cost} {selectedCompany.currency}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => generateStatement(selectedCompany)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Estado de Cuenta
                </Button>
              </div>
              <div className="mt-4 pl-4 border-l-2 border-slate-200 space-y-2">
                {(selectedCompany.payments || []).map((payment, pIndex) => (
                  <div key={payment.id} className="flex justify-between items-center p-2 rounded-md bg-slate-50">
                    <div>
                      <p className="font-medium text-sm">Cuota {pIndex + 1} - Vence: {new Date(payment.dueDate).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500">Monto: {payment.amount.toFixed(2)} {selectedCompany.currency}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={payment.status === 'paid' ? 'success' : 'warning'}>{payment.status === 'paid' ? 'Pagado' : 'Pendiente'}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => generateInvoice(selectedCompany, payment)}><FileText className="h-4 w-4" /></Button>
                      <Button size="sm" onClick={() => markAsPaid(selectedCompany.id, payment.id)} disabled={payment.status === 'paid'}><CheckCircle className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                 {(selectedCompany.payments || []).length === 0 && <p className="text-center p-4 text-slate-500">No hay pagos registrados para esta empresa.</p>}
              </div>
            </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Finance;