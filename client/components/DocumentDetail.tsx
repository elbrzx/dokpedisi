import React from "react";
import { X, Calendar, User, FileText, Clock, MapPin } from "lucide-react";
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

  const parseLastExpedition = (lastExpedition: string | undefined) => {
    if (!lastExpedition) {
      return { receivedDate: null, notes: null };
    }

    const parts = lastExpedition.split(". Catatan: ");
    const receivedDatePart = parts[0];
    const notes = parts[1] && parts[1] !== "-" ? parts[1] : null;

    const receivedDate = receivedDatePart.replace("Diterima pada ", "").trim();

    return { receivedDate, notes };
  };

  const { receivedDate, notes } = parseLastExpedition(document.lastExpedition);

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
          {/* Agenda Number */}
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-xs text-gray-500">Agenda Number</p>
              <p className="text-sm font-medium text-gray-900">
                {document.agendaNo}
              </p>
            </div>
          </div>

          {/* Perihal */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Perihal</p>
            <p className="text-sm text-gray-900">{document.perihal}</p>
          </div>

          {/* Sender */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Sender</p>
            <p className="text-sm text-gray-900">{document.sender}</p>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Current Status</p>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                document.signature
                  ? "bg-blue-100 text-blue-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {document.signature ? "Signed" : "Pending"}
            </span>
          </div>

          {/* Current Recipient */}
          {document.currentRecipient && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Location</p>
              <p className="text-sm font-medium text-gray-900">
                {document.currentRecipient}
              </p>
            </div>
          )}

          {/* Last Received Date */}
          {receivedDate && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Last Received</p>
              <p className="text-sm font-medium text-gray-900">
                {receivedDate}
              </p>
            </div>
          )}

          {/* Signature & Notes */}
          {(document.signature || notes) && (
            <div className="border-t border-gray-200 pt-4">
              {notes && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md">
                    {notes}
                  </p>
                </div>
              )}
              {document.signature && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Signature</p>
                  <div className="border border-gray-200 rounded-lg p-2 bg-white flex justify-center">
                    <img
                      src={document.signature}
                      alt={`Signature`}
                      className="max-w-full h-24 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
