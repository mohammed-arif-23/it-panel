'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Plus, RefreshCw } from 'lucide-react';
import Alert from './ui/alert';

interface Holiday {
  id: string;
  holiday_name: string;
  holiday_date: string;
  holiday_type: string;
  affects_seminars: boolean;
}

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [holidayForm, setHolidayForm] = useState({
    holidayName: '',
    holidayDate: '',
    holidayType: 'national',
    affectsSeminars: true
  });

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/holidays');
      const data = await response.json();
      if (data.success) setHolidays(data.holidays);
    } catch (error) {
      setError('Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...holidayForm, createdBy: 'admin' })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Holiday added successfully');
        setShowForm(false);
        setHolidayForm({ holidayName: '', holidayDate: '', holidayType: 'national', affectsSeminars: true });
        fetchHolidays();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to add holiday');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Holiday Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Holiday
        </Button>
      </div>

      {error && <Alert variant="error" message={error} />}
      {success && <Alert variant="success" message={success} />}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Holiday</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Holiday Name</Label>
              <Input 
                value={holidayForm.holidayName} 
                onChange={(e) => setHolidayForm(prev => ({ ...prev, holidayName: e.target.value }))} 
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input 
                type="date" 
                value={holidayForm.holidayDate} 
                onChange={(e) => setHolidayForm(prev => ({ ...prev, holidayDate: e.target.value }))} 
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={holidayForm.holidayType} onValueChange={(value) => setHolidayForm(prev => ({ ...prev, holidayType: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">National Holiday</SelectItem>
                  <SelectItem value="emergency">Emergency Holiday</SelectItem>
                  <SelectItem value="unannounced">Unannounced Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddHoliday} disabled={loading}>
                {loading ? 'Adding...' : 'Add Holiday'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Holidays List
            </CardTitle>
            <Button onClick={fetchHolidays} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{holiday.holiday_name}</h3>
                    <p className="text-gray-600">
                      {new Date(holiday.holiday_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {holiday.holiday_type.replace('_', ' ')}
                      </span>
                      {holiday.affects_seminars && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Affects Seminars
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => {/* Add reschedule functionality */}}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reschedule
                  </Button>
                </div>
              </div>
            ))}
            {holidays.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No holidays found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}