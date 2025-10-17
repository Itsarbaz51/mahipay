import {
  Building2,
  CreditCard,
  DollarSign,
  MoreHorizontal,
  Plus,
  User,
} from "lucide-react";
import { useState } from "react";
import CloseBtn from "../ui/CloseBtn";
import Title from "../ui/Title";

export const PayoutForm = ({ onClose }) => {
  const [customerNo] = useState("");
  const [selectAccount, setSelectAccount] = useState("");
  const [selectMode, setSelectMode] = useState("IMPS");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);

  const accounts = [
    { id: "acc1", name: "Account 1 - 1234567890" },
    { id: "acc2", name: "Account 2 - 0987654321" },
  ];

  const handleTransfer = () => {
    if (!selectAccount || !amount) {
      alert("Please select account and enter amount.");
      return;
    }
    alert(
      `Transfer requested for ${amount} via ${selectMode} from account ${selectAccount}`
    );
  };

  return (
    <div className="flex items-center justify-center w-full">
      {/* Payout Form */}
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-xl space-y-4">
        <div className="flex justify-between items-center">
          <Title />
          <CloseBtn isClose={onClose} />
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Customer Number
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={customerNo}
                readOnly
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Account *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectAccount}
                onChange={(e) => setSelectAccount(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
              >
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.name}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Transfer Mode *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectMode}
                onChange={(e) => setSelectMode(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
              >
                <option value="IMPS">IMPS - Instant Transfer</option>
                <option value="NEFT">NEFT - Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 justify-center items-center">
            <button
              onClick={handleTransfer}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Transfer Now
            </button>

            {/* <CloseBtn isClose={onClose} /> */}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {/* <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-xl font-bold text-gray-900">
              Recent Transactions
            </h4>
            <p className="text-sm text-gray-500">Latest payment activities</p>
          </div>
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            View All
          </button>
        </div>

        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-gray-500 font-medium">
                No recent transactions
              </p>
              <p className="text-gray-400 text-sm">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            transactions.map((tx, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-900">{tx.details}</p>
                  <p className="text-sm text-gray-500">{tx.customer}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-green-600">
                    {tx.status}
                  </span>
                  <button className="p-2 hover:bg-white rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div> */}
    </div>
  );
};
