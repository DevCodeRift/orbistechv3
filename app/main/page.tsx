export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            OrbistechV3
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Multi-tenant Politics and War alliance management system with Discord integration
          </p>
          <div className="space-x-4">
            <a
              href="https://admin.orbistech.dev"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Admin Dashboard
            </a>
            <a
              href="#features"
              className="inline-block border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        <div id="features" className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-4">Multi-Tenant</h3>
            <p className="text-gray-600">
              Isolated alliance management with dedicated subdomains and Discord bots
            </p>
          </div>
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-4">Discord Integration</h3>
            <p className="text-gray-600">
              Full Discord OAuth and bot integration for seamless member management
            </p>
          </div>
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-4">P&W API</h3>
            <p className="text-gray-600">
              Real-time Politics and War data synchronization and analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}