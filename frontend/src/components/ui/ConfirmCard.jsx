import React from "react";

function ConfirmCard({ actionType, isClose, isSubmit }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-bold mb-4">{actionType.charAt(0).toUpperCase() + actionType.slice(1).toLowerCase()} Transaction</h2>
        <p className="mb-4">
          Are you sure you want to{" "}
          <span className="font-semibold">{actionType}</span> this payment?
        </p>
        <div className="flex justify-end space-x-3">
          <button onClick={isClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
          <button
            onClick={isSubmit}
            className={`px-4 py-2 rounded-lg text-white ${
              actionType === "VERIFIED" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmCard;
