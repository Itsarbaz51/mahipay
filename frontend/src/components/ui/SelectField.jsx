function SelectField({ name, label, value, handleChange, options }) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <select
        name={name}
        value={value}
        onChange={handleChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="border border-gray-300"
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectField;
