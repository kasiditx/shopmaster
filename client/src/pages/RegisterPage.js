import { useNavigate, Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent mb-2">
            ShopMaster
          </h1>
          <p className="text-gray-600">Join us and start shopping today!</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-3xl shadow-strong p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600 text-sm">Sign up to get started with exclusive deals</p>
          </div>

          <RegisterForm onSuccess={handleSuccess} />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="block w-full py-3 px-4 text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-primary-500 transition-all"
          >
            Sign In Instead
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By signing up, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Terms</a>
          {' '}and{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
