import EnhancedRegistration from '../../components/EnhancedRegistration';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎓 Unified College Application
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join our unified college application system with advanced security features, 
            duplicate detection, and email verification to ensure a secure registration process.
          </p>
        </div>
        
        <EnhancedRegistration />
        
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <a 
              href="/" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}