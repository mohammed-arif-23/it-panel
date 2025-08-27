'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, GraduationCap, Loader2, CheckCircle, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import Alert from '@/components/ui/alert';

interface DuplicateDetection {
  type: string;
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

interface RegistrationData {
  registerNumber: string;
  name: string;
  email: string;
  mobile: string;
  classYear: string;
}

export default function EnhancedRegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegistrationData>({
    registerNumber: '',
    name: '',
    email: '',
    mobile: '',
    classYear: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateDetection[]>([]);
  const [browserFingerprint, setBrowserFingerprint] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('');
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);

  // Generate browser fingerprint and device info
  useEffect(() => {
    const generateFingerprint = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);
      }
      
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas: canvas.toDataURL(),
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack
      };
      
      setBrowserFingerprint(btoa(JSON.stringify(fingerprint)));
    };

    const generateDeviceInfo = () => {
      const info = {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screen: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        timestamp: new Date().toISOString()
      };
      
      setDeviceInfo(btoa(JSON.stringify(info)));
    };

    generateFingerprint();
    generateDeviceInfo();
  }, []);

  // Validate register number format
  const validateRegisterNumber = (regNum: string) => {
    if (regNum.length !== 12) return false;
    if (!/^\d{12}$/.test(regNum)) return false;
    
    // IT department validation (year + college code + department + roll number)
    const year = regNum.substring(0, 2);
    const collegeCode = regNum.substring(2, 5);
    const deptCode = regNum.substring(5, 8);
    
    // Check if it's IT department (typically 105 for IT in many colleges)
    return deptCode === '105';
  };

  // Check for duplicates
  const checkDuplicates = async () => {
    if (!formData.registerNumber || !formData.email) return;

    setIsCheckingDuplicates(true);
    setDuplicateWarnings([]);

    try {
      const response = await fetch('/api/auth/duplicate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registerNumber: formData.registerNumber,
          email: formData.email,
          mobile: formData.mobile,
          name: formData.name
        })
      });

      const result = await response.json();
      
      if (result.hasDuplicates) {
        setDuplicateWarnings(result.detections || []);
        if (result.recommendation === 'block_registration') {
          setError('Registration cannot proceed due to duplicate information detected. Please contact administration.');
        }
      }
    } catch (error) {
      console.error('Duplicate check error:', error);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    
    // Clear duplicate warnings when user changes data
    if (field === 'registerNumber' || field === 'email' || field === 'mobile') {
      setDuplicateWarnings([]);
    }
  };

  // Handle register number change with validation
  const handleRegisterNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow digits
    if (value && !/^\d*$/.test(value)) return;
    
    // Limit to 12 digits
    if (value.length > 12) return;
    
    handleInputChange('registerNumber', value);
    
    // Validate IT department
    if (value.length === 12) {
      if (!validateRegisterNumber(value)) {
        setError('This registration system is only for IT department students');
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.registerNumber || !formData.name || !formData.email) {
        setError('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      // Validate register number
      if (!validateRegisterNumber(formData.registerNumber)) {
        setError('Invalid register number or not from IT department');
        setIsLoading(false);
        return;
      }

      // Check for high-severity duplicates
      const highSeverityDuplicates = duplicateWarnings.filter(w => w.severity === 'high');
      if (highSeverityDuplicates.length > 0) {
        setError('Cannot proceed with registration due to duplicate information detected');
        setIsLoading(false);
        return;
      }

      // Complete registration
      const response = await fetch('/api/auth/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registerNumber: formData.registerNumber,
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          mobile: formData.mobile?.trim(),
          classYear: formData.classYear?.trim(),
          browserFingerprint,
          deviceInfo
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push('/?registered=true');
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="bg-white shadow-2xl border-2 border-green-200">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">Registration Successful!</h2>
              <p className="text-gray-600">
                Your account has been created successfully. You will be redirected to the login page.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white shadow-2xl border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-gray-200">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Student Registration</h2>
              <p className="text-gray-600 font-medium mt-1">Create your account with enhanced security</p>
            </div>
          </CardTitle>
          <CardDescription className="flex items-center space-x-2 mt-4 text-blue-700 bg-blue-100 p-3 rounded-lg">
            <Shield className="h-5 w-5" />
            <span className="font-medium">Advanced duplicate detection and email verification enabled</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Register Number */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Register Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={12}
                value={formData.registerNumber}
                onChange={handleRegisterNumberChange}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                placeholder="Enter your 12-digit register number"
              />
              <p className="text-xs text-gray-600 mt-2">Must be a valid IT department register number</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={checkDuplicates}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                placeholder="Enter your email address"
              />
              {isCheckingDuplicates && (
                <div className="flex items-center space-x-2 mt-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Checking for duplicates...</span>
                </div>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Mobile Number
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                placeholder="Enter your mobile number (optional)"
              />
            </div>

            {/* Class Year */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Class/Year
              </label>
              <select
                value={formData.classYear}
                onChange={(e) => handleInputChange('classYear', e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
              >
                <option value="">Select your class/year</option>
                <option value="I Year">I Year</option>
                <option value="II Year">II Year</option>
                <option value="III Year">III Year</option>
                <option value="IV Year">IV Year</option>
              </select>
            </div>

            {/* Duplicate Warnings */}
            {duplicateWarnings.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <h4 className="font-bold text-amber-800">Duplicate Information Detected</h4>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDuplicateDetails(!showDuplicateDetails)}
                    className="text-amber-700 hover:text-amber-900"
                  >
                    {showDuplicateDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {showDuplicateDetails && (
                  <div className="space-y-2">
                    {duplicateWarnings.map((warning, index) => (
                      <div key={index} className="text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                          warning.severity === 'high' ? 'bg-red-100 text-red-800' :
                          warning.severity === 'medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {warning.severity.toUpperCase()}
                        </span>
                        <span className="text-gray-700">{warning.message}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-amber-700 mt-3">
                  If you believe this is an error, please contact the administration.
                </p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert 
                variant="error" 
                message={error}
                className="border-red-200 bg-red-50"
              />
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isLoading || duplicateWarnings.some(w => w.severity === 'high')}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>Create Account</span>
                </div>
              )}
            </Button>

            {/* Security Notice */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                This registration process includes advanced security features including duplicate detection,
                device fingerprinting, and email verification to ensure account security.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}