'use client';

import React, { useState, useEffect } from 'react';
import { permissionManager, PermissionStatus } from '@/lib/permissionManager';
import { PermissionRequestDialog } from '@/components/PermissionRequestDialog';

export default function PermissionHandler() {
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const isFirst = await permissionManager.checkFirstLaunch();
      const hasRequested = await permissionManager.hasRequestedPermissions();
      
      if (isFirst || !hasRequested) {
        setIsFirstLaunch(true);
        setShowPermissionDialog(true);
      }
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const handlePermissionComplete = async (status: PermissionStatus) => {
    setShowPermissionDialog(false);
    console.log('Permissions granted:', status);
    
    // Log permission status for debugging
    const grantedPermissions = Object.entries(status)
      .filter(([_, value]) => value === 'granted')
      .map(([key, _]) => key);
    
    console.log('Successfully granted permissions:', grantedPermissions);
  };

  return (
    <PermissionRequestDialog
      isOpen={showPermissionDialog}
      onComplete={handlePermissionComplete}
    />
  );
}
