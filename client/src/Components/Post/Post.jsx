"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Search,
  Filter,
  MapPin,
  User,
  UserRound,
  BadgeDollarSign,
  Briefcase,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Send,
  X,
  Lock,
  CheckCircle2,
  PlusCircle,
  CalendarDays,
  Crown,
  Gauge,
  WalletCards,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { restoreUser } from "../../Redux/UserSlice/UserSlice";

const API_BASE_URL = "http://localhost:4000/api";
const API_URL = `${API_BASE_URL}/posts`;

const categoryOptions = [
  "family",
  "criminal",
  "property",
  "corporate",
  "civil",
  "tax",
  "labour",
  "cyber",
  "immigration",
  "other",
];

const postCategoryOptions = [
  "family",
  "criminal",
  "property",
  "corporate",
  "civil",
  "tax",
  "labour",
  "cyber",
  "immigration",
  "other",
];

const urgencyOptions = ["high", "medium", "low"];
const postUrgencyOptions = ["low", "medium", "high"];
const statusOptions = ["open", "in_progress", "closed", "cancelled"];

const statusFetchMap = {
  open: ["open"],
  in_progress: ["in_progress"],
  closed: ["closed"],
  cancelled: ["cancelled"],
  all: ["open", "in_progress", "closed", "cancelled"],
};

const initialCreatePostForm = {
  title: "",
  description: "",
  category: "other",
  budgetMin: "",
  budgetMax: "",
  urgency: "medium",
  division: "",
  district: "",
  documents: "",
  expiresAt: "",
};

const getStoredToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
};

const getStoredUser = () => {
  const localUser = localStorage.getItem("currentUser");
  const sessionUser = sessionStorage.getItem("currentUser");

  try {
    return JSON.parse(localUser || sessionUser || "null");
  } catch {
    return null;
  }
};

const getUserId = (user) => {
  return user?._id || user?.id || "";
};

const isUnlimitedValue = (value) => {
  return Number(value) === 999999 || Number(value) === 9999;
};

const getNumericFeature = (subscription, key, fallback = 0) => {
  const value = subscription?.features?.[key];

  if (value === undefined || value === null || value === "") return fallback;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return fallback;

  return numberValue;
};

const getBooleanFeature = (subscription, key) => {
  const value = subscription?.features?.[key];

  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";

  return Boolean(value);
};

const formatLimit = (limit) => {
  if (isUnlimitedValue(limit)) return "Unlimited";
  return Number(limit || 0).toLocaleString("en-BD");
};

const formatBudget = (min, max) => {
  const minValue = Number(min || 0);
  const maxValue = Number(max || 0);

  if (!minValue && !maxValue) return "Budget not specified";
  if (minValue && maxValue) return `৳${minValue} - ৳${maxValue}`;
  if (!minValue && maxValue) return `Up to ৳${maxValue}`;

  return `From ৳${minValue}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "Recently posted";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Recently posted";

  return date.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatOptionLabel = (value) => {
  if (!value) return "";

  return value
    .replace("_", " ")
    .split(" ")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
};

const isDateInRange = (dateValue, startDate, endDate) => {
  if (!dateValue || !startDate || !endDate) return false;

  const date = new Date(dateValue);
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(date.getTime()) ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return false;
  }

  return date >= start && date <= end;
};

const getApiErrorMessage = (payload, fallback = "Request failed") => {
  if (!payload) return fallback;

  if (
    payload.message?.toLowerCase?.().includes("case post limit reached") &&
    payload.limit !== undefined
  ) {
    return `Case post limit reached. Used ${payload.used || 0} of ${
      payload.limit
    } posts in this subscription period.`;
  }

  if (
    payload.message?.toLowerCase?.().includes("proposal limit reached") &&
    payload.limit !== undefined
  ) {
    return `Proposal limit reached. Used ${payload.used || 0} of ${
      payload.limit
    } proposals in this subscription period.`;
  }

  return payload.message || fallback;
};

const hasExplicitVerificationValue = (user) => {
  if (!user) return false;

  const verificationKeys = [
    "isVerified",
    "isEmailVerified",
    "emailVerified",
    "isPhoneVerified",
    "phoneVerified",
    "isVerifiedLawyer",
    "verified",
  ];

  return verificationKeys.some(
    (key) => user[key] !== undefined && user[key] !== null
  );
};

const isVerifiedUser = (user) => {
  if (!user) return false;

  const hasExplicitValue = hasExplicitVerificationValue(user);

  if (!hasExplicitValue) return true;

  return Boolean(
    user?.isVerified ||
      user?.isEmailVerified ||
      user?.emailVerified ||
      user?.isPhoneVerified ||
      user?.phoneVerified ||
      user?.isVerifiedLawyer ||
      user?.verified
  );
};

const Post = () => {
  const dispatch = useDispatch();
  const reduxCurrentUser = useSelector((state) => state.user.currentUser);
  const didRestoreUser = useRef(false);

  const [currentUser, setCurrentUser] = useState(
    reduxCurrentUser || getStoredUser()
  );

  const [posts, setPosts] = useState([]);

  const [postsMeta, setPostsMeta] = useState({
    limit: 20,
    hasNextPage: false,
    nextCursor: null,
  });

  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastRequestUrl, setLastRequestUrl] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedUrgency, setSelectedUrgency] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("open");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedPost, setSelectedPost] = useState(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");

  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [createPostSubmitting, setCreatePostSubmitting] = useState(false);
  const [createPostError, setCreatePostError] = useState("");
  const [createPostSuccess, setCreatePostSuccess] = useState("");
  const [createPostForm, setCreatePostForm] = useState(initialCreatePostForm);

  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState("");

  const [clientUsage, setClientUsage] = useState({
    usedPosts: 0,
    loading: false,
  });

  const [bidForm, setBidForm] = useState({
    proposedFee: "",
    estimatedDays: "",
    message: "",
  });

  const userId = getUserId(currentUser);
  const userRole = currentUser?.role || "";

  const isLoggedIn = Boolean(userId);
  const isClient = userRole === "client";
  const isLawyer = userRole === "lawyer";
  const isAdmin = userRole === "admin";
  const isAccountVerified = isVerifiedUser(currentUser);

  const shouldShowLoginAction =
    !isLoggedIn || (isLawyer && !isAccountVerified);

  const hasActiveSubscription =
    currentSubscription?.status === "active" ||
    currentUser?.subscriptionStatus === "active";

  const isPaidSubscription = Number(currentSubscription?.price || 0) > 0;

  const subscriptionPlanName =
    currentSubscription?.planName || currentSubscription?.plan?.name || "";

  const casePostLimit = getNumericFeature(
    currentSubscription,
    "case_post_limit",
    0
  );

  const proposalLimit = getNumericFeature(
    currentSubscription,
    "proposal_limit",
    0
  );

  const contactUnlock = getBooleanFeature(currentSubscription, "contact_unlock");
  const inAppMessaging = getBooleanFeature(
    currentSubscription,
    "in_app_messaging"
  );

  const casePostRemaining = isUnlimitedValue(casePostLimit)
    ? 999999
    : Math.max(casePostLimit - clientUsage.usedPosts, 0);

  const canClientCreatePost =
    isAdmin ||
    (isClient &&
      isLoggedIn &&
      hasActiveSubscription &&
      casePostLimit > 0 &&
      (isUnlimitedValue(casePostLimit) ||
        clientUsage.usedPosts < casePostLimit));

  const showClientUpgrade =
    !isAdmin &&
    isClient &&
    !isPaidSubscription &&
    (!hasActiveSubscription ||
      casePostLimit <= 0 ||
      (!isUnlimitedValue(casePostLimit) &&
        clientUsage.usedPosts >= casePostLimit));

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (selectedCategory !== "all") count += 1;
    if (selectedUrgency !== "all") count += 1;
    if (selectedLocation !== "all") count += 1;
    if (selectedStatus !== "open") count += 1;

    return count;
  }, [selectedCategory, selectedUrgency, selectedLocation, selectedStatus]);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (reduxCurrentUser) {
      setCurrentUser(reduxCurrentUser);
      return;
    }

    if (storedUser) {
      setCurrentUser(storedUser);

      if (!didRestoreUser.current) {
        didRestoreUser.current = true;
        dispatch(restoreUser(storedUser));
      }

      return;
    }

    setCurrentUser(null);
  }, [reduxCurrentUser, dispatch]);

  const fetchCurrentSubscription = useCallback(async () => {
    const token = getStoredToken();

    if (!token || !userId || !["client", "lawyer"].includes(userRole)) {
      setCurrentSubscription(null);
      setSubscriptionError("");
      setSubscriptionLoading(false);
      return;
    }

    try {
      setSubscriptionLoading(true);
      setSubscriptionError("");

      const response = await fetch(`${API_BASE_URL}/subscriptions/my/current`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "No active subscription found");
      }

      setCurrentSubscription(data.data || null);
    } catch (err) {
      setCurrentSubscription(null);
      setSubscriptionError(err.message || "No active subscription found");
    } finally {
      setSubscriptionLoading(false);
    }
  }, [userId, userRole]);

  useEffect(() => {
    fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);

  const fetchClientPostUsage = useCallback(async () => {
    const token = getStoredToken();

    if (!token || !isClient || !currentSubscription?._id || isAdmin) {
      setClientUsage({ usedPosts: 0, loading: false });
      return;
    }

    try {
      setClientUsage((prev) => ({ ...prev, loading: true }));

      const response = await fetch(`${API_URL}/client/my-posts?limit=100`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to fetch usage");
      }

      const usedPosts = (data.data || []).filter((post) =>
        isDateInRange(
          post.createdAt,
          currentSubscription.startDate,
          currentSubscription.endDate
        )
      ).length;

      setClientUsage({
        usedPosts,
        loading: false,
      });
    } catch {
      setClientUsage({
        usedPosts: 0,
        loading: false,
      });
    }
  }, [
    isClient,
    isAdmin,
    currentSubscription?._id,
    currentSubscription?.startDate,
    currentSubscription?.endDate,
  ]);

  useEffect(() => {
    fetchClientPostUsage();
  }, [fetchClientPostUsage]);

  const buildQuery = useCallback(
    ({ cursor = null, statusOverride = "open" } = {}) => {
      const params = new URLSearchParams();

      params.set("limit", "20");

      if (cursor) params.set("cursor", cursor);

      if (statusOverride && statusOverride !== "all") {
        params.set("status", statusOverride);
      }

      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      if (selectedUrgency !== "all") {
        params.set("urgency", selectedUrgency);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      return params.toString();
    },
    [selectedCategory, selectedUrgency, search]
  );

  const fetchSingleStatusPosts = useCallback(
    async ({ status, cursor = null } = {}) => {
      const query = buildQuery({
        cursor,
        statusOverride: status,
      });

      const url = `${API_URL}?${query}`;
      setLastRequestUrl(url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to fetch posts");
      }

      return data;
    },
    [buildQuery]
  );

  const fetchPosts = useCallback(
    async ({ cursor = null, append = false } = {}) => {
      try {
        if (append) {
          setLoadMoreLoading(true);
        } else {
          setLoading(true);
        }

        setError("");

        const statusesToFetch = statusFetchMap[selectedStatus] || ["open"];

        if (selectedStatus === "all" && !cursor) {
          const responses = await Promise.all(
            statusesToFetch.map((status) => fetchSingleStatusPosts({ status }))
          );

          const mergedPosts = responses.flatMap((item) => item.data || []);
          const uniquePosts = Array.from(
            new Map(mergedPosts.map((post) => [post._id, post])).values()
          ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          setPosts(uniquePosts);

          setPostsMeta({
            limit: 20,
            hasNextPage: false,
            nextCursor: null,
          });

          return;
        }

        const data = await fetchSingleStatusPosts({
          status: selectedStatus === "all" ? "open" : selectedStatus,
          cursor,
        });

        setPosts((prev) =>
          append ? [...prev, ...(data.data || [])] : data.data || []
        );

        setPostsMeta(
          data.meta || {
            limit: 20,
            hasNextPage: false,
            nextCursor: null,
          }
        );
      } catch (err) {
        setError(err.message || "Failed to fetch posts");

        if (!append) {
          setPosts([]);
          setPostsMeta({
            limit: 20,
            hasNextPage: false,
            nextCursor: null,
          });
        }
      } finally {
        setLoading(false);
        setLoadMoreLoading(false);
      }
    },
    [selectedStatus, fetchSingleStatusPosts]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedLocation("all");
      fetchPosts();
    }, 400);

    return () => clearTimeout(timer);
  }, [fetchPosts]);

  const locations = useMemo(() => {
    const uniqueLocations = [
      ...new Set(
        posts
          .map((post) =>
            [post.division, post.district].filter(Boolean).join(", ")
          )
          .filter(Boolean)
      ),
    ];

    return uniqueLocations;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const locationText = [post.division, post.district]
        .filter(Boolean)
        .join(", ")
        .toLowerCase();

      const selectedLocationText = selectedLocation.toLowerCase();

      return selectedLocation === "all" || locationText === selectedLocationText;
    });
  }, [posts, selectedLocation]);

  const getUrgencyClasses = (urgency) => {
    switch (urgency) {
      case "high":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "low":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "open":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "closed":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedUrgency("all");
    setSelectedLocation("all");
    setSelectedStatus("open");
  };

  const handleLoadMore = () => {
    if (!postsMeta.nextCursor || loadMoreLoading) return;

    fetchPosts({
      cursor: postsMeta.nextCursor,
      append: true,
    });
  };

  const handleRefresh = async () => {
    await fetchCurrentSubscription();
    await fetchPosts();
  };

  const openCreatePostModal = () => {
    setCreatePostForm(initialCreatePostForm);
    setCreatePostError("");
    setCreatePostSuccess("");

    if (!isLoggedIn) {
      setCreatePostError("Please login first.");
      setIsCreatePostModalOpen(true);
      return;
    }

    if (isAdmin) {
      setIsCreatePostModalOpen(true);
      return;
    }

    if (!isClient) {
      setCreatePostError("Only clients can create case posts.");
      setIsCreatePostModalOpen(true);
      return;
    }

    if (!hasActiveSubscription) {
      setCreatePostError("You need an active subscription to create case posts.");
      setIsCreatePostModalOpen(true);
      return;
    }

    if (casePostLimit <= 0) {
      setCreatePostError("Your current plan does not allow case posting.");
      setIsCreatePostModalOpen(true);
      return;
    }

    if (
      !isUnlimitedValue(casePostLimit) &&
      clientUsage.usedPosts >= casePostLimit
    ) {
      setCreatePostError(
        `Case post limit reached. Used ${clientUsage.usedPosts} of ${casePostLimit} posts.`
      );
      setIsCreatePostModalOpen(true);
      return;
    }

    setIsCreatePostModalOpen(true);
  };

  const closeCreatePostModal = () => {
    if (createPostSubmitting) return;

    setCreatePostForm(initialCreatePostForm);
    setCreatePostError("");
    setCreatePostSuccess("");
    setIsCreatePostModalOpen(false);
  };

  const handleCreatePostChange = (e) => {
    const { name, value } = e.target;

    setCreatePostForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitCreatePost = async (e) => {
    e.preventDefault();

    const token = getStoredToken();

    if (!token || !isLoggedIn) {
      setCreatePostError("Please login first.");
      return;
    }

    if (!isAdmin && !isClient) {
      setCreatePostError("Only clients can create case posts.");
      return;
    }

    if (!isAdmin && !hasActiveSubscription) {
      setCreatePostError("You need an active subscription to create case posts.");
      return;
    }

    if (!isAdmin && !canClientCreatePost) {
      setCreatePostError(
        isPaidSubscription
          ? "Your case post limit is reached for this subscription period."
          : "Your case post limit is reached. Please upgrade your plan."
      );
      return;
    }

    if (!createPostForm.title.trim() || !createPostForm.description.trim()) {
      setCreatePostError("Title and description are required.");
      return;
    }

    const minBudget = Number(createPostForm.budgetMin || 0);
    const maxBudget = Number(createPostForm.budgetMax || 0);

    if (maxBudget > 0 && minBudget > maxBudget) {
      setCreatePostError("Maximum budget must be greater than minimum budget.");
      return;
    }

    try {
      setCreatePostSubmitting(true);
      setCreatePostError("");
      setCreatePostSuccess("");
      setSuccessMessage("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: createPostForm.title.trim(),
          description: createPostForm.description.trim(),
          category: createPostForm.category,
          budgetMin: Number(createPostForm.budgetMin || 0),
          budgetMax: Number(createPostForm.budgetMax || 0),
          urgency: createPostForm.urgency,
          division: createPostForm.division.trim(),
          district: createPostForm.district.trim(),
          documents: createPostForm.documents,
          expiresAt: createPostForm.expiresAt || null,
          isPriority: 0,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        const apiError = new Error(
          getApiErrorMessage(data, "Failed to create post")
        );
        apiError.payload = data;
        throw apiError;
      }

      setCreatePostSuccess(data.message || "Post created successfully.");
      setSuccessMessage(data.message || "Post created successfully.");

      setPosts((prev) => [data.data, ...prev]);

      if (!isAdmin) {
        setClientUsage((prev) => ({
          ...prev,
          usedPosts: prev.usedPosts + 1,
        }));
      }

      setTimeout(() => {
        closeCreatePostModal();
      }, 900);
    } catch (err) {
      setCreatePostError(
        getApiErrorMessage(err.payload, err.message || "Failed to create post")
      );
    } finally {
      setCreatePostSubmitting(false);
    }
  };

  const openBidModal = (post) => {
    setSelectedPost(post);
    setBidError("");
    setBidSuccess("");
    setBidForm({
      proposedFee: "",
      estimatedDays: "",
      message: "",
    });
    setIsBidModalOpen(true);
  };

  const closeBidModal = () => {
    if (bidSubmitting) return;

    setIsBidModalOpen(false);
    setSelectedPost(null);
    setBidError("");
    setBidSuccess("");
    setBidForm({
      proposedFee: "",
      estimatedDays: "",
      message: "",
    });
  };

  const handleBidFormChange = (e) => {
    const { name, value } = e.target;

    setBidForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitBid = async (e) => {
    e.preventDefault();

    if (!selectedPost?._id) {
      setBidError("Post not selected.");
      return;
    }

    const token = getStoredToken();

    if (!token || !isLoggedIn) {
      setBidError("Please login first.");
      return;
    }

    if (!isLawyer && !isAdmin) {
      setBidError("Only lawyers can send proposals.");
      return;
    }

    if (!isAdmin && !isAccountVerified) {
      setBidError("Please login with a verified lawyer account.");
      return;
    }

    if (!isAdmin && !hasActiveSubscription) {
      setBidError("You need an active subscription to send proposals.");
      return;
    }

    if (!isAdmin && proposalLimit <= 0) {
      setBidError("Your current plan does not allow proposal sending.");
      return;
    }

    if (!bidForm.proposedFee || !bidForm.estimatedDays || !bidForm.message) {
      setBidError("Proposed fee, estimated days and message are required.");
      return;
    }

    try {
      setBidSubmitting(true);
      setBidError("");
      setBidSuccess("");

      const response = await fetch(`${API_URL}/${selectedPost._id}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proposedFee: Number(bidForm.proposedFee),
          estimatedDays: Number(bidForm.estimatedDays),
          message: bidForm.message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        const apiError = new Error(
          getApiErrorMessage(data, "Failed to send proposal")
        );
        apiError.payload = data;
        throw apiError;
      }

      setBidSuccess(data?.message || "Proposal sent successfully.");

      setPosts((prev) =>
        prev.map((item) => (item._id === selectedPost._id ? data.data : item))
      );

      setTimeout(() => {
        closeBidModal();
      }, 900);
    } catch (err) {
      setBidError(
        getApiErrorMessage(err.payload, err.message || "Failed to send proposal")
      );
    } finally {
      setBidSubmitting(false);
    }
  };

  const alreadyBidOnPost = (post) => {
    if (!currentUser?._id && !currentUser?.id) return false;

    const id = getUserId(currentUser);

    return Boolean(
      post?.bids?.some((bid) => {
        const lawyerId = bid?.lawyer?._id || bid?.lawyer;
        return String(lawyerId) === String(id);
      })
    );
  };

  const getPostActionState = (post) => {
    if (!isLoggedIn) {
      return {
        type: "login",
        label: "Login",
        disabled: false,
        reason: "",
      };
    }

    if (isAdmin) {
      return {
        type: "details",
        label: "View Details",
        disabled: false,
        reason: "",
      };
    }

    if (isClient) {
      return {
        type: "details",
        label: "View Details",
        disabled: false,
        reason: "",
      };
    }

    if (!isLawyer) {
      return {
        type: "details",
        label: "View Details",
        disabled: false,
        reason: "",
      };
    }

    if (!isAccountVerified) {
      return {
        type: "login",
        label: "Login",
        disabled: false,
        reason: "",
      };
    }

    if (post.status !== "open") {
      return {
        type: "proposal",
        label: "Closed",
        disabled: true,
        reason: "Proposal is available only for open posts.",
      };
    }

    if (!hasActiveSubscription) {
      return {
        type: "proposal",
        label: "Subscription Required",
        disabled: true,
        reason: "Active subscription required.",
      };
    }

    if (proposalLimit <= 0) {
      return {
        type: "proposal",
        label: "Not Allowed",
        disabled: true,
        reason: "Your plan does not allow proposals.",
      };
    }

    if (alreadyBidOnPost(post)) {
      return {
        type: "proposal",
        label: "Proposal Sent",
        disabled: true,
        reason: "You already sent a proposal.",
      };
    }

    return {
      type: "proposal",
      label: "Send Proposal",
      disabled: false,
      reason: "",
    };
  };

  return (
    <main className="min-h-screen bg-slate-50 pt-24">
      <section className="bg-white pb-7 pt-7">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3.5 py-1.5 text-xs font-black text-cyan-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Legal Case Marketplace
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
              Legal Case Posts
            </h1>

            <div className="mx-auto mt-7 flex max-w-3xl items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, description, category..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-black transition ${
                  showFilters
                    ? "border-cyan-600 bg-cyan-700 text-white shadow-lg shadow-cyan-700/20"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                }`}
                aria-label="Toggle filters"
              >
                {showFilters ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}

                {activeFilterCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-700 px-1.5 text-[10px] font-black text-white ring-2 ring-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center justify-center gap-3 text-xs font-bold text-slate-500 sm:flex-row">
              <span>
                Showing{" "}
                <span className="font-black text-slate-950">
                  {filteredPosts.length}
                </span>{" "}
                loaded post{filteredPosts.length !== 1 ? "s" : ""}
              </span>

              <span className="hidden h-1.5 w-1.5 rounded-full bg-slate-300 sm:block" />

              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3.5 py-1.5 text-xs font-black text-cyan-700 ring-1 ring-cyan-100">
                <Briefcase className="h-3.5 w-3.5" />
                Status:{" "}
                {selectedStatus === "all"
                  ? "All"
                  : formatOptionLabel(selectedStatus)}
              </span>

              {isAdmin && (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin access unlocked
                </span>
              )}

              {shouldShowLoginAction && !isAdmin && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login to access actions
                </Link>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {isLoggedIn && (isClient || isAdmin) && (
                <button
                  type="button"
                  onClick={openCreatePostModal}
                  disabled={subscriptionLoading && !isAdmin}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {subscriptionLoading && !isAdmin ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                  Add Post
                </button>
              )}

              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-800"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              )}

              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {showFilters && (
          <motion.section
            className="relative z-10 pb-8"
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 md:p-6">
                <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-950">
                      Filter Posts
                    </h2>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Choose filters to narrow down the legal case posts list.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Reset Filters
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold capitalize text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="all">All Categories</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {formatOptionLabel(category)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedUrgency}
                    onChange={(e) => setSelectedUrgency(e.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="all">All Urgency</option>
                    {urgencyOptions.map((urgency) => (
                      <option key={urgency} value={urgency}>
                        {formatOptionLabel(urgency)} Urgency
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="all">All Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatOptionLabel(status)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="all">All Locations</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="pb-20 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-cyan-100 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
              Showing {filteredPosts.length} loaded posts
            </span>

            {isAdmin && (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                Full admin access
              </span>
            )}

            {!isAdmin && isClient && currentSubscription && (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 shadow-sm">
                <Gauge className="h-4 w-4" />
                Posts: {clientUsage.usedPosts} / {formatLimit(casePostLimit)}
              </span>
            )}

            {!isAdmin && isLawyer && currentSubscription && (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 shadow-sm">
                <WalletCards className="h-4 w-4" />
                Proposals: {formatLimit(proposalLimit)}
              </span>
            )}

            {postsMeta.hasNextPage && selectedStatus !== "all" && (
              <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700 shadow-sm">
                More posts available
              </span>
            )}
          </div>

          {successMessage && (
            <div className="mb-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p>{error}</p>
                {lastRequestUrl && (
                  <p className="mt-1 break-all text-xs text-red-600">
                    Request: {lastRequestUrl}
                  </p>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto mb-4 h-11 w-11 animate-spin text-cyan-700" />
                <p className="text-sm font-black text-slate-600">
                  Loading case posts...
                </p>
              </div>
            </div>
          ) : filteredPosts.length > 0 ? (
            <>
              <motion.div
                className="grid gap-8 md:grid-cols-2 xl:grid-cols-3"
                initial="hidden"
                animate="visible"
              >
                {filteredPosts.map((post, index) => {
                  const location = [post.division, post.district]
                    .filter(Boolean)
                    .join(", ");

                  const actionState = getPostActionState(post);

                  return (
                    <motion.article
                      key={post._id}
                      className="group overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl"
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.45,
                        delay: Math.min(index * 0.04, 0.25),
                      }}
                    >
                      <div className="relative bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-6">
                        <div className="absolute right-5 top-5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black capitalize ring-1 ${getStatusClasses(
                              post.status
                            )}`}
                          >
                            {post.status?.replace("_", " ") || "open"}
                          </span>
                        </div>

                        <div className="flex items-start gap-4 pr-24">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-cyan-700 text-white ring-4 ring-white shadow-sm">
                            <UserRound className="h-8 w-8" />
                          </div>

                          <div className="min-w-0 pt-1">
                            <p className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-black capitalize text-cyan-700 ring-1 ring-cyan-100">
                              {post.category || "Legal Post"}
                            </p>

                            <h2 className="mt-3 line-clamp-2 text-xl font-black tracking-tight text-slate-950">
                              {post.title || "Untitled Post"}
                            </h2>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5 p-6">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getUrgencyClasses(
                              post.urgency
                            )}`}
                          >
                            {post.urgency || "medium"} urgency
                          </span>

                          {Number(post.isPriority) === 1 && (
                            <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                              Priority
                            </span>
                          )}
                        </div>

                        <p className="line-clamp-3 min-h-[72px] text-sm font-medium leading-6 text-slate-500">
                          {post.description || "No description provided."}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-cyan-700">
                              <User className="h-4 w-4" />
                              Client
                            </div>

                            <p className="mt-2 truncate text-sm font-black text-slate-950">
                              {post.client?.name || "Anonymous"}
                            </p>
                          </div>

                          <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-cyan-700">
                              <BadgeDollarSign className="h-4 w-4" />
                              Budget
                            </div>

                            <p className="mt-2 truncate text-sm font-black text-slate-950">
                              {formatBudget(post.budgetMin, post.budgetMax)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                              <MapPin className="h-4 w-4" />
                              Location
                            </span>

                            <span className="max-w-[170px] truncate text-sm font-black text-slate-800">
                              {location || "Not specified"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                              <CalendarDays className="h-4 w-4" />
                              Posted
                            </span>

                            <span className="text-sm font-black text-slate-800">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                              <FileText className="h-4 w-4" />
                              Proposals
                            </span>

                            <span className="text-sm font-black text-slate-800">
                              {post.bids?.length || 0}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Link
                            to={`/posts/${post._id}`}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100"
                          >
                            <FileText className="h-4 w-4" />
                            Details
                          </Link>

                          {actionState.type === "login" && !isClient && !isAdmin && (
                            <Link
                              to="/login"
                              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
                            >
                              <LogIn className="h-4 w-4" />
                              Login
                            </Link>
                          )}

                          {actionState.type === "proposal" && (
                            <button
                              type="button"
                              onClick={() => openBidModal(post)}
                              disabled={actionState.disabled}
                              title={actionState.reason}
                              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-black text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                            >
                              {actionState.disabled ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              {actionState.label}
                            </button>
                          )}
                        </div>

                        {actionState.reason && (
                          <p className="text-xs font-semibold text-slate-500">
                            {actionState.reason}
                          </p>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>

              {postsMeta.hasNextPage && selectedStatus !== "all" && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadMoreLoading}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {loadMoreLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                    Load More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <UserRound className="h-8 w-8" />
              </div>

              <h3 className="mt-5 text-2xl font-black text-slate-950">
                No posts found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                No legal case post matched your current search or filter
                options.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
              >
                <RefreshCcw className="h-4 w-4" />
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {isCreatePostModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-cyan-100 bg-white/95 px-6 py-5 backdrop-blur">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    Create Case Post
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {isAdmin
                      ? "Admin access unlocked"
                      : `Your limit: ${clientUsage.usedPosts} / ${formatLimit(
                          casePostLimit
                        )} posts`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreatePostModal}
                  disabled={createPostSubmitting}
                  className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submitCreatePost} className="space-y-5 p-6">
                {!isLoggedIn ? (
                  <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
                    <div className="flex gap-3 text-sm font-bold leading-6 text-amber-800">
                      <LogIn className="mt-0.5 h-5 w-5 shrink-0" />
                      <span>Please login first to create a case post.</span>
                    </div>

                    <Link
                      to="/login"
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
                    >
                      <LogIn className="h-4 w-4" />
                      Login
                    </Link>
                  </div>
                ) : (
                  <>
                    {isAdmin && (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-black text-emerald-900">
                          Admin Mode
                        </p>
                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                          Subscription and post limits are unlocked for admin.
                        </p>
                      </div>
                    )}

                    {!isAdmin && currentSubscription && (
                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                        <p className="text-sm font-black text-cyan-900">
                          Active Plan: {subscriptionPlanName || "Current Plan"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-cyan-700">
                          Remaining posts:{" "}
                          {isUnlimitedValue(casePostLimit)
                            ? "Unlimited"
                            : casePostRemaining}
                        </p>
                      </div>
                    )}

                    {((!canClientCreatePost && !isAdmin) || createPostError) && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {createPostError ||
                          (isPaidSubscription
                            ? "Your case post limit is reached for this subscription period."
                            : "Your plan does not have enough case post access.")}
                      </div>
                    )}

                    {createPostSuccess && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                        {createPostSuccess}
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Title *
                      </label>
                      <input
                        name="title"
                        value={createPostForm.title}
                        onChange={handleCreatePostChange}
                        placeholder="Example: Need help with property dispute"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        rows={5}
                        value={createPostForm.description}
                        onChange={handleCreatePostChange}
                        placeholder="Describe your legal issue..."
                        className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Category
                        </label>
                        <select
                          name="category"
                          value={createPostForm.category}
                          onChange={handleCreatePostChange}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold capitalize outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        >
                          {postCategoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Urgency
                        </label>
                        <select
                          name="urgency"
                          value={createPostForm.urgency}
                          onChange={handleCreatePostChange}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold capitalize outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        >
                          {postUrgencyOptions.map((urgency) => (
                            <option key={urgency} value={urgency}>
                              {urgency}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Minimum Budget
                        </label>
                        <input
                          type="number"
                          name="budgetMin"
                          min="0"
                          value={createPostForm.budgetMin}
                          onChange={handleCreatePostChange}
                          placeholder="0"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Maximum Budget
                        </label>
                        <input
                          type="number"
                          name="budgetMax"
                          min="0"
                          value={createPostForm.budgetMax}
                          onChange={handleCreatePostChange}
                          placeholder="0"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Division
                        </label>
                        <input
                          name="division"
                          value={createPostForm.division}
                          onChange={handleCreatePostChange}
                          placeholder="Example: Dhaka"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          District
                        </label>
                        <input
                          name="district"
                          value={createPostForm.district}
                          onChange={handleCreatePostChange}
                          placeholder="Example: Dhaka"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Expires At
                        </label>
                        <input
                          type="date"
                          name="expiresAt"
                          value={createPostForm.expiresAt}
                          onChange={handleCreatePostChange}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Documents
                        </label>
                        <input
                          name="documents"
                          value={createPostForm.documents}
                          onChange={handleCreatePostChange}
                          placeholder="Comma separated document URLs"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                      <button
                        type="button"
                        onClick={closeCreatePostModal}
                        disabled={createPostSubmitting}
                        className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Cancel
                      </button>

                      {showClientUpgrade && !isPaidSubscription && (
                        <Link
                          to="/plans"
                          className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white hover:bg-amber-600"
                        >
                          <Crown className="h-4 w-4" />
                          Upgrade Plan
                        </Link>
                      )}

                      <button
                        type="submit"
                        disabled={
                          createPostSubmitting ||
                          (!canClientCreatePost && !isAdmin)
                        }
                        className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                      >
                        {createPostSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PlusCircle className="h-4 w-4" />
                        )}
                        Create Post
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBidModalOpen && selectedPost && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-cyan-100 bg-white/95 px-6 py-5 backdrop-blur">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    Send Proposal
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {isAdmin
                      ? "Admin access unlocked"
                      : `Plan: ${
                          subscriptionPlanName || "Active plan"
                        } • Proposal limit: ${formatLimit(proposalLimit)}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeBidModal}
                  disabled={bidSubmitting}
                  className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submitBid} className="space-y-5 p-6">
                {!isLoggedIn ? (
                  <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
                    <div className="flex gap-3 text-sm font-bold leading-6 text-amber-800">
                      <LogIn className="mt-0.5 h-5 w-5 shrink-0" />
                      <span>Please login first to send a proposal.</span>
                    </div>

                    <Link
                      to="/login"
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
                    >
                      <LogIn className="h-4 w-4" />
                      Login
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                      <p className="text-sm font-black text-cyan-900">
                        {selectedPost.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-cyan-700">
                        {selectedPost.description}
                      </p>

                      {isAdmin && (
                        <p className="mt-2 text-xs font-bold text-emerald-700">
                          Admin access is unlocked for this action.
                        </p>
                      )}

                      {!isAdmin && contactUnlock && (
                        <p className="mt-2 text-xs font-bold text-cyan-800">
                          Contact unlock is included in your active plan.
                        </p>
                      )}

                      {!isAdmin && inAppMessaging && (
                        <p className="mt-1 text-xs font-bold text-cyan-800">
                          In-app messaging is included in your active plan.
                        </p>
                      )}
                    </div>

                    {bidError && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {bidError}
                      </div>
                    )}

                    {bidSuccess && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                        {bidSuccess}
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Proposed Fee *
                        </label>
                        <input
                          type="number"
                          name="proposedFee"
                          min="0"
                          value={bidForm.proposedFee}
                          onChange={handleBidFormChange}
                          placeholder="Example: 5000"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Estimated Days *
                        </label>
                        <input
                          type="number"
                          name="estimatedDays"
                          min="1"
                          value={bidForm.estimatedDays}
                          onChange={handleBidFormChange}
                          placeholder="Example: 7"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        rows={5}
                        value={bidForm.message}
                        onChange={handleBidFormChange}
                        placeholder="Explain how you can help this client..."
                        className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      />
                    </div>

                    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                      <button
                        type="button"
                        onClick={closeBidModal}
                        disabled={bidSubmitting}
                        className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={bidSubmitting}
                        className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                      >
                        {bidSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send Proposal
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Post;