import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [...Array(totalPages)].map((_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-8 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
      >
        Prev
      </button>

      {pageNumbers.map((num) => (
        <button
          key={num}
          onClick={() => onPageChange(num)}
          className={`px-4 py-2 border rounded-lg text-sm font-medium ${
            currentPage === num
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {num}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
