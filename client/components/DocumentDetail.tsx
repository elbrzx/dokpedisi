import React from "react";
import { X, Calendar, User, FileText } from "lucide-react";
import { Document } from "../lib/documentStore";

interface DocumentDetailProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentDetail: React.FC<DocumentDetailProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-t-lg shadow-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Document Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Agenda Number */}
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-xs text-gray-500">Agenda Number</p>
              <p className="text-sm font-medium text-gray-900">{document.agendaNo}</p>
            </div>
          </div>
          
          {/* Subject */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Subject</p>
            <p className="text-sm text-gray-900">{document.subject}</p>
          </div>
          
          {/* Sender */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Sender</p>
            <p className="text-sm text-gray-900">{document.sender}</p>
          </div>
          
          {/* Status */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              document.position === 'Pending' 
                ? 'bg-orange-100 text-orange-800'
                : document.position === 'Approved'
                ? 'bg-green-100 text-green-800'
                : document.position === 'In Review'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {document.position}
            </span>
          </div>
          
          {/* Date Created */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Date Created</p>
              <p className="text-sm text-gray-900">
                {new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(document.createdAt)}
              </p>
            </div>
          </div>
          
          {/* Expedition Details */}
          {document.expeditionData && (
            <>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Expedition Details</h3>
                
                {/* Date Received */}
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Date & Time Received</p>
                    <p className="text-sm text-gray-900">
                      {new Intl.DateTimeFormat("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }).format(document.expeditionData.date)} at {document.expeditionData.time}
                    </p>
                  </div>
                </div>
                
                {/* Recipient */}
                <div className="flex items-center gap-3 mb-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Recipient</p>
                    <p className="text-sm text-gray-900">{document.expeditionData.recipient}</p>
                  </div>
                </div>
                
                {/* Notes */}
                {document.expeditionData.notes && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-900">{document.expeditionData.notes}</p>
                  </div>
                )}
                
                {/* Signature */}
                {document.expeditionData.signature && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Signature</p>
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                      <img 
                        src={document.expeditionData.signature} 
                        alt="Signature"
                        className="max-w-full h-20 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
