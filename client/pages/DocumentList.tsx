import React, { useState } from "react";
import { Search, Filter, FileText } from "lucide-react";
import { useDocumentStore, Document } from "../lib/documentStore";
import { cn } from "../lib/utils";
import DocumentDetail from "../components/DocumentDetail";

const DocumentList: React.FC = () => {
  const { documents } = useDocumentStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentDetail, setShowDocumentDetail] = useState(false);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.agendaNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterPosition === "all" || doc.position === filterPosition;

    return matchesSearch && matchesFilter;
  });

  const positions = [...new Set(documents.map((doc) => doc.position))];

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "in review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Positions</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Count */}
      <div className="text-xs text-gray-600">
        {filteredDocuments.length} of {documents.length} documents
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
              className="bg-white rounded-lg border border-gray-200 p-3 space-y-2"
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
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {document.subject}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    From: {document.sender}
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                {new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }).format(document.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentList;
