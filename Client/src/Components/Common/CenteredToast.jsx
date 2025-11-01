import { useEffect } from "react";

export default function CenteredToast({ message, duration = 2000, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => {
      onDone && onDone();
    }, duration);
    return () => clearTimeout(t);
  }, [message, duration, onDone]);

  if (!message) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-sm shadow-lg rounded-md px-6 py-4 text-center">
        <div className="text-sm font-medium text-gray-800">{message}</div>
      </div>
    </div>
  );
}
