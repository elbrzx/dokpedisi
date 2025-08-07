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
                document.position === "Pending"
                  ? "bg-orange-100 text-orange-800"
                  : document.position === "Approved"
                    ? "bg-green-100 text-green-800"
                    : document.position === "Accepted"
                      ? "bg-green-100 text-green-800"
                      : document.position === "In Review"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
              }`}
            >
              {document.position}
            </span>
          </div>

          {/* Current Recipient */}
          {document.currentRecipient && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Current Location</p>
                <p className="text-sm font-medium text-blue-800">
                  {document.currentRecipient}
                </p>
              </div>
            </div>
          )}

          {/* Last Received Date */}
          {receivedDate && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Last Received</p>
                <p className="text-sm font-medium text-green-800">
                  {receivedDate}
                </p>
              </div>
            </div>
          )}

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

          {/* Data Source */}
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 flex items-center justify-center">
              {document.isFromGoogleSheets ? (
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              ) : (
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Data Source</p>
              <p className="text-sm text-gray-900">
                {document.isFromGoogleSheets ? "Google Sheets" : "Local System"}
              </p>
            </div>
          </div>

          {/* Expedition History */}
          {document.expeditionHistory.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                Expedition History ({document.expeditionHistory.length})
              </h3>

              <div className="space-y-3">
                {document.expeditionHistory
                  .sort((a, b) => a.order - b.order)
                  .map((expedition, index) => (
                    <div key={expedition.id} className="relative">
                      {/* Timeline line */}
                      {index < document.expeditionHistory.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200"></div>
                      )}

                      <div className="flex items-start gap-3">
                        {/* Timeline dot */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            index === document.expeditionHistory.length - 1
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {expedition.order}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 rounded-lg p-3">
                            {/* Recipient */}
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <p className="text-sm font-medium text-gray-900">
                                Recipient {expedition.order}:{" "}
                                {expedition.recipient}
                              </p>
                              {index ===
                                document.expeditionHistory.length - 1 && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <p className="text-xs text-gray-600">
                                {new Intl.DateTimeFormat("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }).format(expedition.date)}{" "}
                                at {expedition.time}
                              </p>
                            </div>

                            {/* Notes */}
                            {expedition.notes && (
                              <div className="mb-2">
                                <p className="text-xs text-gray-500 mb-1">
                                  Notes
                                </p>
                                <p className="text-xs text-gray-700">
                                  {expedition.notes}
                                </p>
                              </div>
                            )}

                            {/* Signature */}
                            {expedition.signature && (
                              <div>
                                <p className="text-xs text-gray-500 mb-2">
                                  Signature
                                </p>
                                <div className="border border-gray-200 rounded-lg p-2 bg-white">
                                  <img
                                    src={expedition.signature}
                                    alt={`Signature by ${expedition.recipient}`}
                                    className="max-w-full h-16 object-contain"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* No Expeditions Message */}
          {document.expeditionHistory.length === 0 && !document.signature && (
            <div className="border-t border-gray-200 pt-4">
              <div className="text-center py-6 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No expeditions recorded yet</p>
                <p className="text-xs mt-1">
                  Document is still at its original location
                </p>
              </div>
            </div>
          )}

          {/* Signature for documents loaded from sheet */}
          {document.expeditionHistory.length === 0 &&
            (document.signature || notes) && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  Latest Expedition Details
                </h3>
                {notes && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                      {notes}
                    </p>
                  </div>
                )}
                {document.signature && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Signature</p>
                    <div className="border border-gray-200 rounded-lg p-2 bg-white">
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
