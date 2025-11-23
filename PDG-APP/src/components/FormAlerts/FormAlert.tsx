"use client";

interface FormAlertProps {
  type?: "error" | "success" | "warning";
  message: string;
}

const colors = {
  error: "bg-red-100 text-red-800 border-red-300",
  success: "bg-green-100 text-green-800 border-green-300",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

export function FormAlert({ type = "error", message }: FormAlertProps) {
  if (!message) return null;

  return (
    <div
      className={`mb-4 rounded-md border p-3 text-sm ${colors[type]}`}
      role="alert"
    >
      {message}
    </div>
  );
}
