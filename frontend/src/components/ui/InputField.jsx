import { AlertCircle } from "lucide-react";

function InputField({
  name,
  inputType,
  placeholderName,
  handleChange,
  valueData,
  icon: Icon,
  error,
  required = false,
  maxLength,
  min,
  max,
}) {
  return (
    <div>
      {/* Label with Icon */}
      <label
        htmlFor={name}
        className="flex items-center text-sm font-medium text-gray-700 mb-2"
      >
        {Icon && <Icon className="h-4 w-4 mr-2 text-gray-500" />}
        {placeholderName}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      <input
        id={name}
        type={inputType}
        name={name}
        placeholder={placeholderName}
        value={valueData}
        onChange={handleChange}
        required={required}
        maxLength={maxLength}
        min={min}
        max={max}
        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
          error
            ? "border-red-300 focus:border-red-500"
            : "border-gray-200 focus:border-blue-500"
        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
      />

      {/* Error */}
      {error && (
        <p className="flex items-center mt-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}

export default InputField;
