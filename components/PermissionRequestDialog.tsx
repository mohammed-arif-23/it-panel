'use client';

import React, { useState, useEffect } from 'react';
import { permissionManager, PermissionRequest, PermissionStatus } from '@/lib/permissionManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PermissionRequestDialogProps {
  isOpen: boolean;
  onComplete: (status: PermissionStatus) => void;
}

export function PermissionRequestDialog({ isOpen, onComplete }: PermissionRequestDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [status, setStatus] = useState<PermissionStatus>({
    notifications: 'unknown',
    filesystem: 'unknown',
    camera: 'unknown',
    localNotifications: 'unknown'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const permissionRequests = permissionManager.getPermissionRequests();
      setPermissions(permissionRequests);
      setCurrentStep(0);
      setShowSummary(false);
    }
  }, [isOpen]);

  const handleRequestPermission = async (permission: PermissionRequest) => {
    setIsLoading(true);
    try {
      const result = await permissionManager.requestPermission(permission.type);
      setStatus(prev => ({ ...prev, [permission.type]: result }));
      
      // Setup specific features after permission is granted
      if (result === 'granted') {
        if (permission.type === 'notifications' || permission.type === 'localNotifications') {
          await permissionManager.setupNotifications();
        } else if (permission.type === 'filesystem') {
          await permissionManager.setupFileSystem();
        }
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setStatus(prev => ({ ...prev, [permission.type]: 'denied' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < permissions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleSkip = () => {
    const currentPermission = permissions[currentStep];
    setStatus(prev => ({ ...prev, [currentPermission.type]: 'denied' }));
    handleNext();
  };

  const handleComplete = async () => {
    await permissionManager.markPermissionsRequested();
    await permissionManager.markFirstLaunchCompleted();
    onComplete(status);
  };

  const getStatusIcon = (permissionStatus: string) => {
    switch (permissionStatus) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (permissionStatus: string) => {
    switch (permissionStatus) {
      case 'granted':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!isOpen) return null;

  if (showSummary) {
    const grantedCount = Object.values(status).filter(s => s === 'granted').length;
    const totalCount = permissions.length;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Setup Complete!</CardTitle>
            <CardDescription>
              {grantedCount} of {totalCount} permissions granted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {permissions.map((permission) => (
                <div key={permission.type} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{permission.icon}</span>
                    <span className="font-medium">{permission.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status[permission.type])}
                    <Badge className={getStatusColor(status[permission.type])}>
                      {status[permission.type]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Notifications will keep you updated on assignments</li>
                <li>• File downloads will save to your device storage</li>
                <li>• Camera access enables profile photos and assignments</li>
                <li>• You can change these permissions anytime in settings</li>
              </ul>
            </div>

            <Button onClick={handleComplete} className="w-full">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPermission = permissions[currentStep];
  if (!currentPermission) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">{currentPermission.icon}</div>
          <CardTitle className="text-xl">{currentPermission.title}</CardTitle>
          <CardDescription>{currentPermission.description}</CardDescription>
          <div className="flex justify-center mt-2">
            <Badge variant="outline">
              {currentStep + 1} of {permissions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPermission.required && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Required Permission</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                This permission is required for the app to function properly.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => handleRequestPermission(currentPermission)}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                'Allow'
              )}
            </Button>
            
            {!currentPermission.required && (
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
                className="flex-1"
              >
                Skip
              </Button>
            )}
          </div>

          <div className="flex justify-center">
            <div className="flex gap-1">
              {permissions.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === currentStep
                      ? 'bg-blue-500'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
