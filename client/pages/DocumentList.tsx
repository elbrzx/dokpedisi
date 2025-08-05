import React, { useState } from "react";
import { Search, Filter, FileText, Hash, User } from "lucide-react";
import { useDocumentStore, Document } from "../lib/documentStore";
import { cn } from "../lib/utils";
import DocumentDetail from "../components/DocumentDetail";

const DocumentList: React.FC = () => {
  const { documents } = useDocumentStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"status" | "agenda">("status");
  const [filterValue, setFilterValue] = useState<string>("all");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [showDocumentDetail, setShowDocumentDetail] = useState(false);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.agendaNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.currentRecipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.expeditionHistory.some((exp) =>
        exp.recipient.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    let matchesFilter = true;

    if (filterType === "status") {
      matchesFilter = filterValue === "all" || doc.position === filterValue;
    } else if (filterType === "agenda") {
      if (filterValue === "all") {
        matchesFilter = true;
      } else {
        matchesFilter =
          doc.agendaNo.toLowerCase().includes(filterValue.toLowerCase()) ||
          doc.subject.toLowerCase().includes(filterValue.toLowerCase());
      }
    }

    return matchesSearch && matchesFilter;
  });

  const positions = [...new Set(documents.map((doc) => doc.position))];
  const agendaNumbers = [...new Set(documents.map((doc) => doc.agendaNo))];
  const subjects = [...new Set(documents.map((doc) => doc.subject))];

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

  const handleFilterTypeChange = (type: "status" | "agenda") => {
    setFilterType(type);
    setFilterValue("all");
  };

  const getRecipientDisplay = (document: Document) => {
    if (document.expeditionHistory.length === 0) {
      return null;
    }

    const recipients = document.expeditionHistory.map((exp) => exp.recipient);
    const uniqueRecipients = [...new Set(recipients)];

    if (uniqueRecipients.length === 1) {
      return `Recipient: ${uniqueRecipients[0]}`;
    } else {
      return `Recipients: ${uniqueRecipients.slice(0, 2).join(", ")}${uniqueRecipients.length > 2 ? ` +${uniqueRecipients.length - 2} more` : ""}`;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents, agenda, subject, or recipients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Filter Type Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => handleFilterTypeChange("status")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
            filterType === "status"
              ? "bg-orange-100 text-orange-800 border border-orange-200"
              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200",
          )}
        >
          <User className="h-4 w-4" />
          Filter by Status
        </button>
        <button
          onClick={() => handleFilterTypeChange("agenda")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
            filterType === "agenda"
              ? "bg-orange-100 text-orange-800 border border-orange-200"
              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200",
          )}
        >
          <Hash className="h-4 w-4" />
          Filter by Agenda/Subject
        </button>
      </div>

      {/* Filter Options */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        {filterType === "status" ? (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Documents</option>
            <optgroup label="Agenda Numbers">
              {agendaNumbers.map((agenda) => (
                <option key={`agenda-${agenda}`} value={agenda}>
                  {agenda}
                </option>
              ))}
            </optgroup>
            <optgroup label="Subjects">
              {subjects.map((subject) => (
                <option key={`subject-${subject}`} value={subject}>
                  {subject.length > 30
                    ? `${subject.substring(0, 30)}...`
                    : subject}
                </option>
              ))}
            </optgroup>
          </select>
        )}
      </div>

      {/* Document Count */}
      <div className="text-xs text-gray-600">
        {filteredDocuments.length} of {documents.length} documents
        {filterType === "agenda" && filterValue !== "all" && (
          <span className="ml-2 text-orange-600">
            • Filtered by: {filterValue}
          </span>
        )}
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No documents found</p>
          </div>
        ) : (
          filteredDocuments.map((document) => (
            <div
              key={document.id}
              onClick={() => handleDocumentClick(document)}
              className="bg-white rounded-lg border border-gray-200 p-3 space-y-2 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-orange-600">
                      {document.agendaNo}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        getPositionColor(document.position),
                      )}
                    >
                      {document.position}
                    </span>
                    {document.expeditionHistory.length > 0 && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {document.expeditionHistory.length} expedition
                        {document.expeditionHistory.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {document.subject}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    From: {document.sender}
                  </p>
                  {getRecipientDisplay(document) && (
                    <p className="text-xs text-green-600 mt-1">
                      {getRecipientDisplay(document)}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Created:{" "}
                {new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }).format(document.createdAt)}
                {document.expeditionHistory.length > 0 && (
                  <span className="ml-2">
                    • Last expedition:{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                    }).format(
                      document.expeditionHistory[
                        document.expeditionHistory.length - 1
                      ].date,
                    )}
                  </span>
                )}
              </div>
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
