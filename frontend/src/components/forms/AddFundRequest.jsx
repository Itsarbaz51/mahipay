import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminBank } from "../../redux/slices/bankSlice";
import { addFunds } from "../../redux/slices/walletSlice";
import { toast } from "react-toastify";
import axios from "axios";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";

const generateOrderId = (prefix = "ORD") => {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}_${year}_${randomDigits}`;
};

const AddFundRequest = () => {
  const dispatch = useDispatch();
  const { bankData } = useSelector((state) => state.bank);

  const [form, setForm] = useState({
    account: "",
    ifsc: "",
    name: "",
    amount: "",
    rrn: "",
    date: "",
    file: null,
  });

  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dispatch(getAdminBank());
  }, [dispatch]);

  useEffect(() => {
    if (bankData) {
      setForm((prev) => ({
        ...prev,
        account: bankData.accountNumber,
        ifsc: bankData.ifscCode,
        name: bankData.accountHolder,
      }));
    }
  }, [bankData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({
      ...prev,
      file: e.target.files[0],
    }));
  };

  const handleRazorpayPayment = async () => {
    if (!form.amount || form.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);

    try {
      const { data } = await axios.post("/wallet/create-order", {
        amount: form.amount,
      });

      const order = data.data;

      if (!window.Razorpay) {
        toast.error("Razorpay SDK not loaded. Please refresh the page.");
        setIsProcessing(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Your App Name",
        description: "Wallet Top-up",
        order_id: order.id,
        handler: async function (response) {
          try {
            await axios.post("/wallet/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setForm({ rrn: "", date: "", amount: "", file: null });
          } catch (err) {
            toast.error("Payment verification failed");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: "Arbaz Khan",
          email: "arbaz@example.com",
          contact: "9876543210",
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Unable to start payment");
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!form.rrn) {
      toast.error("RRN/UTR is required");
      return;
    }
    if (!form.file) {
      toast.error("Receipt is required");
      return;
    }

    setIsProcessing(true);
    const orderId = generateOrderId("BT");

    const formData = new FormData();
    formData.append("amount", parseFloat(form.amount));
    formData.append("provider", "BANK_TRANSFER");
    formData.append("paymentId", form.rrn);
    formData.append("orderId", orderId);
    formData.append("paymentImage", form.file);

    dispatch(addFunds(formData))
      .then(() => {
        setForm((prev) => ({
          ...prev,
          rrn: "",
          date: "",
          amount: "",
          file: null,
        }));
      })
      .finally(() => setIsProcessing(false));
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Add Fund Request
            </h1>
            <div className="flex items-center text-slate-500 text-sm">
              <span>Dashboard</span>
              <span className="mx-2">•</span>
              <span className="text-indigo-600 font-medium">Fund Request</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Side */}
        <div className="space-y-6">
          {/* Bank Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              Bank Account Details
            </h3>
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border-2 border-indigo-200 space-y-3">
              <p className="flex justify-between">
                <span className="font-medium">Account Number:</span>
                <span>{bankData?.accountNumber || "-"}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">IFSC Code:</span>
                <span>{bankData?.ifscCode || "-"}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">Bank Name:</span>
                <span>{bankData?.bankName || "-"}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">Account Holder:</span>
                <span>{bankData?.accountHolder || "-"}</span>
              </p>
            </div>
          </div>

          {/* Payment Method Select */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              Choose Payment Method
            </h3>
            <SelectField
              name="paymentMethod"
              label="Payment Method"
              value={paymentMethod}
              handleChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: "bank_transfer", label: "Bank Transfer" },
                { value: "razorpay", label: "Razorpay" },
              ]}
            />
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Fund Request Details
          </h3>

          <div className="space-y-6">
            <InputField
              name="amount"
              inputType="number"
              placeholderName="Enter amount"
              handleChange={handleInputChange}
              valueData={form.amount}
            />

            {paymentMethod === "razorpay" ? (
              <button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={isProcessing || !form.amount}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Pay with Razorpay"}
              </button>
            ) : (
              <>
                <InputField
                  name="rrn"
                  inputType="text"
                  placeholderName="Enter RRN/UTR"
                  handleChange={handleInputChange}
                  valueData={form.rrn}
                />
                <InputField
                  name="date"
                  inputType="date"
                  placeholderName="Select transaction date"
                  handleChange={handleInputChange}
                  valueData={form.date}
                />

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Payment Receipt
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".png,.jpg,.jpeg,.pdf"
                    className="w-full"
                  />
                  {form.file && (
                    <p className="text-sm text-indigo-600 mt-1">
                      {form.file.name}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl disabled:opacity-50"
                >
                  {isProcessing ? "Submitting..." : "Submit Fund Request"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFundRequest;
