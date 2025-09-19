// Enhanced Reports System - Contact Attempts Component
// Component for managing contact attempts with lost members

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Phone, MessageSquare, Mail, Home, FileText, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LostMember, ContactAttempt, CreateContactAttemptData } from '@/types/reports';

interface ContactAttemptsProps {
  lostMember: LostMember;
  attempts: ContactAttempt[];
  onAddAttempt: (data: CreateContactAttemptData) => void;
  onUpdateAttempt: (id: string, data: Partial<CreateContactAttemptData>) => void;
  onDeleteAttempt: (id: string) => void;
  loading?: boolean;
}

const ContactAttempts: React.FC<ContactAttemptsProps> = ({
  lostMember,
  attempts,
  onAddAttempt,
  onUpdateAttempt,
  onDeleteAttempt,
  loading = false
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAttempt, setEditingAttempt] = useState<ContactAttempt | null>(null);
  const [contactDate, setContactDate] = useState<Date | undefined>(new Date());
  const [contactTime, setContactTime] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const [formData, setFormData] = useState<CreateContactAttemptData>({
    lost_member_id: lostMember.id,
    contact_method: 'phone',
    contact_date: new Date().toISOString().split('T')[0],
    contact_time: '',
    success: false,
    response: 'no_answer',
    notes: '',
    next_contact_date: undefined
  });

  const contactMethods = [
    { value: 'phone', label: 'Telefone', icon: Phone },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'visit', label: 'Visita', icon: Home },
    { value: 'letter', label: 'Carta', icon: FileText },
    { value: 'other', label: 'Outros', icon: MessageSquare }
  ];

  const responseOptions = [
    { value: 'answered', label: 'Atendeu' },
    { value: 'no_answer', label: 'Não atendeu' },
    { value: 'busy', label: 'Ocupado' },
    { value: 'refused', label: 'Recusou' },
    { value: 'wrong_number', label: 'Número errado' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      contact_date: contactDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      contact_time: contactTime || undefined,
      next_contact_date: formData.next_contact_date ? new Date(formData.next_contact_date).toISOString().split('T')[0] : undefined
    };

    if (editingAttempt) {
      onUpdateAttempt(editingAttempt.id, data);
      setEditingAttempt(null);
    } else {
      onAddAttempt(data);
    }

    // Reset form
    setFormData({
      lost_member_id: lostMember.id,
      contact_method: 'phone',
      contact_date: new Date().toISOString().split('T')[0],
      contact_time: '',
      success: false,
      response: 'no_answer',
      notes: '',
      next_contact_date: undefined
    });
    setContactDate(new Date());
    setContactTime('');
    setShowAddForm(false);
  };

  const getMethodIcon = (method: string) => {
    const methodInfo = contactMethods.find(m => m.value === method);
    return methodInfo ? methodInfo.icon : MessageSquare;
  };

  const getMethodLabel = (method: string) => {
    const methodInfo = contactMethods.find(m => m.value === method);
    return methodInfo ? methodInfo.label : method;
  };

  const getResponseColor = (response: string) => {
    switch (response) {
      case 'answered': return 'text-green-600';
      case 'no_answer': return 'text-yellow-600';
      case 'busy': return 'text-orange-600';
      case 'refused': return 'text-red-600';
      case 'wrong_number': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tentativas de Contato</h3>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Tentativa
        </Button>
      </div>

      {/* Contact Attempts List */}
      <div className="space-y-3">
        {attempts.map((attempt) => {
          const MethodIcon = getMethodIcon(attempt.contact_method);
          return (
            <Card key={attempt.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <MethodIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{getMethodLabel(attempt.contact_method)}</span>
                        <span className={`text-sm ${getResponseColor(attempt.response || '')}`}>
                          {responseOptions.find(r => r.value === attempt.response)?.label || attempt.response}
                        </span>
                        {attempt.success && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Sucesso
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(attempt.contact_date), 'dd/MM/yyyy', { locale: ptBR })}
                        {attempt.contact_time && ` às ${attempt.contact_time}`}
                      </p>
                      {attempt.notes && (
                        <p className="text-sm text-gray-700 mt-2">{attempt.notes}</p>
                      )}
                      {attempt.next_contact_date && (
                        <p className="text-xs text-blue-600 mt-1">
                          Próximo contato: {format(new Date(attempt.next_contact_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingAttempt(attempt)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteAttempt(attempt.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Form Dialog */}
      <Dialog open={showAddForm || !!editingAttempt} onOpenChange={(open) => {
        if (!open) {
          setShowAddForm(false);
          setEditingAttempt(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAttempt ? 'Editar Tentativa de Contato' : 'Nova Tentativa de Contato'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_method">Método de Contato</Label>
                <Select
                  value={formData.contact_method}
                  onValueChange={(value) => setFormData({ ...formData, contact_method: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex items-center space-x-2">
                          <method.icon className="h-4 w-4" />
                          <span>{method.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_date">Data do Contato</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !contactDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {contactDate ? format(contactDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={contactDate}
                      onSelect={(date) => {
                        setContactDate(date);
                        setFormData({ ...formData, contact_date: date?.toISOString().split('T')[0] || '' });
                        setShowCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_time">Horário (Opcional)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="contact_time"
                    type="time"
                    className="pl-10"
                    value={contactTime}
                    onChange={(e) => setContactTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="response">Resposta</Label>
                <Select
                  value={formData.response}
                  onValueChange={(value) => setFormData({ ...formData, response: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a resposta" />
                  </SelectTrigger>
                  <SelectContent>
                    {responseOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Descreva o que foi conversado ou observado..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_contact_date">Próximo Contato (Opcional)</Label>
              <Input
                id="next_contact_date"
                type="date"
                value={formData.next_contact_date || ''}
                onChange={(e) => setFormData({ ...formData, next_contact_date: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="success"
                checked={formData.success}
                onChange={(e) => setFormData({ ...formData, success: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="success" className="text-sm">
                Contato bem-sucedido
              </Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAttempt(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {editingAttempt ? 'Atualizar' : 'Adicionar'} Tentativa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactAttempts;
