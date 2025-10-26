import type { Grant } from '../types';
import { STATUS_COLORS } from '../config/constants';

interface GrantsListProps {
  grants: Grant[];
}

export function GrantsList({ grants }: GrantsListProps) {
  return (
    <div>
      {/* Styling  */}
      <h2 className="text-2xl font-bold text-white mb-6">My Grants</h2>
      
      {/* Grid layout */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {grants.map((grant) => (
          <div 
            key={grant.id} 
            // Card styling 
            className="bg-dark-card rounded-lg shadow-lg border border-gray-700 p-6 hover:border-accent/50 transition-colors flex flex-col"
          >
            {/* Header layout and styling*/}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-white truncate">{grant.grantName}</h3>
                <p className="text-sm text-gray-400">{grant.grantNumber}</p>
              </div>
              
              {/* Status Badge */}
              <span 
                className={`flex-shrink-0 ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                  STATUS_COLORS[grant.status] || 'bg-gray-700 text-gray-300' 
                }`}
              >
                {grant.status}
              </span>
            </div>
            
            {/* Financial Details */}
            <div className="space-y-2 text-sm flex-grow">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Amount:</span>
                <span className="font-semibold text-white">
                  ${parseFloat(grant.totalAmount.toString()).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Remaining:</span>
                <span className="font-semibold text-accent">
                  ${parseFloat(grant.remainingAmount.toString()).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Student Balance:</span>
                <span className="font-semibold text-white">
                  ${parseFloat(grant.studentBalance.toString()).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Travel Balance:</span>
                <span className="font-semibold text-white">
                  ${parseFloat(grant.travelBalance.toString()).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="text-gray-300">Period:</span>
                <span className="text-white text-xs">
                  {new Date(grant.startDate).toLocaleDateString()} - {new Date(grant.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {grant.description && (
              <p className="mt-4 text-sm text-gray-300 border-t border-gray-700 pt-3">{grant.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}