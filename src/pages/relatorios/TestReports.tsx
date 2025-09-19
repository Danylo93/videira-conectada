// Test page to verify reports functionality
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReportForm from '@/components/reports/ReportForm';
import CultoForm from '@/components/reports/CultoForm';
import LostMemberForm from '@/components/reports/LostMemberForm';
import { CreateCultoData, CreateLostMemberData, CreateReportData } from '@/types/reports';

const TestReports: React.FC = () => {
  const [showReportForm, setShowReportForm] = useState(false);
  const [showCultoForm, setShowCultoForm] = useState(false);
  const [showLostMemberForm, setShowLostMemberForm] = useState(false);

  const handleCreateReport = async (data: CreateReportData) => {
    console.log('Creating report:', data);
    setShowReportForm(false);
  };

  const handleCreateCulto = async (data: CreateCultoData) => {
    console.log('Creating culto:', data);
    setShowCultoForm(false);
  };

  const handleCreateLostMember = async (data: CreateLostMemberData) => {
    console.log('Creating lost member:', data);
    setShowLostMemberForm(false);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Test Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Test Report Form</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowReportForm(true)}>
              Open Report Form
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Culto Form</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowCultoForm(true)}>
              Open Culto Form
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Lost Member Form</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowLostMemberForm(true)}>
              Open Lost Member Form
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <Dialog open={showReportForm} onOpenChange={setShowReportForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Report Form</DialogTitle>
          </DialogHeader>
          <ReportForm
            onSubmit={handleCreateReport}
            onCancel={() => setShowReportForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCultoForm} onOpenChange={setShowCultoForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Culto Form</DialogTitle>
          </DialogHeader>
          <CultoForm
            onSubmit={handleCreateCulto}
            onCancel={() => setShowCultoForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showLostMemberForm} onOpenChange={setShowLostMemberForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Lost Member Form</DialogTitle>
          </DialogHeader>
          <LostMemberForm
            onSubmit={handleCreateLostMember}
            onCancel={() => setShowLostMemberForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestReports;
