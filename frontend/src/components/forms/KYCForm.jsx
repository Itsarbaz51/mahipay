import { useEffect, useMemo, useState } from "react";
import {
  User,
  Users,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Shield,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createEntity, getAllEntities } from "../../redux/slices/addressSlice";
import { kycSubmit } from "../../redux/slices/kycSlice";
import { toast } from "react-toastify";

// ---------- InputField ----------
const InputField = ({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
  icon: Icon,
  value,
  onChange,
  error,
  maxLength,
  inputMode,
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        className={`w-full ${
          Icon ? "pl-10" : "pl-4"
        } pr-4 py-3 bg-gray-50 border-2 ${
          error ? "border-red-500" : "border-gray-200"
        } rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all`}
      />
    </div>
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle size={12} />
        {error}
      </p>
    )}
  </div>
);

// ---------- DropdownField ----------
const DropdownField = ({
  label,
  name,
  required = true,
  icon: Icon,
  value,
  onChange,
  options = [],
  error,
  placeholder = "Select an option",
  disabled = false,
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
          <Icon size={18} />
        </div>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full ${
          Icon ? "pl-10" : "pl-4"
        } pr-10 py-3 bg-gray-50 border-2 ${
          error ? "border-red-500" : "border-gray-200"
        } rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all appearance-none cursor-pointer ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.stateName || option.cityName}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
        <ChevronDown size={18} />
      </div>
    </div>
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle size={12} />
        {error}
      </p>
    )}
  </div>
);

// ---------- FileUpload ----------
const FileUpload = ({
  label,
  name,
  accept = "image/*,.pdf",
  icon: Icon,
  onChange,
  filePreview,
  file,
  error,
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label} <span className="text-red-500">*</span>
    </label>
    <div
      className={`relative border-2 border-dashed ${
        error ? "border-red-500" : "border-gray-300"
      } rounded-lg p-6 hover:border-cyan-500 transition-colors cursor-pointer bg-gray-50`}
    >
      <input
        type="file"
        name={name}
        accept={accept}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="text-center">
        {filePreview ? (
          <div className="space-y-2">
            {filePreview === "PDF" ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <FileText size={24} />
                <span className="font-semibold">{file?.name}</span>
              </div>
            ) : (
              <img
                src={filePreview}
                alt="Preview"
                className="max-h-32 mx-auto rounded-lg shadow-md"
              />
            )}
            <p className="text-sm text-gray-600">{file?.name}</p>
            <p className="text-xs text-green-600 flex items-center justify-center gap-1">
              <CheckCircle size={12} /> File uploaded successfully
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Icon className="mx-auto text-gray-400" size={32} />
            <p className="text-sm text-gray-600">
              <span className="text-cyan-600 font-semibold">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG or PDF (max 150KB)</p>
          </div>
        )}
      </div>
    </div>
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle size={12} />
        {error}
      </p>
    )}
  </div>
);

// ---------- Main Form ----------
export default function KYCWithAddressForm() {
  const dispatch = useDispatch();
  const addressState = useSelector((state) => state.address);

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    fatherName: "",
    dob: "",
    gender: "MALE",
    panNumber: "",
    aadhaarNumber: "",
    address: "",
    pinCode: "",
    stateId: "",
    cityId: "",
  });

  const [files, setFiles] = useState({
    photo: null,
    panFile: null,
    aadhaarFile: null,
    addressProofFile: null, // ✅ Added
  });

  const [filePreviews, setFilePreviews] = useState({
    photo: null,
    panFile: null,
    aadhaarFile: null,
    addressProofFile: null, // ✅ Added
  });

  const [errors, setErrors] = useState({});

  // Fetch states & cities
  useEffect(() => {
    if (!addressState?.data?.length) {
      dispatch(getAllEntities("state-list"));
      dispatch(getAllEntities("city-list"));
    }
  }, [dispatch, addressState.data]);

  const stateList = useMemo(
    () => addressState?.stateList?.filter((i) => i.stateName) || [],
    [addressState.stateList]
  );
  const cityList = useMemo(
    () => addressState?.cityList?.filter((i) => i.cityName) || [],
    [addressState.cityList]
  );

  const handleInputChange = (e) => {
    let value = e.target.value;
    const { name } = e.target;
    if (name === "panNumber")
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (name === "aadhaarNumber") value = value.replace(/\D/g, "").slice(0, 12);
    if (name === "pinCode") value = value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      return setErrors((prev) => ({
        ...prev,
        [name]: "Only image or PDF files allowed",
      }));
    }

    if (file.size > 150 * 1024) {
      return setErrors((prev) => ({
        ...prev,
        [name]: "File too large (max 150KB)",
      }));
    }

    setFiles((prev) => ({ ...prev, [name]: file }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFilePreviews((prev) => ({ ...prev, [name]: reader.result }));
      reader.readAsDataURL(file);
    } else {
      setFilePreviews((prev) => ({ ...prev, [name]: "PDF" }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      ["firstName", "lastName", "fatherName", "dob", "gender"].forEach(
        (f) => !formData[f] && (newErrors[f] = "Required")
      );
    }

    if (step === 2) {
      ["panNumber", "aadhaarNumber"].forEach(
        (f) => !formData[f] && (newErrors[f] = "Required")
      );
      if (
        formData.panNumber &&
        !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)
      )
        newErrors.panNumber = "Invalid PAN format";

      if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber))
        newErrors.aadhaarNumber = "Aadhaar must be 12 digits";
    }

    if (step === 3) {
      ["address", "pinCode", "stateId", "cityId"].forEach(
        (f) => !formData[f] && (newErrors[f] = "Required")
      );
      if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode))
        newErrors.pinCode = "PIN code must be 6 digits";
    }

    if (step === 4) {
      ["photo", "panFile", "aadhaarFile", "addressProofFile"].forEach(
        (f) => !files[f] && (newErrors[f] = "Required")
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () =>
    validateStep(currentStep) && setCurrentStep((prev) => prev + 1);

  const handleBack = () => setCurrentStep((prev) => prev - 1);
  const userId = useSelector((state) => state?.currentUser?.user?.id);

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setSubmitting(true);

      const addressPayload = {
        userId,
        stateId: formData.stateId,
        cityId: formData.cityId,
        address: formData.address,
        pinCode: formData.pinCode,
      };

      const addressRes = dispatch(
        createEntity("address-store", addressPayload)
      );

      const addressId = addressRes.data?.data?.id;

      const kycPayload = new FormData();
      kycPayload.append("firstName", formData.firstName);
      kycPayload.append("lastName", formData.lastName);
      kycPayload.append("fatherName", formData.fatherName);
      kycPayload.append("dob", formData.dob);
      kycPayload.append("gender", formData.gender);
      kycPayload.append("panNumber", formData.panNumber);
      kycPayload.append("aadhaarNumber", formData.aadhaarNumber);
      kycPayload.append("addressId", addressId);

      if (files.photo) kycPayload.append("photo", files.photo);
      if (files.panFile) kycPayload.append("panFile", files.panFile);
      if (files.aadhaarFile)
        kycPayload.append("aadhaarFile", files.aadhaarFile);
      if (files.addressProofFile)
        kycPayload.append("addressProofFile", files.addressProofFile);

      await dispatch(kycSubmit(kycPayload));

      setCurrentStep(1);
      setFormData({
        firstName: "",
        lastName: "",
        fatherName: "",
        dob: "",
        gender: "MALE",
        panNumber: "",
        aadhaarNumber: "",
        address: "",
        pinCode: "",
        stateId: "",
        cityId: "",
      });
      setFiles({
        photo: null,
        panFile: null,
        aadhaarFile: null,
        addressProofFile: null,
      });
      setFilePreviews({
        photo: null,
        panFile: null,
        aadhaarFile: null,
        addressProofFile: null,
      });
    } catch (err) {
      toast.error(err?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Documents", icon: FileText },
    { number: 3, title: "Address", icon: MapPin },
    { number: 4, title: "Upload Files", icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-white" size={32} />
            <h1 className="text-3xl font-bold text-white">KYC Verification</h1>
          </div>
          <p className="text-cyan-50">
            Complete your KYC to access all features
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep > step.number
                        ? "bg-green-500 text-white"
                        : currentStep === step.number
                        ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle size={24} />
                    ) : (
                      <step.icon size={24} />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold ${
                      currentStep >= step.number
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-all ${
                      currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="First Name"
                name="firstName"
                icon={User}
                value={formData.firstName}
                onChange={handleInputChange}
                error={errors.firstName}
                placeholder="Enter first name"
              />
              <InputField
                label="Last Name"
                name="lastName"
                icon={User}
                value={formData.lastName}
                onChange={handleInputChange}
                error={errors.lastName}
                placeholder="Enter last name"
              />
              <InputField
                label="Father's Name"
                name="fatherName"
                icon={Users}
                value={formData.fatherName}
                onChange={handleInputChange}
                error={errors.fatherName}
                placeholder="Enter father's name"
              />
              <InputField
                label="Date of Birth"
                name="dob"
                type="date"
                icon={Calendar}
                value={formData.dob}
                onChange={handleInputChange}
                error={errors.dob}
              />
              <div className="md:col-span-2 flex gap-4 items-center">
                {["MALE", "FEMALE", "OTHER"].map((g) => (
                  <label
                    key={g}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={formData.gender === g}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-gray-700">
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="PAN Number"
                name="panNumber"
                icon={CreditCard}
                value={formData.panNumber}
                onChange={handleInputChange}
                error={errors.panNumber}
                placeholder="ABCDE1234F"
                maxLength={10}
              />
              <InputField
                label="Aadhaar Number"
                name="aadhaarNumber"
                icon={CreditCard}
                value={formData.aadhaarNumber}
                onChange={handleInputChange}
                error={errors.aadhaarNumber}
                placeholder="Enter 12-digit Aadhaar"
                maxLength={12}
              />
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter full address"
                rows="3"
                className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                  errors.address ? "border-red-500" : "border-gray-200"
                } rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200`}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.address}
                </p>
              )}
              <InputField
                label="PIN Code"
                name="pinCode"
                inputMode="numeric"
                value={formData.pinCode}
                onChange={handleInputChange}
                error={errors.pinCode}
                placeholder="Enter PIN code"
                maxLength={6}
              />
              <DropdownField
                label="State"
                name="stateId"
                icon={MapPin}
                value={formData.stateId}
                onChange={handleInputChange}
                options={stateList}
                error={errors.stateId}
                placeholder="Select state"
              />
              <DropdownField
                label="City"
                name="cityId"
                icon={MapPin}
                value={formData.cityId}
                onChange={handleInputChange}
                options={cityList}
                error={errors.cityId}
                placeholder="Select city"
                disabled={false}
              />
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FileUpload
                label="Photo"
                name="photo"
                icon={Camera}
                onChange={handleFileChange}
                filePreview={filePreviews.photo}
                file={files.photo}
                error={errors.photo}
              />
              <FileUpload
                label="PAN File"
                name="panFile"
                icon={FileText}
                onChange={handleFileChange}
                filePreview={filePreviews.panFile}
                file={files.panFile}
                error={errors.panFile}
              />
              <FileUpload
                label="Aadhaar File"
                name="aadhaarFile"
                icon={FileText}
                onChange={handleFileChange}
                filePreview={filePreviews.aadhaarFile}
                file={files.aadhaarFile}
                error={errors.aadhaarFile}
              />
              <FileUpload
                label="Address Proof"
                name="addressProofFile"
                icon={FileText}
                onChange={handleFileChange}
                filePreview={filePreviews.addressProofFile}
                file={files.addressProofFile}
                error={errors.addressProofFile}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="px-6 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
