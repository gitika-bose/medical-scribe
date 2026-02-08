import { useState } from "react";
import { useNavigate } from "react-router";
import { Trash2 } from "lucide-react";
import { deleteAppointment } from "@/lib/api";
import { toast } from "sonner";

interface DeleteAppointmentButtonProps {
  appointmentId: string;
  onDeleteStart?: () => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: string) => void;
}

export function DeleteAppointmentButton({
  appointmentId,
  onDeleteStart,
  onDeleteSuccess,
  onDeleteError,
}: DeleteAppointmentButtonProps) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      onDeleteStart?.();
      
      await deleteAppointment(appointmentId);
      
      toast.success("Appointment deleted successfully");
      onDeleteSuccess?.();
      navigate("/appointments");
    } catch (err) {
      console.error("Failed to delete appointment:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to delete appointment";
      
      toast.error(errorMsg);
      onDeleteError?.(errorMsg);
      
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <button
        onClick={handleDeleteClick}
        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
      >
        <Trash2 className="w-5 h-5" />
        <span>Delete Appointment</span>
      </button>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Appointment?</h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete this appointment and all associated recordings. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
