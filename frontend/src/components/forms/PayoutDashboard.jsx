import React from "react";

const PayoutDashboard = () => {
  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        background: "#f8f0f0",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#d7e7f7",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Welcome back harmeek Singh!</h2>
          <h3 style={{ margin: "5px 0" }}>
            <span style={{ fontWeight: "bold", fontSize: "24px" }}>
              ₹996152
            </span>{" "}
            Wallet Balance
          </h3>
          <h4 style={{ margin: "5px 0", color: "#3fba5a" }}>
            ₹0 <span style={{ fontSize: "14px" }}>Today Profit</span>
          </h4>
        </div>
        <img
          src="https://cdn-icons-png.flaticon.com/512/2942/2942536.png"
          alt="User Avatar"
          style={{ width: 80, height: 80, borderRadius: "50%" }}
        />
      </div>

      {/* Payout Card */}
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ marginBottom: "20px" }}>Payout</h3>
        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          <div
            style={{
              flex: "1 1 200px",
              background: "#f0f8ff",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>
              Last six Months
            </div>
            <input
              type="text"
              readOnly
              value="Last six Months"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "10px",
                borderRadius: "5px",
              }}
            />
          </div>

          <div
            style={{
              flex: "1 1 100px",
              background: "#f0f8ff",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <label>Amount From</label>
            <input
              type="number"
              defaultValue="100"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "8px",
                borderRadius: "5px",
              }}
            />
          </div>

          <div
            style={{
              flex: "1 1 100px",
              background: "#f0f8ff",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <label>Amount To</label>
            <input
              type="number"
              defaultValue="10000"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "8px",
                borderRadius: "5px",
              }}
            />
          </div>

          <div
            style={{
              flex: "1 1 150px",
              background: "#f0f8ff",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <label>Select Order</label>
            <input
              type="text"
              readOnly
              value="Desc."
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "8px",
                borderRadius: "5px",
              }}
            />
          </div>

          <div
            style={{
              flex: "1 1 150px",
              background: "#f0f8ff",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <label>Select type</label>
            <input
              type="text"
              readOnly
              value="SUCCESS"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "8px",
                borderRadius: "5px",
              }}
            />
          </div>
        </div>

        <button
          style={{
            marginTop: "30px",
            padding: "12px 25px",
            backgroundColor: "#007bff",
            border: "none",
            borderRadius: "6px",
            color: "white",
            cursor: "pointer",
            fontSize: "16px",
          }}
          onClick={() => alert("Fetching transactions...")}
        >
          Fetch Transactions
        </button>
      </div>
    </div>
  );
};

export default PayoutDashboard;
