import { LoginForm } from './login-form';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-center">
            <div className="h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Panel
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Politics and War Alliance Management System
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}