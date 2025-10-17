import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Copy,
  FileText,
  FileSpreadsheet,
  Printer,
  X,
} from "lucide-react";
import PageHeader from "../ui/PageHeader";

const dummyEmployees = [
  {
    id: 1,
    name: "John Doe",
    username: "johndoe",
    phone: "9876543210",
    email: "john@example.com",
    joinDate: "2024-01-15",
    status: "active",
    department: "Sales",
  },
  {
    id: 2,
    name: "Jane Smith",
    username: "janesmith",
    phone: "9123456789",
    email: "jane@example.com",
    joinDate: "2024-02-10",
    status: "active",
    department: "Marketing",
  },
  {
    id: 3,
    name: "Ravi Kumar",
    username: "ravik",
    phone: "9998887776",
    email: "ravi.kumar@example.com",
    joinDate: "2024-01-28",
    status: "active",
    department: "Development",
  },
  {
    id: 4,
    name: "Ayesha Khan",
    username: "ayesha123",
    phone: "9822334455",
    email: "ayesha.khan@example.com",
    joinDate: "2024-02-15",
    status: "inactive",
    department: "HR",
  },
  {
    id: 5,
    name: "David Johnson",
    username: "davidj",
    phone: "9845612378",
    email: "david.j@example.com",
    joinDate: "2024-01-20",
    status: "active",
    department: "Finance",
  },
];

const EmployeeTable = () => {
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState(dummyEmployees);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    department: "Sales",
  });

  const filtered = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.username.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.username)
      return;

    const emp = {
      id: employees.length + 1,
      ...newEmployee,
      joinDate: new Date().toISOString().split("T")[0],
      status: "active",
    };

    setEmployees((prev) => [...prev, emp]);
    setNewEmployee({
      name: "",
      username: "",
      phone: "",
      email: "",
      department: "Sales",
    });
    setShowAddForm(false);
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getStatusColor = (status) => {
    return status === "active"
      ? "bg-green-100 text-green-600"
      : "bg-red-100 text-red-600";
  };

  const getDepartmentColor = (dept) => {
    const colors = {
      Sales: "bg-blue-100 text-blue-600",
      Marketing: "bg-purple-100 text-purple-600",
      Development: "bg-green-100 text-green-600",
      HR: "bg-orange-100 text-orange-600",
      Finance: "bg-indigo-100 text-indigo-600",
    };
    return colors[dept] || "bg-gray-100 text-gray-600";
  };

  const exportActions = [
    { name: "Copy", icon: Copy },
    { name: "CSV", icon: FileText },
    { name: "Excel", icon: FileSpreadsheet },
    { name: "PDF", icon: FileText },
    { name: "Print", icon: Printer },
  ];

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <PageHeader
          breadcrumb={["Dashboard", "Employee Management"]}
          title="Employee Management"
          description="Manage your team members and employee records"
        />
        <div className="flex gap-3 mt-4 sm:mt-0">
          <div className="flex gap-2">
            {exportActions.map((action) => (
              <button
                key={action.name}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors text-sm"
                title={action.name}
              >
                <action.icon className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">{action.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Add Employee Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-300 mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Employee
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter username"
                value={newEmployee.username}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={newEmployee.phone}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter email address"
                value={newEmployee.email}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={newEmployee.department}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    department: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Development">Development</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddEmployee}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Employee
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-300">
        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-gray-300">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, username, email, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMPLOYEE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CONTACT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DEPARTMENT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  JOIN DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length > 0 ? (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`h-10 w-10 rounded-full ${getAvatarColor(
                            emp.name
                          )} flex items-center justify-center text-white font-medium text-sm`}
                        >
                          {getInitials(emp.name)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {emp.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{emp.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{emp.email}</div>
                      <div className="text-sm text-gray-500">{emp.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDepartmentColor(
                          emp.department
                        )}`}
                      >
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(emp.joinDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          emp.status
                        )}`}
                      >
                        {emp.status.charAt(0).toUpperCase() +
                          emp.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-blue-600 p-1">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-green-600 p-1">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-lg mb-2">
                      No employees found
                    </div>
                    <div className="text-gray-500 text-sm">
                      {search
                        ? "Try adjusting your search terms"
                        : "Start by adding your first employee"}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {filtered.length} of {employees.length} employees
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Active:{" "}
              {employees.filter((emp) => emp.status === "active").length}
            </div>
            <div className="text-sm text-gray-600">
              Inactive:{" "}
              {employees.filter((emp) => emp.status === "inactive").length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTable;
