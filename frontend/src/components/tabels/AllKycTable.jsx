import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  X,
  Clock,
  Shield,
  FileText,
  MapPin,
  Phone,
  Mail,
  User,
  AlertCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getbyId, getKycAll, verifyKyc } from "../../redux/slices/kycSlice";
import StateCard from "../ui/StateCard";
import PageHeader from "../ui/PageHeader";
import ConfirmCard from "../ui/ConfirmCard";
import Kyc from "../../pages/view/Kyc";
import Pagination from "../ui/Pagination";
import { useDebounce } from "use-debounce";

const AllKycTable = () => {
  const dispatch = useDispatch();

  // UI State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewKyc, setShowViewKyc] = useState(false);

  const [debouncedSearch] = useDebounce(search, 400);
  const limit = 10;

  // Redux State
  const kycProfiles = useSelector((state) => state.kyc?.kycList?.data) || [];
  const kycMeta = useSelector((state) => state.kyc?.kycList?.meta);
  const kycDetail = useSelector((state) => state.kyc?.kycDetail);
  const totalPages = kycMeta?.totalPages || 1;

  // Fetch KYC data
  useEffect(() => {
    dispatch(
      getKycAll({
        page: currentPage,
        limit,
        status: statusFilter,
        search: debouncedSearch,
      })
    );
  }, [dispatch, currentPage, statusFilter, debouncedSearch]);

  // Status card counts
  const statusCounts = useMemo(() => {
    return {
      total: kycProfiles.length,
      verified: kycProfiles.filter((p) => p.status === "VERIFIED").length,
      pending: kycProfiles.filter((p) => p.status === "PENDING").length,
      rejected: kycProfiles.filter((p) => p.status === "REJECT").length,
    };
  }, [kycProfiles]);

  const statusCards = [
    {
      title: "Total",
      value: statusCounts.total,
      icon: User,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Verified",
      value: statusCounts.verified,
      icon: Shield,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Pending",
      value: statusCounts.pending,
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Rejected",
      value: statusCounts.rejected,
      icon: AlertCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  const [loading, setLoading] = useState(false);

  // Function to fetch KYC data
  const fetchKycData = async () => {
    setLoading(true);
    await dispatch(
      getKycAll({
        page: currentPage,
        limit,
        status: statusFilter,
        search: debouncedSearch,
      })
    );
    setLoading(false);
  };

  // useEffect for initial load & filter/search change
  useEffect(() => {
    fetchKycData();
  }, [currentPage, statusFilter, debouncedSearch]);

  const getStatusConfig = (status) => {
    const config = {
      VERIFIED: {
        classes: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        icon: <Shield className="w-3 h-3" />,
      },
      PENDING: {
        classes: "bg-amber-50 text-amber-700 border border-amber-200",
        icon: <Clock className="w-3 h-3" />,
      },
      REJECT: {
        classes: "bg-red-50 text-red-700 border border-red-200",
        icon: <AlertCircle className="w-3 h-3" />,
      },
    };
    return (
      config[status] || {
        classes: "bg-gray-50 text-gray-700 border border-gray-300",
        icon: <FileText className="w-3 h-3" />,
      }
    );
  };

  const handleActionClick = (action, id) => {
    setSelectedAction(action);
    setSelectedId(id);
    setShowModal(true);
  };

  const handleViewShow = async (id) => {
    await dispatch(getbyId(id));
    setShowViewKyc(true);
  };

  const confirmAction = () => {
    if (selectedAction === "REJECT") {
      setShowModal(false);
      setShowRejectModal(true);
      return;
    }

    if (selectedAction === "VERIFIED") {
      dispatch(
        verifyKyc({
          id: selectedId,
          status: "VERIFIED",
          kycRejectionReason: "",
        })
      );
    }

    setShowModal(false);
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason");
      return;
    }

    dispatch(
      verifyKyc({
        id: selectedId,
        status: "REJECT",
        kycRejectionReason: rejectionReason.trim(),
      })
    );

    setShowRejectModal(false);
    setRejectionReason("");
    setSelectedAction(null);
    setSelectedId(null);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason("");
    setSelectedAction(null);
    setSelectedId(null);
  };

  return (
    <div>
      {/* Confirm Modal */}
      {showModal && (
        <ConfirmCard
          actionType={selectedAction}
          isClose={() => setShowModal(false)}
          isSubmit={confirmAction}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Reject KYC
              </h3>
              <button
                onClick={handleCloseRejectModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                required
              />
              {!rejectionReason.trim() && (
                <p className="text-red-500 text-xs mt-1">
                  Rejection reason is required
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseRejectModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 space-y-3">
        <PageHeader
          breadcrumb={["Dashboard", "KYC Management"]}
          title="KYC Profiles"
          description="Review and manage customer verification documents"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, idx) => (
            <StateCard key={idx} {...card} />
          ))}
        </div>
      </div>

      {/* Filter/Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="p-6 border-b border-gray-300 bg-gray-50/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or phone"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-blue-300"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2.5 border border-gray-300 rounded-lg outline-blue-300"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECT">Rejected</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchKycData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : null}
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <th className="px-6 py-4">Profile</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Documents</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kycProfiles.length > 0 ? (
                kycProfiles.map((kyc) => {
                  const { classes, icon } = getStatusConfig(kyc.status);
                  return (
                    <tr key={kyc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex justify-center items-center overflow-hidden">
                            {kyc?.profile?.photo ? (
                              <img
                                src={kyc.profile.photo}
                                alt={kyc.profile.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 font-semibold text-lg">
                                {kyc?.profile?.name?.[0]?.toUpperCase() || "U"}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {kyc.profile?.name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID #{kyc.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center mb-1">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {kyc.profile?.phone || "N/A"}
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {kyc.profile?.email || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {kyc.documents?.map((doc) => (
                          <div key={doc.id} className="mb-1 last:mb-0">
                            <span className="font-medium">{doc.type}:</span>{" "}
                            {doc.value}
                          </div>
                        )) || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {kyc?.type === "USER_KYC" ? "USER KYC" : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-1 flex-shrink-0" />
                          <div>
                            <div className="line-clamp-2">
                              {kyc.location?.address || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {kyc.location?.city || "N/A"},{" "}
                              {kyc.location?.state || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full ${classes}`}
                        >
                          {icon}
                          <span className="ml-1">{kyc.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {kyc.status === "PENDING" && (
                            <>
                              <button
                                onClick={() =>
                                  handleActionClick("VERIFIED", kyc.id)
                                }
                                className="p-1 hover:bg-green-50 rounded transition-colors"
                                title="Approve KYC"
                              >
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              </button>

                              <button
                                onClick={() =>
                                  handleActionClick("REJECT", kyc.id)
                                }
                                className="p-1 hover:bg-red-50 rounded transition-colors"
                                title="Reject KYC"
                              >
                                <X className="w-5 h-5 text-red-600" />
                              </button>
                            </>
                          )}

                          {kyc.status === "VERIFIED" && (
                            <>
                              <button
                                onClick={() =>
                                  handleActionClick("REJECT", kyc.id)
                                }
                                className="p-1 hover:bg-red-50 rounded transition-colors"
                                title="Reject KYC"
                              >
                                <X className="w-5 h-5 text-red-600" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleViewShow(kyc.id)}
                            className="p-1 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5 text-blue-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No KYC profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View KYC Modal */}
      {showViewKyc && kycDetail && (
        <Kyc viewedKyc={kycDetail} onClose={() => setShowViewKyc(false)} />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          if (page >= 1 && page <= totalPages) setCurrentPage(page);
        }}
      />
    </div>
  );
};

export default AllKycTable;
