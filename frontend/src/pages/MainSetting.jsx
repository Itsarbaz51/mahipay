import React, { useState, useEffect } from "react";
import { Upload, Save, Loader2, X } from "lucide-react";
import {
  fetchSystemSetting,
  upsertSystemSetting,
} from "../redux/slices/settingSlice";
import { useDispatch, useSelector } from "react-redux";

const MainSetting = () => {
  const dispatch = useDispatch();
  const {
    data,
    loading: isLoading,
    error,
    success,
  } = useSelector((state) => state.setting || {});

  const [formData, setFormData] = useState({
    companyName: "",
    companyLogo: "",
    favIcon: "",
    phoneNumber: "",
    whtsappNumber: "",
    companyEmail: "",
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
  });

  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  // File validation function
  const validateFile = (file, maxSizeMB = 5) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];

    if (!validTypes.includes(file.type)) {
      throw new Error(
        "Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed"
      );
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }

    return true;
  };

  // Fetch settings when component loads
  useEffect(() => {
    dispatch(fetchSystemSetting());
  }, [dispatch]);

  // Set data from Redux into form when fetched
  useEffect(() => {
    if (data) {
      setFormData({
        companyName: data.companyName || "",
        companyLogo: data.companyLogo || "",
        favIcon: data.favIcon || "",
        phoneNumber: data.phoneNumber || "",
        whtsappNumber: data.whtsappNumber || "",
        companyEmail: data.companyEmail || "",
        facebookUrl: data.facebookUrl || "",
        instagramUrl: data.instagramUrl || "",
        twitterUrl: data.twitterUrl || "",
        linkedinUrl: data.linkedinUrl || "",
        websiteUrl: data.websiteUrl || "",
      });

      if (data.companyLogo) setLogoPreview(data.companyLogo);
      if (data.favIcon) setFaviconPreview(data.favIcon);
    }
  }, [data]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (faviconPreview && faviconPreview.startsWith("blob:")) {
        URL.revokeObjectURL(faviconPreview);
      }
    };
  }, [logoPreview, faviconPreview]);

  // Input handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      try {
        validateFile(file);

        const preview = URL.createObjectURL(file);

        if (fieldName === "companyLogo") {
          setLogoPreview(preview);
          setLogoFile(file);
        } else if (fieldName === "favIcon") {
          setFaviconPreview(preview);
          setFaviconFile(file);
        }
      } catch (error) {
        toast.error(error.message);
        e.target.value = "";
      }
    }
  };

  const removeFile = (fieldName) => {
    if (fieldName === "companyLogo") {
      setLogoPreview("");
      setLogoFile(null);
      setFormData((prev) => ({ ...prev, companyLogo: "" }));
    } else if (fieldName === "favIcon") {
      setFaviconPreview("");
      setFaviconFile(null);
      setFormData((prev) => ({ ...prev, favIcon: "" }));
    }
  };

  // ✅ HELPER: Convert input into FormData
  const buildFormData = (payload) => {
    const formData = new FormData();

    const textFields = [
      "companyName",
      "phoneNumber",
      "whtsappNumber",
      "companyEmail",
      "facebookUrl",
      "instagramUrl",
      "twitterUrl",
      "linkedinUrl",
      "websiteUrl",
    ];

    // Add all text fields
    textFields.forEach((field) => {
      if (payload[field] !== undefined && payload[field] !== null) {
        formData.append(field, payload[field]);
      }
    });

    // Company logo
    if (payload.companyLogo instanceof File) {
      formData.append("companyLogo", payload.companyLogo);
    } else if (typeof payload.companyLogo === "string" && payload.companyLogo) {
      formData.append("existingCompanyLogo", payload.companyLogo);
    }

    // Favicon
    if (payload.favIcon instanceof File) {
      formData.append("favIcon", payload.favIcon);
    } else if (typeof payload.favIcon === "string" && payload.favIcon) {
      formData.append("existingFavIcon", payload.favIcon);
    }

    return formData;
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      companyLogo: logoFile || formData.companyLogo,
      favIcon: faviconFile || formData.favIcon,
    };

    dispatch(upsertSystemSetting(buildFormData(payload)));
  };

  return (
    <div className="">
      <div className="">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Company Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Email
                  </label>
                  <input
                    type="email"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="company@example.com"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 flex flex-col items-center justify-center px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600 text-center">
                        Click to upload logo
                        <br />
                        <span className="text-xs text-gray-500">
                          JPEG, PNG, GIF, WebP, SVG (Max 5MB)
                        </span>
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "companyLogo")}
                        className="hidden"
                      />
                    </label>
                    {logoPreview && (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-20 h-20 object-contain rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile("companyLogo")}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favicon
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 flex flex-col items-center justify-center px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600 text-center">
                        Click to upload favicon
                        <br />
                        <span className="text-xs text-gray-500">
                          JPEG, PNG, GIF, WebP, SVG (Max 5MB)
                        </span>
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "favIcon")}
                        className="hidden"
                      />
                    </label>
                    {faviconPreview && (
                      <div className="relative">
                        <img
                          src={faviconPreview}
                          alt="Favicon preview"
                          className="w-20 h-20 object-contain rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile("favIcon")}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Contact Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+91 1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    name="whtsappNumber"
                    value={formData.whtsappNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+91 1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Social Media Links
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    "facebookUrl",
                    "instagramUrl",
                    "twitterUrl",
                    "linkedinUrl",
                  ].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {field.replace("Url", " URL")}
                      </label>
                      <input
                        type="url"
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={`https://${field.replace(
                          "Url",
                          ".com/..."
                        )}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Settings saved successfully!
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MainSetting;
