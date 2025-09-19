// Enhanced Reports System - Report Approval Component
// Component for approving/rejecting reports

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Report } from '@/types/reports';

interface ReportApprovalProps {
  report: Report;
  onApprove: (reportId: string, feedback?: string) => void;
  onReject: (reportId: string, feedback: string) => void;
  loading?: boolean;
}

const ReportApproval: React.FC<ReportApprovalProps> = ({
  report,
  onApprove,
  onReject,
  loading = false
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const handleAction = (actionType: 'approve' | 'reject') => {
    setAction(actionType);
    if (actionType === 'reject') {
      setShowFeedback(true);
    } else {
      onApprove(report.id, feedback);
    }
  };

  const handleSubmitFeedback = () => {
    if (action === 'reject' && feedback.trim()) {
      onReject(report.id, feedback);
      setShowFeedback(false);
      setFeedback('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg capitalize">{report.report_type}</CardTitle>
            <p className="text-sm text-gray-600">
              Período: {format(new Date(report.period_start), 'dd/MM/yyyy', { locale: ptBR })} - 
              {format(new Date(report.period_end), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
              {report.status}
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Relatório - {report.report_type}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Período</Label>
                      <p className="text-sm text-gray-600">
                        {format(new Date(report.period_start), 'dd/MM/yyyy', { locale: ptBR })} - 
                        {format(new Date(report.period_end), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <p className="text-sm text-gray-600 capitalize">{report.status}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Criado em</Label>
                      <p className="text-sm text-gray-600">
                        {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    {report.submitted_at && (
                      <div>
                        <Label className="text-sm font-medium">Enviado em</Label>
                        <p className="text-sm text-gray-600">
                          {format(new Date(report.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {report.notes && (
                    <div>
                      <Label className="text-sm font-medium">Observações</Label>
                      <p className="text-sm text-gray-600">{report.notes}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium">Dados do Relatório</Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(report.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {report.notes && (
            <div>
              <Label className="text-sm font-medium">Observações</Label>
              <p className="text-sm text-gray-600 mt-1">{report.notes}</p>
            </div>
          )}

          {report.status === 'submitted' && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleAction('approve')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('reject')}
                disabled={loading}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
            </div>
          )}

          {report.status === 'rejected' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Rejeitado:</strong> Este relatório foi rejeitado e precisa de revisão.
              </p>
            </div>
          )}

          {report.status === 'approved' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Aprovado:</strong> Este relatório foi aprovado com sucesso.
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Relatório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="feedback">Motivo da Rejeição</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Explique o motivo da rejeição e o que precisa ser corrigido..."
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowFeedback(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={!feedback.trim() || loading}
                className="bg-red-600 hover:bg-red-700"
              >
                Rejeitar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ReportApproval;
