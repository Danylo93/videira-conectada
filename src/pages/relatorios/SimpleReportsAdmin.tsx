// Simple Reports Admin for testing
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import TestReportForm from '@/components/reports/TestReportForm';

const SimpleReportsAdmin: React.FC = () => {
  const { user } = useAuth();
  const [showReportForm, setShowReportForm] = useState(false);

  const handleCreateReport = async (data: any) => {
    console.log('Creating report:', data);
    setShowReportForm(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios Simples</h1>
          <p className="text-gray-600">Teste das funcionalidades básicas</p>
        </div>
        <Button onClick={() => setShowReportForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Gerencie relatórios da igreja</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cultos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Controle de cultos e presenças</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membros Perdidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Acompanhamento de membros perdidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <Dialog open={showReportForm} onOpenChange={setShowReportForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Relatório</DialogTitle>
          </DialogHeader>
          <TestReportForm
            onSubmit={handleCreateReport}
            onCancel={() => setShowReportForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimpleReportsAdmin;
