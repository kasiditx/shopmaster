import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/authSlice';

const LoginForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear auth error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await dispatch(login(formData));
    
    if (login.fulfilled.match(result)) {
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
          📧 Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
            validationErrors.email
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500/20'
          } focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={loading}
        />
        {validationErrors.email && (
          <p className="mt-2 text-sm text-red-600 font-medium flex items-center space-x-1">
            <span>⚠️</span>
            <span>{validationErrors.email}</span>
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-2">
          🔒 Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
            validationErrors.password
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500/20'
          } focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={loading}
        />
        {validationErrors.password && (
          <p className="mt-2 text-sm text-red-600 font-medium flex items-center space-x-1">
            <span>⚠️</span>
            <span>{validationErrors.password}</span>
          </p>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-scale-in">
          <p className="text-red-800 font-medium flex items-center space-x-2">
            <span className="text-xl">❌</span>
            <span>{error}</span>
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 px-6 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? (
          <span className="flex items-center justify-center space-x-2">
            <span className="animate-spin">⏳</span>
            <span>Logging in...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-2">
            <span>🚀</span>
            <span>Login</span>
          </span>
        )}
      </button>

      {/* Forgot Password */}
      <div className="text-center">
        <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Forgot your password?
        </a>
      </div>
    </form>
  );
};

export default LoginForm;
