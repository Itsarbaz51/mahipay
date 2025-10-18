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
      dispatch(verifyKyc(selectedId, "VERIFIED"));
    }

    setShowModal(false);
  };

  const handleRejectSubmit = () => {
    dispatch(verifyKyc(selectedId, "REJECT", rejectionReason));
    setShowRejectModal(false);
    setRejectionReason("");
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Reject KYC
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
              >
                Reject
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
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex justify-center items-center">
                            {kyc?.profile?.photo ? (
                              <img
                                src={kyc.profile.photo}
                                alt={kyc.profile.name}
                                className="w-full h-full rounded-full object-contain"
                              />
                            ) : (
                              <span className="text-white font-semibold">
                                {kyc?.profile?.name?.[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {kyc.profile?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID #{kyc.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center">
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
                          <div key={doc.id}>
                            {doc.type}: {doc.value}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-1" />
                          <div>
                            <div>{kyc.location?.address}</div>
                            <div className="text-xs text-gray-500">
                              {kyc.location?.city}, {kyc.location?.state}
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
                              >
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              </button>
                              <button
                                onClick={() =>
                                  handleActionClick("REJECT", kyc.id)
                                }
                              >
                                <X className="w-5 h-5 text-red-600" />
                              </button>
                            </>
                          )}
                          <button onClick={() => handleViewShow(kyc.id)}>
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
