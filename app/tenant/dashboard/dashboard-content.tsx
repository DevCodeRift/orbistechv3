'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Tenant } from '@orbistech/database';

interface DashboardContentProps {
  tenant: Tenant;
  session: any;
}

export function DashboardContent({ tenant, session }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const isAdmin = session.user.discordId === tenant.discordAdminId;

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'members', name: 'Members' },
    { id: 'wars', name: 'Wars' },
    { id: 'analytics', name: 'Analytics' },
    ...(isAdmin ? [{ id: 'settings', name: 'Settings' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">
                  {tenant.allianceName.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {tenant.allianceName}
                </h1>
                <p className="text-sm text-gray-500">
                  Alliance ID: {tenant.allianceId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500">
                  {session.user.role?.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-4 py-2 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab tenant={tenant} />}
        {activeTab === 'members' && <MembersTab tenant={tenant} />}
        {activeTab === 'wars' && <WarsTab tenant={tenant} />}
        {activeTab === 'analytics' && <AnalyticsTab tenant={tenant} />}
        {activeTab === 'settings' && isAdmin && <SettingsTab tenant={tenant} />}
      </div>
    </div>
  );
}

function OverviewTab({ tenant }: { tenant: Tenant }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Alliance Members
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Loading...
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">⚔️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Wars
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Loading...
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Score
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Loading...
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🏙️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Cities
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Loading...
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        <p className="text-gray-500">
          Activity tracking will be implemented once P&W API integration is complete.
        </p>
      </div>
    </div>
  );
}

function MembersTab({ tenant }: { tenant: Tenant }) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Alliance Members
        </h3>
      </div>
      <div className="p-6">
        <p className="text-gray-500">
          Member data will be loaded from the Politics and War API once the integration is complete.
        </p>
      </div>
    </div>
  );
}

function WarsTab({ tenant }: { tenant: Tenant }) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Wars & Conflicts
        </h3>
      </div>
      <div className="p-6">
        <p className="text-gray-500">
          War tracking data will be available once the P&W API integration is complete.
        </p>
      </div>
    </div>
  );
}

function AnalyticsTab({ tenant }: { tenant: Tenant }) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Alliance Analytics
        </h3>
      </div>
      <div className="p-6">
        <p className="text-gray-500">
          Analytics and reporting features will be implemented in the next phase.
        </p>
      </div>
    </div>
  );
}

function SettingsTab({ tenant }: { tenant: Tenant }) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Alliance Configuration
          </h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Alliance Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{tenant.allianceName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Alliance ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{tenant.allianceId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Subdomain</dt>
              <dd className="mt-1 text-sm text-gray-900">{tenant.subdomain}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  tenant.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {tenant.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">API Key Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  tenant.apiKeyEncrypted
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {tenant.apiKeyEncrypted ? 'Configured' : 'Not Set'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Discord Bot Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  tenant.discordBotTokenEncrypted
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {tenant.discordBotTokenEncrypted ? 'Configured' : 'Not Set'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Discord Bot Management
          </h3>
        </div>
        <div className="p-6">
          {tenant.discordBotTokenEncrypted ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Your Discord bot is configured and ready to be invited to your server.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Generate Bot Invite Link
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                No Discord bot token configured. You can add one in the setup page.
              </p>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Configure Discord Bot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}