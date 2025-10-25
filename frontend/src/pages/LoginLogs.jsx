import { useEffect, useState } from "react";
import { Search, Filter, MapPin } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import { useDispatch } from "react-redux";
import { getLoginLogs } from "../redux/slices/loginLogsslice";
// Sample data for login logs
const loginLogsData = [
  {
    id: 1,
    username: "MONEY",
    type: "ADMIN",
    ip: "183.83.55.42",
    lat: "26.9418496",
    log: "75.7497856",
    timestamp: "2024-01-15 10:30:00",
    location: "Jaipur, India",
  },
  {
    id: 2,
    username: "MONEY",
    type: "ADMIN",
    ip: "183.83.55.42",
    lat: "26.7505",
    log: "75.8246",
    timestamp: "2024-01-15 09:15:00",
    location: "Jaipur, India",
  },
  {
    id: 3,
    username: "MONEY",
    type: "ADMIN",
    ip: "183.83.55.42",
    lat: "26.7505",
    log: "75.8246",
    timestamp: "2024-01-14 16:45:00",
    location: "Jaipur, India",
  },
  {
    id: 4,
    username: "MONEY",
    type: "ADMIN",
    ip: "183.83.55.42",
    lat: "26.7505",
    log: "75.8246",
    timestamp: "2024-01-14 14:20:00",
    location: "Jaipur, India",
  },
  {
    id: 5,
    username: "MONEY",
    type: "ADMIN",
    ip: "183.83.55.42",
    lat: "26.7505",
    log: "75.8246",
    timestamp: "2024-01-13 11:30:00",
    location: "Jaipur, India",
  },
];

const LoginLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const filteredLogs = loginLogsData.filter(
    (log) =>
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm) ||
      log.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getLoginLogs());
  }, [dispatch]);

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="">
      <PageHeader
        breadcrumb={["Dashboard", "Settings", "Login Logs"]}
        title="Login Activity Logs"
        description="Monitor user login activities and locations"
      />

      <div className="bg-white rounded-xl border border-gray-300 shadow-sm mt-8">
        <div className="p-6 border-b border-gray-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Login Activity Logs
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Monitor user login activities and locations
              </p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  USER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TYPE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP ADDRESS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LOCATION
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TIMESTAMP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                        {getInitials(log.username)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {log.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: #{log.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {log.ip}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.location}</div>
                    <div className="text-xs text-gray-500">
                      {log.lat}, {log.log}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.timestamp}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      <MapPin className="h-4 w-4 mr-1" />
                      View Location
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of{" "}
            {filteredLogs.length} logs
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 py-1 border rounded-md ${
                  currentPage === idx + 1
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginLogs;
