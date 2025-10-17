import { useState, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { createRouter } from "./routes/routes";
import { Provider, useSelector, useDispatch } from "react-redux";
import store from "./redux/store.js";
import { ToastContainer } from "react-toastify";
import { logout } from "./redux/slices/authSlice";

const AppContent = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);

  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);


  // Mock Data Initialize
  useEffect(() => {
    const mockUsers = [];

    const mockTransactions = [
      {
        id: 1,
        user_id: 3,
        type: "payin",
        amount: 2000,
        status: "success",
        razorpay_order_id: "order_123",
        commission: 40,
        created_at: "2024-08-29 10:30:00",
      },
      {
        id: 2,
        user_id: 3,
        type: "payout",
        amount: 1500,
        status: "processing",
        razorpay_payout_id: "payout_456",
        commission: 30,
        created_at: "2024-08-29 11:15:00",
      },
    ];

    setUsers(mockUsers);
    setTransactions(mockTransactions);
  }, []);

  const router = createRouter({
    currentUser,
    transactions,
    users,
    setTransactions,
    setUsers,
    handleLogout: () => dispatch(logout()),
  });

  return <RouterProvider router={router} />;
};

const App = () => (
  <Provider store={store}>
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      pauseOnHover
    />
    <AppContent />
  </Provider>
);

export default App;
