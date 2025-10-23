//GrantsList Component - displays the grants view

import type { Grant } from '../types';
import { STATUS_COLORS } from '../config/constants';

interface GrantsListProps {
  grants: Grant[];
}

export function GrantsList({ grants }: GrantsListProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Grants</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {grants.map((grant) => (
          <div 
            key={grant.id} 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {grant.grantName}
                </h3>
                <p className="text-sm text-gray-500">{grant.grantNumber}</p>
              </div>
              <span 
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  STATUS_COLORS[grant.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {grant.status}
              </span>
            </div>
            
            {/* Financial Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold text-gray-900">
                  ${parseFloat(grant.totalAmount.toString()).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining:</span>
                <span className="font-semibold text-indigo-600">
                  ${parseFloat(grant.remainingAmount.toString()).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Student Balance:</span>
                <span className="font-semibold text-gray-900">
                  ${parseFloat(grant.studentBalance.toString()).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Travel Balance:</span>
                <span className="font-semibold text-gray-900">
                  ${parseFloat(grant.travelBalance.toString()).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">Period:</span>
                <span className="text-gray-900">
                  {new Date(grant.startDate).toLocaleDateString()} - {new Date(grant.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Description */}
            {grant.description && (
              <p className="mt-4 text-sm text-gray-600 border-t pt-3">
                {grant.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}