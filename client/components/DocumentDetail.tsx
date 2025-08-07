import React from "react";
import { X, Calendar, User, FileText, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-900">
            Document Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <p className="text-xs text-gray-500">No Agenda</p>
            <p className="text-sm font-medium text-gray-900">
              {document.agendaNo}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Perihal</p>
            <p className="text-sm text-gray-900">{document.perihal}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Sender</p>
            <p className="text-sm text-gray-900">{document.sender}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Current Status</p>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                document.currentStatus?.toLowerCase() === "signed"
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {document.currentStatus || "Unknown"}
            </span>
          </div>

          {document.currentRecipient && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Location</p>
              <p className="text-sm font-medium text-gray-900">
                {document.currentRecipient}
              </p>
            </div>
          )}

          {/* Expedition History */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Expedition History
            </h3>
            {document.expeditionHistory &&
            document.expeditionHistory.length > 0 ? (
              <div className="space-y-4">
                {document.expeditionHistory.map((entry, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {entry.recipient}
                        </p>
                        <p className="text-xs text-gray-500">
                          {/* The timestamp is now just YYYY-MM-DD string */}
                          {format(new Date(entry.timestamp), "d MMM yyyy", {
                            locale: id,
                          })}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        #{index + 1}
                      </span>
                    </div>
                    {entry.notes && (
                      <div className="mt-2 text-xs text-gray-700 bg-white p-2 rounded whitespace-pre-wrap border">
                        {entry.notes}
                      </div>
                    )}
                    {entry.signature && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">
                          Signature:
                        </p>
                        <div className="border border-gray-200 rounded-md p-1 bg-white flex justify-center">
                          <img
                            src={entry.signature}
                            alt={`Signature from ${entry.recipient}`}
                            className="max-w-full h-20 object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No expedition history.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
