import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { createRouter } from "./routes/routes";
import { Provider, useDispatch } from "react-redux";
import store from "./redux/store.js";
import { ToastContainer } from "react-toastify";
import { verifyAuth } from "./redux/slices/authSlice";
import { InputSelect } from "./components/ui/Input_select.jsx";

const AppContent = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(verifyAuth());
  }, [dispatch]);

  const router = createRouter();

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
    <InputSelect />
  </Provider>
);

export default App;
