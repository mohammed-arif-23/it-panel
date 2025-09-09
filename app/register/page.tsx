import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎓 Department of Information Technology
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Student Information System
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <Card className="bg-white shadow-2xl border-2 border-red-200">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Registration Disabled</h2>
                  <p className="text-gray-600 text-sm mt-1">New user registration is currently not available</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-800 mb-2">Registration Closed</h3>
                <p className="text-gray-600 mb-4">
                  New user registration has been disabled. Only existing students can log in to the system.
                </p>
                <p className="text-sm text-gray-500">
                  If you need access to the system, please contact your administrator.
                </p>
              </div>
              
              <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}