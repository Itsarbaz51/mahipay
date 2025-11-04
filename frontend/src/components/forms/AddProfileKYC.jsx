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
  Ban,
  Clock,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  createEntity,
  getAllEntities,
  updateEntity,
} from "../../redux/slices/addressSlice";
import {
  getbyId,
  kycSubmit,
  updatekycSubmit,
} from "../../redux/slices/kycSlice";
import { toast } from "react-toastify";
import { verifyAuth } from "../../redux/slices/authSlice";

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
  isPreFilled = false,
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <div
        className={`relative border-2 border-dashed ${
          error && !isPreFilled ? "border-red-500" : "border-gray-300"
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
              {/* Improved PDF Preview Logic */}
              {filePreview === "PDF" ||
              (file && file.type === "application/pdf") ? (
                <div className="flex flex-col items-center justify-center gap-2 p-3">
                  <div className="relative">
                    <FileText size={40} className="text-red-500" />
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      PDF
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm text-gray-800 truncate max-w-[140px]">
                      {file?.name || `${label}.pdf`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {file
                        ? `Size: ${(file.size / 1024).toFixed(1)}KB`
                        : "PDF Document"}
                    </p>
                  </div>
                </div>
              ) : (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="max-h-32 mx-auto rounded-lg shadow-md"
                />
              )}
              <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                <CheckCircle size={12} />
                {isPreFilled
                  ? "File pre-filled from previous submission"
                  : "File uploaded successfully"}
              </p>
              {isPreFilled && (
                <p className="text-xs text-blue-600">
                  Click to upload new file
                </p>
              )}
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
              <p className="text-xs text-gray-500">
                PNG, JPG or PDF (max 150KB)
              </p>
            </div>
          )}
        </div>
      </div>
      {error && !isPreFilled && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
};

// ---------- KYC Status Card ----------
const KYCStatusCard = ({ kycDetail }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "VERIFIED":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          title: "KYC VERIFIED",
          message: "Your KYC verification has been VERIFIED successfully.",
        };
      case "REJECT":
        return {
          icon: Ban,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          title: "KYC Rejected",
          message: `Your KYC was rejected. Reason: ${kycDetail.rejectReason}`,
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          title: "KYC Pending",
          message:
            "Your KYC verification is under review. Please wait for approval.",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          title: "KYC Status Unknown",
          message: "Unable to determine KYC status.",
        };
    }
  };

  const config = getStatusConfig(kycDetail.status);
  const StatusIcon = config.icon;

  return (
    <div
      className={`border-2 ${config.borderColor} ${config.bgColor} rounded-2xl p-6 mb-6`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${config.bgColor}`}>
          <StatusIcon className={config.color} size={32} />
        </div>
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${config.color} mb-2`}>
            {config.title}
          </h3>
          <p className="text-gray-700 mb-3">{config.message}</p>

          {kycDetail.status === "REJECT" && (
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Resubmit KYC
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Main Form ----------
export default function AddProfileKYC() {
  const dispatch = useDispatch();
  const addressState = useSelector((state) => state.address);
  const { kycDetail, loading } = useSelector((state) => state.kyc);

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
    addressProofFile: null,
  });

  const [filePreviews, setFilePreviews] = useState({
    photo: null,
    panFile: null,
    aadhaarFile: null,
    addressProofFile: null,
  });

  const [preFilledFiles, setPreFilledFiles] = useState({
    photo: false,
    panFile: false,
    aadhaarFile: false,
    addressProofFile: false,
  });

  const [errors, setErrors] = useState({});

  const { currentUser } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchKYCData = async () => {
      try {
        await dispatch(getAllEntities("state-list"));
        await dispatch(getAllEntities("city-list"));

        if (currentUser?.kycInfo?.currentStatus) {
          await dispatch(getbyId(currentUser?.kycInfo?.latestKyc.id));
        }
      } catch (error) {
        console.error("Failed to fetch KYC data:", error);
      }
    };

    if (!currentUser?.kycInfo?.currentStatus) {
      dispatch(verifyAuth());
    } else {
      fetchKYCData();
    }
  }, [dispatch, currentUser, currentUser?.kycInfo?.currentStatus]);

  useEffect(() => {
    if (currentUser?.id) {
      const fetchKYCIfNeeded = async () => {
        if (currentUser?.kycInfo?.currentStatus) {
          await dispatch(getbyId(currentUser?.kycInfo?.latestKyc.id));
        }
      };
      fetchKYCIfNeeded();
    }
  }, [
    dispatch,
    currentUser?.id,
    currentUser?.kycInfo?.currentStatus,
    currentUser?.kycInfo?.latestKyc.id,
  ]);

  const stateList = useMemo(
    () => addressState?.stateList?.filter((i) => i.stateName) || [],
    [addressState.stateList]
  );

  const cityList = useMemo(
    () => addressState?.cityList?.filter((i) => i.cityName) || [],
    [addressState.cityList]
  );

  // Helper functions to find state and city IDs by name
  const findStateIdByName = (stateName) => {
    if (!stateName) return "";
    const state = stateList.find(
      (s) =>
        s.stateName?.toLowerCase().trim() === stateName?.toLowerCase().trim()
    );
    return state ? state.id : "";
  };

  const findCityIdByName = (cityName) => {
    if (!cityName) return "";
    const city = cityList.find(
      (c) => c.cityName?.toLowerCase().trim() === cityName?.toLowerCase().trim()
    );
    return city ? city.id : "";
  };

  // Filter cities based on selected state
  const filteredCities = useMemo(() => {
    if (!formData.stateId) return cityList;
    return cityList.filter(
      (city) => city.stateId === formData.stateId || !city.stateId
    );
  }, [cityList, formData.stateId]);

  // Fixed Pre-fill logic for rejected KYC
  useEffect(() => {
    if (kycDetail && kycDetail.status === "REJECT") {
      // Convert state and city names to IDs
      const stateId = findStateIdByName(kycDetail.location?.state);
      const cityId = findCityIdByName(kycDetail.location?.city);

      // Format date properly
      const dob = kycDetail.profile?.dob
        ? kycDetail.profile.dob.split("T")[0]
        : "";

      // Get PAN and Aadhaar values
      let aadhaarNumber =
        kycDetail.documents?.find((doc) => doc.type === "AADHAAR")?.value || "";
      let panNumber =
        kycDetail.documents?.find((doc) => doc.type === "PAN")?.value || "";

      // If values are encrypted or legacy data, clear them
      if (
        aadhaarNumber.includes("Encrypted Data") ||
        aadhaarNumber.includes("Legacy Data")
      ) {
        aadhaarNumber = "";
      }
      if (
        panNumber.includes("Encrypted Data") ||
        panNumber.includes("Legacy Data")
      ) {
        panNumber = "";
      }

      // Format Aadhaar number if it's a plain 12-digit number
      if (
        aadhaarNumber &&
        aadhaarNumber.length === 12 &&
        /^\d+$/.test(aadhaarNumber)
      ) {
        aadhaarNumber = `${aadhaarNumber.slice(0, 4)}-${aadhaarNumber.slice(
          4,
          8
        )}-${aadhaarNumber.slice(8)}`;
      }

      setFormData({
        firstName: kycDetail.profile?.name?.split(" ")[0] || "",
        lastName: kycDetail.profile?.name?.split(" ").slice(1).join(" ") || "",
        fatherName: kycDetail.profile?.fatherName || "",
        dob: dob,
        gender: kycDetail.profile?.gender || "MALE",
        panNumber: panNumber,
        aadhaarNumber: aadhaarNumber,
        address: kycDetail.location?.address || "",
        pinCode: kycDetail.location?.pinCode || "",
        stateId: stateId,
        cityId: cityId,
      });

      // Fixed Pre-fill file previews logic
      if (kycDetail.files) {
        const newFilePreviews = {};
        const newPreFilledFiles = {
          photo: false,
          panFile: false,
          aadhaarFile: false,
          addressProofFile: false,
        };

        // Check each file type and set preview accordingly
        Object.keys(kycDetail.files).forEach((fileType) => {
          const fileUrl = kycDetail.files[fileType];
          if (fileUrl) {
            // Check if file is PDF based on URL extension or content type
            if (
              fileUrl.toLowerCase().includes(".pdf") ||
              fileUrl.toLowerCase().includes("application/pdf")
            ) {
              newFilePreviews[fileType] = "PDF";
            } else {
              // It's an image
              newFilePreviews[fileType] = fileUrl;
            }
            newPreFilledFiles[fileType] = true;
          }
        });
        setFilePreviews(newFilePreviews);
        setPreFilledFiles(newPreFilledFiles);

        // Clear validation errors for pre-filled files
        setErrors((prev) => ({
          ...prev,
          photo: newPreFilledFiles.photo ? "" : prev.photo,
          panFile: newPreFilledFiles.panFile ? "" : prev.panFile,
          aadhaarFile: newPreFilledFiles.aadhaarFile ? "" : prev.aadhaarFile,
          addressProofFile: newPreFilledFiles.addressProofFile
            ? ""
            : prev.addressProofFile,
        }));
      }
    }
  }, [kycDetail, stateList, cityList]);

  const handleInputChange = (e) => {
    let value = e.target.value;
    const { name } = e.target;

    if (name === "panNumber") {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    }

    if (name === "aadhaarNumber") {
      // Keep only digits for processing
      const digitsOnly = value.replace(/\D/g, "");

      // Format as 1234-5678-9012
      if (digitsOnly.length <= 4) {
        value = digitsOnly;
      } else if (digitsOnly.length <= 8) {
        value = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
      } else {
        value = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(
          4,
          8
        )}-${digitsOnly.slice(8, 12)}`;
      }
    }

    if (name === "pinCode") value = value.replace(/\D/g, "").slice(0, 6);

    // If state changes, clear city selection
    if (name === "stateId") {
      setFormData((prev) => ({
        ...prev,
        stateId: value,
        cityId: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    // Aadhaar file → only PDF allowed
    if (name === "aadhaarFile" && !isPdf) {
      return setErrors((prev) => ({
        ...prev,
        [name]: "Only PDF allowed for Aadhaar file",
      }));
    }

    // Other files → only image allowed
    if (name !== "aadhaarFile" && !isImage) {
      return setErrors((prev) => ({
        ...prev,
        [name]: "Only image files allowed (PNG/JPG/JPEG/JPG/WEBP)",
      }));
    }

    setFiles((prev) => ({ ...prev, [name]: file }));
    setPreFilledFiles((prev) => ({ ...prev, [name]: false })); // Mark as user-uploaded file
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews((prev) => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      // For PDF files, set preview to "PDF"
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

    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      const dayDiff = today.getDate() - dobDate.getDate();

      if (
        age < 18 ||
        (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))
      ) {
        newErrors.dob = "You must be at least 18 years old";
      }
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

      if (
        formData.aadhaarNumber &&
        !/^\d{4}-\d{4}-\d{4}$/.test(formData.aadhaarNumber)
      )
        newErrors.aadhaarNumber = "Aadhaar must be in format 1234-5678-9012";
    }

    if (step === 3) {
      ["address", "pinCode", "stateId", "cityId"].forEach(
        (f) => !formData[f] && (newErrors[f] = "Required")
      );
      if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode))
        newErrors.pinCode = "PIN code must be 6 digits";
    }

    if (step === 4) {
      // Only require files that are not pre-filled
      ["photo", "panFile", "aadhaarFile", "addressProofFile"].forEach((f) => {
        if (!files[f] && !preFilledFiles[f]) {
          newErrors[f] = "Required";
        }
      });
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
      const aadhaarNumberClean = formData.aadhaarNumber.replace(/\D/g, "");

      let addressId;

      if (kycDetail?.location?.id) {
        const addressPayload = {
          stateId: formData.stateId,
          cityId: formData.cityId,
          address: formData.address,
          pinCode: formData.pinCode,
        };

        await dispatch(
          updateEntity("address-update", kycDetail.location.id, addressPayload)
        );
        addressId = kycDetail.location.id;
      } else {
        const addressPayload = {
          userId,
          stateId: formData.stateId,
          cityId: formData.cityId,
          address: formData.address,
          pinCode: formData.pinCode,
        };

        const addressRes = await dispatch(
          createEntity("address-store", addressPayload)
        );
        addressId = addressRes.data?.id;
      }

      const kycPayload = new FormData();
      kycPayload.append("firstName", formData.firstName);
      kycPayload.append("lastName", formData.lastName);
      kycPayload.append("fatherName", formData.fatherName);
      kycPayload.append("dob", formData.dob);
      kycPayload.append("gender", formData.gender);
      kycPayload.append("panNumber", formData.panNumber);
      kycPayload.append("aadhaarNumber", aadhaarNumberClean);
      kycPayload.append("addressId", addressId);

      if (files.photo) kycPayload.append("photo", files.photo);
      if (files.panFile) kycPayload.append("panFile", files.panFile);
      if (files.aadhaarFile)
        kycPayload.append("aadhaarFile", files.aadhaarFile);
      if (files.addressProofFile)
        kycPayload.append("addressProofFile", files.addressProofFile);

      if (kycDetail && kycDetail.id) {
        await dispatch(
          updatekycSubmit({
            id: kycDetail.id,
            data: kycPayload,
          })
        );
      } else {
        await dispatch(kycSubmit(kycPayload));
      }

      if (!kycDetail || kycDetail.status === "REJECT") {
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
        setPreFilledFiles({
          photo: false,
          panFile: false,
          aadhaarFile: false,
          addressProofFile: false,
        });
      }

      // Refresh KYC data
      dispatch(getbyId());
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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading KYC status...</p>
        </div>
      </div>
    );
  }

  // Don't show form if KYC is APPROVE or PENDING
  if (kycDetail && kycDetail.status !== "REJECT") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-white" size={32} />
              <h1 className="text-3xl font-bold text-white">
                KYC Verification
              </h1>
            </div>
            <p className="text-cyan-50">Your KYC verification status</p>
          </div>

          {/* KYC Status Card */}
          <KYCStatusCard kycDetail={kycDetail} />

          {/* Additional info for VERIFIED KYC */}
          {kycDetail.status === "VERIFIED" && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                KYC Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{kycDetail.profile?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">PAN Number</p>
                  <p className="font-semibold">
                    {
                      kycDetail.documents?.find((doc) => doc.type === "PAN")
                        ?.value
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Aadhaar Number</p>
                  <p className="font-semibold">
                    {
                      kycDetail.documents?.find((doc) => doc.type === "AADHAAR")
                        ?.value
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold">{kycDetail.location?.address}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show KYC form only if no KYC exists or status is REJECT
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
            {kycDetail?.status === "REJECT"
              ? "Please correct your KYC information and resubmit"
              : "Complete your KYC to access all features"}
          </p>
        </div>

        {/* Show reject reason if KYC was rejected */}
        {kycDetail?.status === "REJECT" && (
          <KYCStatusCard kycDetail={kycDetail} />
        )}

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
                placeholder="1234-5678-9012"
                maxLength={14}
              />
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
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
              </div>
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
                options={filteredCities}
                error={errors.cityId}
                placeholder={
                  formData.stateId ? "Select city" : "First select state"
                }
                disabled={!formData.stateId}
              />
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FileUpload
                label="User Photo"
                name="photo"
                icon={Camera}
                onChange={handleFileChange}
                filePreview={filePreviews.photo}
                file={files.photo}
                error={errors.photo}
                isPreFilled={preFilledFiles.photo}
              />
              <FileUpload
                label="PAN File"
                name="panFile"
                icon={FileText}
                onChange={handleFileChange}
                filePreview={filePreviews.panFile}
                file={files.panFile}
                error={errors.panFile}
                isPreFilled={preFilledFiles.panFile}
              />

              <FileUpload
                label="Aadhaar File"
                name="aadhaarFile"
                icon={FileText}
                accept=".pdf"
                onChange={handleFileChange}
                filePreview={filePreviews.aadhaarFile}
                file={files.aadhaarFile}
                error={errors.aadhaarFile}
                isPreFilled={preFilledFiles.aadhaarFile}
              />

              <FileUpload
                label="Address Proof"
                name="addressProofFile"
                icon={FileText}
                onChange={handleFileChange}
                filePreview={filePreviews.addressProofFile}
                file={files.addressProofFile}
                error={errors.addressProofFile}
                isPreFilled={preFilledFiles.addressProofFile}
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
