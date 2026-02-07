import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { store } from "@/store";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Calendar } from "@/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { updateAppointmentMetadata } from "@/lib/api";
import { toast } from "sonner";

export function AppointmentMetadataPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the last completed appointment ID from store
  const appointmentId = store.getLastCompletedAppointmentId();

  useEffect(() => {
    // Set default time to current time
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setSelectedTime(`${hours}:${minutes}`);
  }, []);

  useEffect(() => {
    // If no appointment ID, redirect to home
    if (!appointmentId) {
      navigate("/home");
    }
  }, [appointmentId, navigate]);

  const handleSave = async () => {
    if (!appointmentId) {
      const errorMsg = "No appointment ID found";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Combine date and time
      const [hours, minutes] = selectedTime.split(":");
      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(parseInt(hours, 10));
      appointmentDateTime.setMinutes(parseInt(minutes, 10));

      // Update appointment metadata and wait for it to complete
      await updateAppointmentMetadata(appointmentId, {
        title: title || undefined,
        doctor: doctorName || undefined,
        location: location || undefined,
        appointmentDate: appointmentDateTime,
      });

      // Clear the last completed appointment ID
      store.clearLastCompletedAppointmentId();

      toast.success("Appointment saved successfully!");
      
      // Navigate to appointments list
      navigate("/appointments");
    } catch (err) {
      console.error("Error preparing metadata:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to prepare appointment data";
      setError(errorMsg);
      toast.error(errorMsg);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      <div className="flex-1 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold mb-2">Appointment Details</h1>
        <p className="text-gray-600 mb-8">
          Add details about your appointment (optional)
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              type="text"
              placeholder="Annual Checkup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Doctor Name */}
          <div className="space-y-2">
            <Label htmlFor="doctor">Doctor Name (optional)</Label>
            <Input
              id="doctor"
              type="text"
              placeholder="Dr. Smith"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              type="text"
              placeholder="City Medical Center"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal flex-1"
                    disabled={isSaving}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                    disabled={isSaving}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Time Input */}
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-32"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
