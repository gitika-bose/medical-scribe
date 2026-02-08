import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";

interface DocumentsUploadProps {
  savedDocs: string[];
  onSavedDocsChange: (docs: string[]) => void;
}

export function DocumentsUpload({ savedDocs, onSavedDocsChange }: DocumentsUploadProps) {
  const [pendingDocs, setPendingDocs] = useState<File[]>([]);
  const [isSavingDocs, setIsSavingDocs] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setPendingDocs([...pendingDocs, ...newFiles]);
      setSaveError(null);
      setSaveSuccess(false);
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const handleRemovePendingDoc = (index: number) => {
    const updated = pendingDocs.filter((_, i) => i !== index);
    setPendingDocs(updated);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleRemoveSavedDoc = (docName: string) => {
    const updated = savedDocs.filter(doc => doc !== docName);
    onSavedDocsChange(updated);
    setHasUnsavedChanges(true);
    setSaveError(null);
    setSaveSuccess(false);
    // TODO: Remove document from backend when API is available
  };

  const handleSaveDocuments = async () => {
    // Allow saving if there are pending docs OR unsaved changes (like removals)
    if (pendingDocs.length === 0 && !hasUnsavedChanges) return;

    try {
      setIsSavingDocs(true);
      setSaveError(null);
      setSaveSuccess(false);

      // Dummy API call - simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate random success/failure for testing
      const shouldSucceed = Math.random() > 0.2; // 80% success rate

      if (shouldSucceed) {
        // On success, move pending docs to saved docs (if any)
        if (pendingDocs.length > 0) {
          const newSavedDocs = pendingDocs.map(file => file.name);
          onSavedDocsChange([...savedDocs, ...newSavedDocs]);
          setPendingDocs([]);
        }
        // Reset unsaved changes flag (this handles both additions and removals)
        setHasUnsavedChanges(false);
        setSaveSuccess(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        // Simulate error
        throw new Error("Failed to upload documents. Please try again.");
      }
    } catch (err) {
      console.error("Failed to save documents:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save documents");
    } finally {
      setIsSavingDocs(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg">Documents</h2>
        <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm cursor-pointer hover:bg-blue-700 transition-colors">
          <Upload className="w-4 h-4" />
          Upload
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,image/*,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
      
      {/* Saved Documents */}
      {savedDocs.length > 0 && (
        <div className="space-y-2 mb-4">
          <h3 className="text-sm font-medium text-gray-700">Saved Documents</h3>
          {savedDocs.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-green-50 rounded-lg p-3 border border-green-200"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">{doc}</span>
              </div>
              <button
                onClick={() => handleRemoveSavedDoc(doc)}
                className="p-1 hover:bg-green-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending Documents */}
      {pendingDocs.length > 0 && (
        <div className="space-y-2 mb-4">
          <h3 className="text-sm font-medium text-gray-700">Pending Upload</h3>
          {pendingDocs.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-amber-50 rounded-lg p-3 border border-amber-200"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-600" />
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRemovePendingDoc(index)}
                className="p-1 hover:bg-amber-100 rounded transition-colors"
                disabled={isSavingDocs}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      {(pendingDocs.length > 0 || hasUnsavedChanges) && (
        <div className="space-y-2">
          <button
            onClick={handleSaveDocuments}
            disabled={isSavingDocs}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingDocs ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Save Documents</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {saveError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-300 rounded p-3">
              {saveError}
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">
              Documents saved successfully!
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {savedDocs.length === 0 && pendingDocs.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">
          No documents uploaded yet. Only PDF and image files are allowed.
        </p>
      )}
    </div>
  );
}
