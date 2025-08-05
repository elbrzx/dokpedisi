import React, { useState, useRef, useEffect } from "react";
import { Search, X, Save, Trash2 } from "lucide-react";
import { useDocumentStore, Document } from "../lib/documentStore";
import { useToast } from "../lib/toastContext";
import { cn } from "../lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { useNavigationGuard } from "../App";

const Expedition: React.FC = () => {
  const { documents, addExpedition } = useDocumentStore();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { setShouldBlockNavigation, setOnNavigationAttempt } = useNavigationGuard();
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(
    new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const [notes, setNotes] = useState("");
  const [signature, setSignature] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Track form changes
  useEffect(() => {
    const hasChanges =
      selectedDocuments.length > 0 ||
      recipient.trim() !== "" ||
      notes.trim() !== "" ||
      signature !== "";
    setHasFormChanges(hasChanges);
    setShouldBlockNavigation(hasChanges);
  }, [selectedDocuments, recipient, notes, signature, setShouldBlockNavigation]);

  // Handle beforeunload for browser navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasFormChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasFormChanges]);

  // Set up navigation attempt handler
  useEffect(() => {
    setOnNavigationAttempt((path: string) => {
      setPendingNavigation(path);
      setShowConfirmDialog(true);
    });
  }, [setOnNavigationAttempt]);

  const handleConfirmNavigation = () => {
    setHasFormChanges(false);
    setShowConfirmDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleCancelNavigation = () => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  };

  const handleEraseContent = () => {
    setSelectedDocuments([]);
    setRecipient("");
    setNotes("");
    clearSignature();
    setHasFormChanges(false);
    setShowConfirmDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.agendaNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.scale(dpr, dpr);
    context.lineCap = "round";
    context.strokeStyle = "#1f2937";
    context.lineWidth = 2;
    contextRef.current = context;
  }, []);

  // Get coordinates from mouse or touch event
  const getCoordinates = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in event) {
      const touch = event.touches[0] || event.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    event.preventDefault();
    const { x, y } = getCoordinates(event);
    if (!contextRef.current) return;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    event.preventDefault();
    if (!isDrawing || !contextRef.current) return;

    const { x, y } = getCoordinates(event);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const finishDrawing = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    event.preventDefault();
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);

    // Save signature as base64
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  };

  const toggleDocumentSelection = (document: Document) => {
    setSelectedDocuments((prev) => {
      const isSelected = prev.some((d) => d.id === document.id);
      if (isSelected) {
        return prev.filter((d) => d.id !== document.id);
      } else {
        return [...prev, document];
      }
    });
  };

  const removeSelectedDocument = (documentId: string) => {
    setSelectedDocuments((prev) => prev.filter((d) => d.id !== documentId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDocuments.length === 0 || !recipient.trim()) {
      showToast(
        "Please select at least one document and enter a recipient.",
        "error",
      );
      return;
    }

    addExpedition({
      documentIds: selectedDocuments.map((d) => d.id),
      recipient: recipient.trim(),
      date: new Date(date),
      time,
      signature: signature || undefined,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setSelectedDocuments([]);
    setRecipient("");
    setDate(new Date().toISOString().split("T")[0]);
    setTime(
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    setNotes("");
    clearSignature();

    showToast(
      "Expedition submitted successfully! Document positions have been updated.",
      "success",
    );
  };

  return (
    <div className="p-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selected Documents */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Selected Documents ({selectedDocuments.length})
          </label>

          {selectedDocuments.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between bg-orange-50 rounded-lg p-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-orange-800">
                      {doc.agendaNo}
                    </p>
                    <p className="text-xs text-orange-600 truncate">
                      {doc.subject}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelectedDocument(doc.id)}
                    className="ml-2 p-1 text-orange-600 hover:text-orange-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowDocumentSelector(!showDocumentSelector)}
            className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" />
            {showDocumentSelector ? "Hide" : "Select"} Documents
          </button>
        </div>

        {/* Document Selector */}
        {showDocumentSelector && (
          <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredDocuments.map((document) => {
                const isSelected = selectedDocuments.some(
                  (d) => d.id === document.id,
                );
                return (
                  <div
                    key={document.id}
                    onClick={() => toggleDocumentSelection(document)}
                    className={cn(
                      "p-2 rounded-lg border cursor-pointer transition-colors",
                      isSelected
                        ? "bg-orange-100 border-orange-300"
                        : "bg-white border-gray-200 hover:bg-gray-50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900">
                          {document.agendaNo}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {document.subject}
                        </p>
                        <p className="text-xs text-gray-500">
                          {document.sender}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center",
                          isSelected
                            ? "bg-orange-600 border-orange-600"
                            : "border-gray-300",
                        )}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient *
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Enter recipient name"
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Signature */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Signature
            </label>
            <button
              type="button"
              onClick={clearSignature}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          </div>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={finishDrawing}
            onMouseLeave={finishDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={finishDrawing}
            className="w-full h-32 border border-gray-200 rounded-lg bg-white cursor-crosshair touch-none"
            style={{ touchAction: "none" }}
          />
          <p className="text-xs text-gray-500 mt-1">
            Draw your signature above
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            placeholder="Additional notes (optional)"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" />
          Submit Expedition
        </button>
      </form>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Cancel editing?"
        message="You have unsaved changes. What would you like to do?"
        confirmText="Erase Content"
        cancelText="Continue Edit"
        onConfirm={handleEraseContent}
        onCancel={handleCancelNavigation}
      />
    </div>
  );
};

export default Expedition;
