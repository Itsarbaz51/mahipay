import { useState } from "react";
import {
  Smartphone,
  Building2,
  CreditCard,
  User,
  IndianRupee,
  Send,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Search,
} from "lucide-react";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";
import CloseBtn from "../ui/CloseBtn";
import Title from "../ui/Title";

const MoneyTransferForm = ({ onClose }) => {
  const bankOptions = [
    { value: "SBIN0000001", name: "STATE BANK OF INDIA" },
    { value: "BARB0HEADOF", name: "BANK OF BARODA" },
    { value: "HDFC0999999", name: "HDFC BANK" },
    { value: "KKBK0RTGSMI", name: "Kotak Mahindra Bank" },
  ];

  const [formData, setFormData] = useState({
    customerMobile: "",
    bank: "",
    bankIfsc: "",
    accountNo: "",
    ifsc: "",
    name: "",
    amount: "",
  });

  const [errors, setErrors] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // new state
  const [linkedAccount, setLinkedAccount] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);

  // dummy check: API simulation
  const checkMobileLinked = async (mobile) => {
    if (mobile === "9876543210") {
      return {
        bank: "HDFC BANK",
        bankIfsc: "HDFC0999999",
        accountNo: "1234567890",
        ifsc: "HDFC0999999",
        name: "Rahul Sharma",
      };
    }
    return null;
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (name === "customerMobile" && value.length === 10) {
      const account = await checkMobileLinked(value);
      if (account) {
        setLinkedAccount(account);
        setShowAccountForm(false);
        setFormData((prev) => ({
          ...prev,
          ...account,
          customerMobile: value,
        }));
      } else {
        setLinkedAccount(null);
        setShowAccountForm(true);
      }
    }
  };

  const handleBankSelect = (bank) => {
    setFormData((prev) => ({
      ...prev,
      bank: bank.name,
      bankIfsc: bank.value,
      ifsc: bank.value,
    }));
    setIsDropdownOpen(false);
    setSearchTerm("");
    if (errors.bank) {
      setErrors((prev) => ({ ...prev, bank: "" }));
    }
  };

  const filteredBanks = bankOptions.filter((bank) =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <Title />
        {/* <CloseBtn isClose={onClose} /> */}
      </div>

      {/* Form */}
      <div className="p-6 space-y-6">
        {/* Customer Mobile */}
        <InputField
          name="customerMobile"
          inputType="number"
          placeholderName="Customer Number"
          handleChange={handleInputChange}
          valueData={formData.customerMobile}
          icon={Smartphone}
          error={errors.customerMobile}
          required
          maxLength={10}
        />

        {/* Linked Account Found */}
        {linkedAccount && (
          <div className="p-4 border rounded-xl bg-gray-50">
            <p className="font-medium text-gray-700">Linked Account Found:</p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">{linkedAccount.name}</span>
              <br />
              {linkedAccount.bank} - {linkedAccount.accountNo}
            </p>
          </div>
        )}

        {/* New Account Form */}
        {showAccountForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Selection */}
            <div className="col-span-1">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                Select Bank <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left flex items-center justify-between ${
                    errors.bank
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                >
                  <span
                    className={
                      formData.bank ? "text-gray-900" : "text-gray-500"
                    }
                  >
                    {formData.bank || "Select bank"}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    <div className="sticky top-0 bg-white p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search banks..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    {filteredBanks.length > 0 ? (
                      filteredBanks.map((bank) => (
                        <button
                          key={bank.value}
                          type="button"
                          onClick={() => handleBankSelect(bank)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{bank.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {bank.value}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-gray-500">
                        No banks found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.bank && (
                <p className="flex items-center mt-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.bank}
                </p>
              )}
            </div>

            {/* Account Number */}
            <InputField
              name="accountNo"
              inputType="number"
              placeholderName="Account Number"
              handleChange={handleInputChange}
              valueData={formData.accountNo}
              icon={CreditCard}
              error={errors.accountNo}
              required
            />

            {/* IFSC Code */}
            <InputField
              name="ifsc"
              inputType="text"
              placeholderName="IFSC Code"
              handleChange={handleInputChange}
              valueData={formData.ifsc}
              icon={Building2}
              error={errors.ifsc}
              required
            />

            {/* Customer Name */}
            <InputField
              name="name"
              inputType="text"
              placeholderName="Customer Name"
              handleChange={handleInputChange}
              valueData={formData.name}
              icon={User}
              error={errors.name}
              required
            />
          </div>
        )}

        {/* Amount */}
        <InputField
          name="amount"
          inputType="number"
          placeholderName="Enter Amount"
          handleChange={handleInputChange}
          valueData={formData.amount}
          icon={IndianRupee}
          error={errors.amount}
          required
        />

        {/* Buttons */}
        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <ButtonField
            isOpen={() => alert("Transfer Initiated")}
            name="Transfer Now"
            icon={Send}
            type="button"
            btncss="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          />

          <ButtonField
            isOpen={() => alert("Account Verified")}
            name="Verify Account"
            icon={CheckCircle}
            type="button"
            btncss="w-full bg-white text-gray-700 py-3 px-6 rounded-xl font-semibold border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
};

export default MoneyTransferForm;
