import React, { useState, useEffect } from "react";
import {
  Search,
  FileText,
  User,
  RefreshCw,
  AlertCircle,
  Database,
  Calendar,
} from "lucide-react";
import { useDocumentStore, Document } from "../lib/documentStore";
import { cn } from "../lib/utils";
import DocumentDetail from "../components/DocumentDetail";

const DocumentList: React.FC = () => {
  const {
    documents,
    isLoadingGoogleSheets,
    googleSheetsError,
    lastGoogleSheetsSync,
    totalDocumentsCount,
    loadGoogleSheetsData,
    refreshData,
  } = useDocumentStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [showDocumentDetail, setShowDocumentDetail] = useState(false);

  // Load Google Sheets data on component mount
  useEffect(() => {
    if (documents.length === 0) {
      loadGoogleSheetsData();
    }
  }, [loadGoogleSheetsData, documents.length]);

  const [displayedDocuments, setDisplayedDocuments] = useState<Document[]>([]);

  useEffect(() => {
    // When documents load, set the initial displayed documents to the first 500
    // (they are already sorted newest to oldest in the store)
    if (documents.length > 0) {
      setDisplayedDocuments(documents.slice(0, 500));
    }
  }, [documents]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === "") {
      // If search is cleared, show the initial 500
      setDisplayedDocuments(documents.slice(0, 500));
    } else {
      // If searching, filter the entire list of documents
      const filtered = documents.filter(
        (doc) =>
          doc.agendaNo.toLowerCase().includes(term.toLowerCase()) ||
          doc.sender.toLowerCase().includes(term.toLowerCase()) ||
          doc.perihal.toLowerCase().includes(term.toLowerCase()) ||
          doc.currentRecipient?.toLowerCase().includes(term.toLowerCase()),
      );
      setDisplayedDocuments(filtered);
    }
  };

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "in review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
    setShowDocumentDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDocumentDetail(false);
    setSelectedDocument(null);
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Google Sheets Status */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Google Sheets Integration
              </p>
              <p className="text-xs text-blue-700">
                {searchTerm.trim() === ""
                  ? `Showing latest ${displayedDocuments.length} of ${totalDocumentsCount} total documents`
                  : `Found ${displayedDocuments.length} documents matching "${searchTerm}"`}
                {lastGoogleSheetsSync && (
                  <span className="ml-2">
                    • Last sync: {lastGoogleSheetsSync.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoadingGoogleSheets}
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-colors",
              isLoadingGoogleSheets
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200",
            )}
          >
            <RefreshCw
              className={cn("h-3 w-3", isLoadingGoogleSheets && "animate-spin")}
            />
            {isLoadingGoogleSheets ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {googleSheetsError && (
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">{googleSheetsError}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={`Search all ${totalDocumentsCount} documents...`}
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Document Count */}
      <div className="text-xs text-gray-600">
        {displayedDocuments.length} of {totalDocumentsCount} documents displayed
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {isLoadingGoogleSheets ? (
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
            <p className="text-sm">Loading documents from Google Sheets...</p>
          </div>
        ) : displayedDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No documents found</p>
            {documents.length === 0 && (
              <p className="text-xs mt-1">
                Check your Google Sheets connection
              </p>
            )}
          </div>
        ) : (
          displayedDocuments.map((document) => (
            <div
              key={document.id}
              onClick={() => handleDocumentClick(document)}
              className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {/* Header with Agenda and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    {document.agendaNo}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      getPositionColor(document.position),
                    )}
                  >
                    {document.position}
                  </span>
                  {document.expeditionHistory.length > 0 && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {document.expeditionHistory.length} expedition
                      {document.expeditionHistory.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(document.createdAt)}
                </div>
              </div>

              {/* Document Details */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                  {document.perihal}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">From:</span>
                    <span className="ml-1 text-gray-900 font-medium block">
                      {document.sender}
                    </span>
                  </div>
                  {document.currentRecipient && (
                    <div>
                      <span className="text-gray-500">Current Location:</span>
                      <span className="ml-1 text-green-700 font-medium block">
                        {document.currentRecipient}
                      </span>
                    </div>
                  )}
                </div>
                {document.lastExpedition && (
                  <div className="text-xs">
                    <span className="text-gray-500">Last Expedition:</span>
                    <span className="ml-1 text-gray-700">
                      {document.lastExpedition}
                    </span>
                  </div>
                )}
              </div>

              {/* Signature indicator */}
              {document.signature && (
                <div className="flex items-center gap-1 text-xs text-purple-600">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span>Signed</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <DocumentDetail
        document={selectedDocument}
        isOpen={showDocumentDetail}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default DocumentList;
