"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Scale,
  Mail,
  Phone,
  BadgeCheck,
  ShieldCheck,
  Crown,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Briefcase,
  MessageCircle,
  Handshake,
  Send,
  CheckCircle2,
  XCircle,
  Wallet,
  CalendarDays,
  UserRound,
  Paperclip,
  Lock,
  RotateCcw,
  X,
  Camera,
  ImagePlus,
  MapPin,
  FileText,
  Clock,
  Save,
  UserCog,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL = "http://localhost:4000/api";

const POST_STATUSES = ["open", "in_progress", "closed", "cancelled"];

const LAWYER_SPECIALIZATIONS = [
  "Family Law",
  "Criminal Law",
  "Property Law",
  "Corporate Law",
  "Immigration Law",
  "Employment Law",
  "Tax Law",
  "Civil Law",
  "Cyber Law",
  "Other",
];

const LAWYER_AVAILABILITY = ["available", "busy", "offline"];

const GOOGLE_DRIVE_HOSTS = ["drive.google.com"];

const SOCIAL_MEDIA_HOSTS = [
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "linkedin.com",
  "www.linkedin.com",
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "t.me",
  "telegram.me",
  "wa.me",
  "whatsapp.com",
  "www.whatsapp.com",
  "messenger.com",
  "www.messenger.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "tiktok.com",
  "www.tiktok.com",
];

const BANGLADESH_PHONE_REGEX =
  /(?:\+?88)?01[3-9]\d{8}|(?:\+?8801[3-9]\d{8})/g;

const GENERIC_PHONE_REGEX = /(?:\+?\d[\d\s\-().]{6,}\d)/g;

const SOCIAL_HANDLE_REGEX =
  /(^|\s)@([a-zA-Z0-9._]{3,30})(?=\s|$|[.,!?])/g;

const PAYMENT_KEYWORDS_REGEX =
  /\b(bkash|b-kash|bikash|nagad|nogod|rocket|upay|surecash|payment number|send money|cash out|personal number|agent number|merchant number)\b/i;

const BDT_PAYMENT_TEXT_REGEX =
  /\b(?:bdt|tk|৳)\s*\d+|\d+\s*(?:bdt|tk|taka|৳)\b/i;

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

const getStoredAuth = () => {
  const localUser = localStorage.getItem("currentUser");
  const sessionUser = sessionStorage.getItem("currentUser");
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");

  try {
    if (localToken && localUser) {
      return {
        user: JSON.parse(localUser),
        token: localToken,
        storageType: "local",
      };
    }

    if (sessionToken && sessionUser) {
      return {
        user: JSON.parse(sessionUser),
        token: sessionToken,
        storageType: "session",
      };
    }
  } catch {
    return {
      user: null,
      token: "",
      storageType: "",
    };
  }

  return {
    user: null,
    token: "",
    storageType: "",
  };
};

const saveStoredUser = (user) => {
  const hasLocalToken = Boolean(localStorage.getItem("token"));
  const hasSessionToken = Boolean(sessionStorage.getItem("token"));

  if (hasLocalToken) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  }

  if (hasSessionToken) {
    sessionStorage.setItem("currentUser", JSON.stringify(user));
  }
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "L";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "L";

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toInputDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const getTodayInput = () => toInputDate(new Date());

const getFutureInput = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toInputDate(date);
};

const formatDay = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-BD", { weekday: "long" });
};

const normalizeSlotText = (value = "") =>
  String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const formatCurrency = (value, currency = "BDT") => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getSubscriptionBadgeClass = (status) => {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "expired":
      return "border-red-200 bg-red-50 text-red-700";
    case "cancelled":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "none":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const getBidBadgeClass = (status) => {
  switch (status) {
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "withdrawn":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const getConnectionBadgeClass = (status) => {
  switch (status) {
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "cancelled":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "blocked":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const getApprovalBadgeClass = (approved) => {
  return approved
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
};

const getFeatureValue = (features = {}, key) => {
  if (!features || typeof features !== "object") return null;
  return features[key];
};

const readableFeature = (value) => {
  if (value === true) return "Enabled";
  if (value === false) return "No";
  if (value === 999999 || value === 9999) return "Unlimited";
  if (value === null || value === undefined || value === "") return "Basic";
  return value;
};

const getOtherUser = (connection, user) => {
  const userId = String(user?._id || user?.id || "");

  if (String(connection?.client?._id || connection?.client) === userId) {
    return connection?.lawyer;
  }

  return connection?.client;
};

const isAppointmentConnection = (connection) => {
  return (
    connection?.sourceType === "booking" &&
    connection?.status === "accepted" &&
    Boolean(connection?.booking)
  );
};

const formatConsultationType = (value = "") => {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getAppointmentBadgeClass = (status) => {
  switch (status) {
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "completed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "cancelled":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const getConnectionContextTitle = (connection) => {
  if (connection?.sourceType === "booking" && connection?.booking) {
    return connection.booking.subject || "Appointment conversation";
  }

  return connection?.post?.title || "Case conversation";
};

const getConnectionContextSubtitle = (connection) => {
  if (connection?.sourceType === "booking" && connection?.booking) {
    const booking = connection.booking;
    return `${formatDate(booking.requestedDate)} at ${
      booking.requestedTime || "-"
    } • ${formatConsultationType(booking.consultationType)}`;
  }

  return connection?.post?.category || "Case conversation";
};

const isMyBid = (bid, user) => {
  const userId = String(user?._id || user?.id || "");
  const lawyerId = String(bid?.lawyer?._id || bid?.lawyer || "");

  return userId && lawyerId && userId === lawyerId;
};

const extractAttachmentLinks = (value = "") => {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const isPossiblePhoneNumber = (value = "") => {
  const cleaned = String(value).replace(/[\s\-()+]/g, "");
  return /^\d{7,15}$/.test(cleaned);
};

const isGoogleDriveLink = (value = "") => {
  try {
    const normalized = value.startsWith("www.") ? `https://${value}` : value;
    const url = new URL(normalized);

    return (
      url.protocol === "https:" &&
      GOOGLE_DRIVE_HOSTS.includes(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
};

const getHostnameFromTextUrl = (value = "") => {
  try {
    const normalized = value.startsWith("www.") ? `https://${value}` : value;
    const url = new URL(normalized);
    return url.hostname.toLowerCase();
  } catch {
    return "";
  }
};

const isSocialMediaLink = (value = "") => {
  const host = getHostnameFromTextUrl(value);

  if (!host) return false;

  return SOCIAL_MEDIA_HOSTS.some(
    (blockedHost) => host === blockedHost || host.endsWith(`.${blockedHost}`)
  );
};

const validateAttachmentLinks = (value = "") => {
  const links = extractAttachmentLinks(value);

  if (links.length === 0) {
    return {
      valid: true,
      links: [],
      message: "",
    };
  }

  for (const link of links) {
    if (isPossiblePhoneNumber(link)) {
      return {
        valid: false,
        links: [],
        message: "Phone numbers cannot be shared as attachments.",
      };
    }

    if (isSocialMediaLink(link)) {
      return {
        valid: false,
        links: [],
        message:
          "Social media links are not allowed. Only Google Drive links can be shared.",
      };
    }

    if (!isGoogleDriveLink(link)) {
      return {
        valid: false,
        links: [],
        message: "Only Google Drive links are allowed as attachments.",
      };
    }
  }

  return {
    valid: true,
    links,
    message: "",
  };
};

const validateChatMessageText = (value = "") => {
  const text = String(value || "").trim();

  BANGLADESH_PHONE_REGEX.lastIndex = 0;
  SOCIAL_HANDLE_REGEX.lastIndex = 0;
  URL_REGEX.lastIndex = 0;

  if (!text) {
    return {
      valid: false,
      message: "Message is required",
    };
  }

  if (BANGLADESH_PHONE_REGEX.test(text)) {
    BANGLADESH_PHONE_REGEX.lastIndex = 0;

    return {
      valid: false,
      message:
        "Phone numbers or payment numbers cannot be shared in chat. Please use the platform conversation only.",
    };
  }

  BANGLADESH_PHONE_REGEX.lastIndex = 0;

  const genericNumbers = text.match(GENERIC_PHONE_REGEX) || [];

  for (const item of genericNumbers) {
    const digitsOnly = item.replace(/\D/g, "");

    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      return {
        valid: false,
        message:
          "Phone numbers or payment numbers cannot be shared in chat. Please use the platform conversation only.",
      };
    }
  }

  if (PAYMENT_KEYWORDS_REGEX.test(text) || BDT_PAYMENT_TEXT_REGEX.test(text)) {
    return {
      valid: false,
      message:
        "Payment numbers, BDT payment details, bKash, Nagad, Rocket, or similar payment information cannot be shared in chat.",
    };
  }

  const urls = text.match(URL_REGEX) || [];

  for (const url of urls) {
    if (isSocialMediaLink(url)) {
      return {
        valid: false,
        message:
          "Social media links are not allowed in chat. Facebook, Instagram, WhatsApp, Telegram, LinkedIn, Twitter/X, YouTube, and TikTok links are blocked.",
      };
    }

    if (!isGoogleDriveLink(url)) {
      return {
        valid: false,
        message:
          "External links are not allowed in chat. Only Google Drive links can be shared using the attachment option.",
      };
    }
  }

  if (SOCIAL_HANDLE_REGEX.test(text)) {
    SOCIAL_HANDLE_REGEX.lastIndex = 0;

    return {
      valid: false,
      message:
        "Social media handles are not allowed in chat. Please continue communication inside the platform.",
    };
  }

  SOCIAL_HANDLE_REGEX.lastIndex = 0;

  return {
    valid: true,
    message: "",
  };
};

const isLawyerApproved = (user) => {
  return Boolean(
    user?.profileCompleted === true &&
      user?.phoneVerified === 1 &&
      user?.isVerifiedLawyer === true
  );
};

const LawyerDashboard = () => {
  const reduxUser = useSelector((state) => state.user.currentUser);

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [activeTab, setActiveTab] = useState("overview");

  const [activeSubscription, setActiveSubscription] = useState(null);
  const [connections, setConnections] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [attachmentText, setAttachmentText] = useState("");
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [chatError, setChatError] = useState("");

  const [availabilityList, setAvailabilityList] = useState([]);
  const [availabilityStartDate, setAvailabilityStartDate] = useState(getTodayInput());
  const [availabilityEndDate, setAvailabilityEndDate] = useState(getFutureInput(30));
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilitySuccess, setAvailabilitySuccess] = useState("");
  const [availabilityForm, setAvailabilityForm] = useState({
    date: getTodayInput(),
    slotsText: "09:00 AM\n10:00 AM\n11:00 AM",
    consultationTypes: ["online"],
    note: "",
  });
  const [blockRangeForm, setBlockRangeForm] = useState({
    startDate: getTodayInput(),
    endDate: getFutureInput(7),
    reason: "",
  });

  const [profilePreview, setProfilePreview] = useState("");

  const [profileForm, setProfileForm] = useState({
    specialization: "",
    experienceYears: "",
    bio: "",
    officeAddress: "",
    city: "",
    consultationFee: "",
    availability: "available",
    profileImage: null,
  });

  useEffect(() => {
    const storedAuth = getStoredAuth();

    if (reduxUser) {
      setAuthUser(reduxUser);
      setToken(storedAuth.token);
      return;
    }

    setAuthUser(storedAuth.user);
    setToken(storedAuth.token);
  }, [reduxUser]);

  const user = authUser;

  const authHeaders = useMemo(() => {
    if (!token) return {};

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const authOnlyHeaders = useMemo(() => {
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const activeFeatures = activeSubscription?.features || {};

  const hasActiveSubscription = useMemo(() => {
    return (
      activeSubscription?.status === "active" ||
      user?.subscriptionStatus === "active"
    );
  }, [activeSubscription?.status, user?.subscriptionStatus]);

  const canUseChat = useMemo(() => {
    if (user?.role === "admin") return true;
    return hasActiveSubscription;
  }, [hasActiveSubscription, user?.role]);

  const lawyerApproved = useMemo(() => isLawyerApproved(user), [user]);

  const fetchMe = useCallback(async () => {
    if (!token) return null;

    try {
      setLoadingProfile(true);

      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        return null;
      }

      const updatedUser = data.data || null;

      if (updatedUser) {
        setAuthUser(updatedUser);
        saveStoredUser(updatedUser);
      }

      return updatedUser;
    } catch {
      return null;
    } finally {
      setLoadingProfile(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      specialization: user.specialization || "",
      experienceYears:
        user.experienceYears !== undefined && user.experienceYears !== null
          ? String(user.experienceYears)
          : "",
      bio: user.bio || "",
      officeAddress: user.officeAddress || "",
      city: user.city || "",
      consultationFee:
        user.consultationFee !== undefined && user.consultationFee !== null
          ? String(user.consultationFee)
          : "",
      availability: user.availability || "available",
      profileImage: null,
    });

    setProfilePreview(user.profileImage || "");
  }, [user]);

  const fetchActiveSubscription = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingProfile(true);

      const res = await fetch(`${API_BASE_URL}/subscriptions/my/current`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setActiveSubscription(null);
        return;
      }

      setActiveSubscription(data.data || null);
    } catch {
      setActiveSubscription(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [token, authHeaders]);

  const fetchConnections = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingConnections(true);

      const res = await fetch(`${API_BASE_URL}/connections/my?limit=50`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setConnections([]);
        return;
      }

      setConnections(data.data || []);
    } catch {
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  }, [token, authHeaders]);

  const fetchMyAppointments = useCallback(async () => {
    if (!token || user?.role !== "lawyer") return;

    try {
      setLoadingAppointments(true);

      const res = await fetch(`${API_BASE_URL}/bookings/my?limit=50`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setAppointments([]);
        return;
      }

      setAppointments(Array.isArray(data.data) ? data.data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, [token, user?.role, authHeaders]);

  const fetchAllPostsForBids = useCallback(async () => {
    if (!token || user?.role !== "lawyer") return;

    try {
      setLoadingPosts(true);

      const responses = await Promise.all(
        POST_STATUSES.map(async (status) => {
          const res = await fetch(
            `${API_BASE_URL}/posts?status=${status}&limit=100`,
            {
              method: "GET",
              headers: authHeaders,
              credentials: "include",
            }
          );

          const data = await res.json();

          if (!res.ok || !data?.success) return [];

          return data.data || [];
        })
      );

      const merged = responses.flat();
      const unique = Array.from(
        new Map(merged.map((post) => [post._id, post])).values()
      );

      setAllPosts(unique);
    } catch {
      setAllPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [token, user?.role, authHeaders]);

  const fetchMyAvailability = useCallback(async () => {
    if (!token || user?.role !== "lawyer") return;

    try {
      setLoadingAvailability(true);
      setAvailabilityError("");

      const params = new URLSearchParams();
      params.set("startDate", availabilityStartDate);
      params.set("endDate", availabilityEndDate);

      const res = await fetch(
        `${API_BASE_URL}/lawyer-availability/my?${params.toString()}`,
        {
          method: "GET",
          headers: authHeaders,
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load availability");
      }

      setAvailabilityList(data.data || []);
    } catch (err) {
      setAvailabilityList([]);
      setAvailabilityError(err.message || "Failed to load availability");
    } finally {
      setLoadingAvailability(false);
    }
  }, [
    token,
    user?.role,
    authHeaders,
    availabilityStartDate,
    availabilityEndDate,
  ]);

  const handleAvailabilityFormChange = (e) => {
    const { name, value } = e.target;

    setAvailabilityForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvailabilityTypeToggle = (type) => {
    setAvailabilityForm((prev) => {
      const exists = prev.consultationTypes.includes(type);
      const nextTypes = exists
        ? prev.consultationTypes.filter((item) => item !== type)
        : [...prev.consultationTypes, type];

      return {
        ...prev,
        consultationTypes: nextTypes.length ? nextTypes : ["online"],
      };
    });
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();

    try {
      setSavingAvailability(true);
      setAvailabilityError("");
      setAvailabilitySuccess("");

      if (!lawyerApproved) {
        setAvailabilityError(
          "You need profile completion, phone verification, and admin approval before managing calendar."
        );
        return;
      }

      const times = normalizeSlotText(availabilityForm.slotsText);

      if (!availabilityForm.date) {
        setAvailabilityError("Please select a working date.");
        return;
      }

      if (times.length === 0) {
        setAvailabilityError("Please add at least one time slot.");
        return;
      }

      const payload = {
        date: availabilityForm.date,
        isActive: true,
        slots: times.map((time) => ({
          time,
          status: "available",
          consultationTypes: availabilityForm.consultationTypes,
          note: availabilityForm.note,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/lawyer-availability/my`, {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to save availability");
      }

      setAvailabilitySuccess(data.message || "Availability saved successfully");
      await fetchMyAvailability();
    } catch (err) {
      setAvailabilityError(err.message || "Failed to save availability");
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleBlockSlot = async (availabilityId, time) => {
    if (!availabilityId || !time) return;

    try {
      setActionLoadingId(`block-slot-${availabilityId}-${time}`);
      setAvailabilityError("");
      setAvailabilitySuccess("");

      const res = await fetch(
        `${API_BASE_URL}/lawyer-availability/my/${availabilityId}/block-slot`,
        {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({
            time,
            reason: "Slot blocked by lawyer",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to block slot");
      }

      setAvailabilitySuccess(data.message || "Slot blocked successfully");
      await fetchMyAvailability();
    } catch (err) {
      setAvailabilityError(err.message || "Failed to block slot");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleBlockDay = async (availabilityId) => {
    if (!availabilityId) return;

    try {
      setActionLoadingId(`block-day-${availabilityId}`);
      setAvailabilityError("");
      setAvailabilitySuccess("");

      const res = await fetch(
        `${API_BASE_URL}/lawyer-availability/my/${availabilityId}/block-day`,
        {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({
            reason: "Day blocked by lawyer",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to block day");
      }

      setAvailabilitySuccess(data.message || "Day blocked successfully");
      await fetchMyAvailability();
    } catch (err) {
      setAvailabilityError(err.message || "Failed to block day");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDeleteAvailability = async (availabilityId) => {
    if (!availabilityId) return;

    try {
      setActionLoadingId(`delete-availability-${availabilityId}`);
      setAvailabilityError("");
      setAvailabilitySuccess("");

      const res = await fetch(
        `${API_BASE_URL}/lawyer-availability/my/${availabilityId}`,
        {
          method: "DELETE",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({
            reason: "Availability deleted by lawyer",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to delete availability");
      }

      setAvailabilitySuccess(data.message || "Availability deleted successfully");
      await fetchMyAvailability();
    } catch (err) {
      setAvailabilityError(err.message || "Failed to delete availability");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleBlockRangeChange = (e) => {
    const { name, value } = e.target;

    setBlockRangeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlockRange = async (e) => {
    e.preventDefault();

    try {
      setActionLoadingId("block-range");
      setAvailabilityError("");
      setAvailabilitySuccess("");

      const res = await fetch(`${API_BASE_URL}/lawyer-availability/my/block-range`, {
        method: "PATCH",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify(blockRangeForm),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to block date range");
      }

      setAvailabilitySuccess(data.message || "Date range blocked successfully");
      await fetchMyAvailability();
    } catch (err) {
      setAvailabilityError(err.message || "Failed to block date range");
    } finally {
      setActionLoadingId("");
    }
  };

  const refreshDashboard = useCallback(async () => {
    setError("");
    setSuccessMessage("");

    await Promise.all([
      fetchMe(),
      fetchActiveSubscription(),
      fetchConnections(),
      fetchMyAppointments(),
      fetchAllPostsForBids(),
      fetchMyAvailability(),
    ]);
  }, [
    fetchMe,
    fetchActiveSubscription,
    fetchConnections,
    fetchMyAppointments,
    fetchAllPostsForBids,
    fetchMyAvailability,
  ]);

  useEffect(() => {
    if (token && user) {
      refreshDashboard();
    }
  }, [token, user?._id, user?.id]);

  const myBids = useMemo(() => {
    const result = [];

    allPosts.forEach((post) => {
      (post.bids || []).forEach((bid) => {
        if (isMyBid(bid, user)) {
          result.push({
            post,
            bid,
          });
        }
      });
    });

    return result.sort(
      (a, b) =>
        new Date(b.bid.createdAt || b.post.createdAt) -
        new Date(a.bid.createdAt || a.post.createdAt)
    );
  }, [allPosts, user]);

  const pendingBids = useMemo(() => {
    return myBids.filter((item) => item.bid.status === "pending");
  }, [myBids]);

  const acceptedBids = useMemo(() => {
    return myBids.filter((item) => item.bid.status === "accepted");
  }, [myBids]);

  const rejectedBids = useMemo(() => {
    return myBids.filter((item) => item.bid.status === "rejected");
  }, [myBids]);

  const pendingConnections = useMemo(() => {
    return connections.filter(
      (connection) =>
        connection.status === "pending" && connection.sourceType !== "booking"
    );
  }, [connections]);

  const acceptedConnections = useMemo(() => {
    return connections.filter((connection) => connection.status === "accepted");
  }, [connections]);

  const appointmentConnections = useMemo(() => {
    return connections.filter(isAppointmentConnection);
  }, [connections]);

  const selectedConnection = useMemo(() => {
    return appointmentConnections.find(
      (connection) => String(connection._id) === String(selectedConnectionId)
    );
  }, [appointmentConnections, selectedConnectionId]);

  const upcomingAppointments = useMemo(() => {
    return appointments.filter((booking) =>
      ["pending", "accepted"].includes(booking.status)
    );
  }, [appointments]);

  const completedAppointments = useMemo(() => {
    return appointments.filter((booking) =>
      ["completed", "cancelled", "rejected"].includes(booking.status)
    );
  }, [appointments]);

  const handleOpenAppointmentChat = useCallback((booking) => {
    const connectionId = booking?.connection?._id || booking?.connection;

    if (!connectionId) {
      setError(
        "This appointment does not have a conversation yet. Please refresh after the client books again."
      );
      return;
    }

    setSelectedConnectionId(connectionId);
    setActiveTab("chat");
  }, []);

  useEffect(() => {
    if (activeTab !== "chat") return;
    if (appointmentConnections.length === 0) return;

    const exists = appointmentConnections.some(
      (connection) => String(connection._id) === String(selectedConnectionId)
    );

    if (!selectedConnectionId || !exists) {
      setSelectedConnectionId(appointmentConnections[0]._id);
    }
  }, [activeTab, appointmentConnections, selectedConnectionId]);

  const fetchMessages = useCallback(
    async (connectionId) => {
      if (!token || !connectionId) return;

      try {
        setLoadingMessages(true);
        setChatError("");

        const res = await fetch(
          `${API_BASE_URL}/connections/${connectionId}/messages`,
          {
            method: "GET",
            headers: authHeaders,
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load messages");
        }

        setMessages(data.data || []);

        await fetch(`${API_BASE_URL}/connections/${connectionId}/messages/read`, {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
        });
      } catch (err) {
        setMessages([]);
        setChatError(
          err.message ||
            "Unable to load chat. Please make sure your account has an active free or paid plan."
        );
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, authHeaders]
  );

  useEffect(() => {
    if (activeTab === "chat" && selectedConnectionId) {
      fetchMessages(selectedConnectionId);
    }
  }, [activeTab, selectedConnectionId, fetchMessages]);


  useEffect(() => {
    if (activeTab === "availability") {
      fetchMyAvailability();
    }
  }, [activeTab, fetchMyAvailability]);

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;

    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please upload a valid image file.");
      return;
    }

    setProfileForm((prev) => ({
      ...prev,
      profileImage: file,
    }));

    setProfilePreview(URL.createObjectURL(file));
    setProfileError("");
  };

  const validateProfileForm = () => {
    if (!profileForm.specialization) {
      return "Please select your specialization.";
    }

    if (profileForm.experienceYears === "") {
      return "Please enter your experience years.";
    }

    if (
      Number(profileForm.experienceYears) < 0 ||
      Number(profileForm.experienceYears) > 80
    ) {
      return "Experience years must be between 0 and 80.";
    }

    if (!user?.profileImage && !profileForm.profileImage) {
      return "Please upload your profile image.";
    }

    if (!profileForm.bio.trim()) {
      return "Please write your professional bio.";
    }

    if (!profileForm.city.trim()) {
      return "Please enter your city.";
    }

    if (profileForm.consultationFee === "") {
      return "Please enter your consultation fee.";
    }

    if (Number(profileForm.consultationFee) < 0) {
      return "Consultation fee cannot be negative.";
    }

    if (!profileForm.availability) {
      return "Please select your availability.";
    }

    return "";
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setProfileError("");
    setProfileSuccess("");

    const validationError = validateProfileForm();

    if (validationError) {
      setProfileError(validationError);
      return;
    }

    try {
      setSavingProfile(true);

      const payload = new FormData();

      payload.append("specialization", profileForm.specialization);
      payload.append("experienceYears", profileForm.experienceYears);
      payload.append("bio", profileForm.bio);
      payload.append("officeAddress", profileForm.officeAddress);
      payload.append("city", profileForm.city);
      payload.append("consultationFee", profileForm.consultationFee);
      payload.append("availability", profileForm.availability);

      if (profileForm.profileImage) {
        payload.append("profileImage", profileForm.profileImage);
      }

      const isCompleting = !user?.profileCompleted;

      const endpoint = isCompleting
        ? `${API_BASE_URL}/users/lawyer/profile/complete`
        : `${API_BASE_URL}/users/lawyer/profile`;

      const method = isCompleting ? "PUT" : "PATCH";

      const res = await fetch(endpoint, {
        method,
        headers: authOnlyHeaders,
        credentials: "include",
        body: payload,
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || data?.error || "Failed to save profile");
      }

      const updatedUser = data.data;

      if (updatedUser) {
        setAuthUser(updatedUser);
        saveStoredUser(updatedUser);
      }

      setProfileForm((prev) => ({
        ...prev,
        profileImage: null,
      }));

      setProfileSuccess(
        data.message ||
          "Profile saved successfully. Please wait for admin verification."
      );

      await fetchMe();
    } catch (err) {
      setProfileError(err.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleConnectionAction = async (connectionId, action) => {
    if (!token || !connectionId || !["accept", "reject"].includes(action)) {
      return;
    }

    try {
      setActionLoadingId(`${action}-${connectionId}`);
      setError("");
      setSuccessMessage("");

      const res = await fetch(
        `${API_BASE_URL}/connections/${connectionId}/${action}`,
        {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({
            responseMessage:
              action === "accept"
                ? "Connection request accepted by lawyer."
                : "Connection request rejected by lawyer.",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to ${action} request`);
      }

      setSuccessMessage(data.message || `Connection ${action}ed successfully`);

      await fetchConnections();

      if (action === "accept") {
        setSelectedConnectionId(connectionId);
        setActiveTab("chat");
      }
    } catch (err) {
      setError(err.message || `Failed to ${action} request`);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleWithdrawBid = async (postId, bidId) => {
    if (!token || !postId || !bidId) return;

    try {
      setActionLoadingId(`withdraw-${bidId}`);
      setError("");
      setSuccessMessage("");

      const res = await fetch(`${API_BASE_URL}/posts/${postId}/bid/${bidId}`, {
        method: "PATCH",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Failed to withdraw proposal. Check your backend route for withdrawBid."
        );
      }

      setSuccessMessage(data.message || "Proposal withdrawn successfully");
      await fetchAllPostsForBids();
    } catch (err) {
      setError(err.message || "Failed to withdraw proposal");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!selectedConnectionId) {
      setChatError("Please select a conversation first");
      return;
    }

    const messageValidation = validateChatMessageText(messageText);

    if (!messageValidation.valid) {
      setChatError(messageValidation.message);
      return;
    }

    const attachmentValidation = validateAttachmentLinks(attachmentText);

    if (!attachmentValidation.valid) {
      setChatError(attachmentValidation.message);
      return;
    }

    try {
      setSendingMessage(true);
      setChatError("");

      const res = await fetch(
        `${API_BASE_URL}/connections/${selectedConnectionId}/messages`,
        {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({
            message: messageText.trim(),
            attachments: attachmentValidation.links,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to send message");
      }

      setMessageText("");
      setAttachmentText("");
      setShowAttachmentInput(false);

      if (data.data?.connection?.messages) {
        setMessages(data.data.connection.messages);
      } else if (data.data?.messages) {
        setMessages(data.data.messages);
      } else {
        await fetchMessages(selectedConnectionId);
      }

      await fetchConnections();
    } catch (err) {
      setChatError(
        err.message ||
          "Unable to send message. Please make sure your account has an active free or paid plan."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: Scale,
      count: null,
    },
    {
      id: "profile",
      label: user?.profileCompleted ? "Update Profile" : "Setup Profile",
      icon: UserCog,
      count: user?.profileCompleted ? null : 1,
    },
    {
      id: "availability",
      label: "Availability",
      icon: CalendarDays,
      count: availabilityList.length,
    },
    {
      id: "bids",
      label: "My Bids",
      icon: Send,
      count: myBids.length,
    },
    {
      id: "requests",
      label: "Requests",
      icon: Handshake,
      count: pendingConnections.length,
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: CalendarDays,
      count: upcomingAppointments.length,
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageCircle,
      count: appointmentConnections.length,
    },
  ];

  const subscriptionStatus =
    activeSubscription?.status || user?.subscriptionStatus || "none";

  const currentPlanName =
    activeSubscription?.planName ||
    activeSubscription?.plan?.name ||
    "No active plan";

  const proposalLimit = getFeatureValue(activeFeatures, "proposal_limit");
  const connectionLimit = getFeatureValue(
    activeFeatures,
    "connection_request_limit"
  );

  const inAppMessaging = canUseChat
    ? true
    : getFeatureValue(activeFeatures, "in_app_messaging");

  const contactUnlock = getFeatureValue(activeFeatures, "contact_unlock");
  const availabilityCalendarAccess = getFeatureValue(
    activeFeatures,
    "availability_calendar_access"
  );
  const availabilitySlotLimit = getFeatureValue(
    activeFeatures,
    "availability_slot_limit"
  );

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-white px-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-cyan-100 text-4xl font-black text-cyan-700">
            L
          </div>

          <h2 className="mt-6 text-3xl font-black text-slate-900">
            No Lawyer Found
          </h2>

          <p className="mt-3 text-slate-500">
            Please login as a lawyer to view your personal lawyer dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (user.role !== "lawyer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-white px-4">
        <div className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-9 w-9" />
          </div>

          <h2 className="mt-6 text-3xl font-black text-slate-900">
            Lawyer Access Only
          </h2>

          <p className="mt-3 text-slate-500">
            This dashboard is only for individual lawyer accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/40 to-white px-4 py-10 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(0,0,0,0.06)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-cyan-500 to-sky-500 opacity-95" />
          <div className="absolute right-0 top-0 h-72 w-72 translate-x-20 -translate-y-20 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-20 translate-y-20 rounded-full bg-white/10 blur-3xl" />

          <div className="relative px-6 py-10 md:px-10 md:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/20 text-3xl font-black text-white shadow-xl backdrop-blur-md md:h-32 md:w-32 md:text-4xl"
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name || "Lawyer"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </motion.div>

                <div className="text-white">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                      {user.name || "Lawyer Dashboard"}
                    </h1>

                    <span className="rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-bold capitalize backdrop-blur-md">
                      Lawyer
                    </span>

                    <span
                      className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${getSubscriptionBadgeClass(
                        subscriptionStatus
                      )}`}
                    >
                      {subscriptionStatus}
                    </span>

                    <span
                      className={`rounded-full border px-4 py-1.5 text-sm font-bold ${getApprovalBadgeClass(
                        lawyerApproved
                      )}`}
                    >
                      {lawyerApproved ? "Approved" : "Not Approved"}
                    </span>

                  </div>

                  <div className="space-y-2 text-sm text-white/90 md:text-base">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email || "No email available"}
                    </p>

                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {user.phone || "No phone available"}
                    </p>

                    <p className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4" />
                      Reg: {user.lawRegNumber || "Not available"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                <HeroMiniCard
                  icon={<UserCog className="h-5 w-5" />}
                  label="Profile"
                  value={user.profileCompleted ? "Done" : "Setup"}
                />

                <HeroMiniCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label="Admin Approval"
                  value={lawyerApproved ? "Yes" : "No"}
                />

                <HeroMiniCard
                  icon={<Handshake className="h-5 w-5" />}
                  label="Requests"
                  value={pendingConnections.length}
                />

                <HeroMiniCard
                  icon={<MessageCircle className="h-5 w-5" />}
                  label="Appointment Chats"
                  value={appointmentConnections.length}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {!user?.profileCompleted && (
          <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <AlertCircle className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-amber-900">
                    Complete profile and wait for admin approval
                  </h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-amber-800">
                    You can update your profile here. Your public profile and
                    lawyer actions are available only after profile completion,
                    phone verification, and admin approval.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700"
              >
                {user.profileCompleted ? "Update Profile" : "Setup Profile"}
              </button>
            </div>
          </div>
        )}

        <div className="sticky top-20 z-30 mt-8 rounded-[24px] border border-slate-200 bg-white/90 p-2 shadow-[0_14px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/20"
                      : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}

                  {Number(tab.count) > 0 && (
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                        isActive
                          ? "bg-white text-cyan-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                {successMessage}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={refreshDashboard}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Dashboard
          </button>
        </div>

        {activeTab === "overview" && (
          <OverviewTab
            user={user}
            loading={loadingProfile}
            activeSubscription={activeSubscription}
            subscriptionStatus={subscriptionStatus}
            currentPlanName={currentPlanName}
            proposalLimit={proposalLimit}
            connectionLimit={connectionLimit}
            inAppMessaging={inAppMessaging}
            contactUnlock={contactUnlock}
            availabilityCalendarAccess={availabilityCalendarAccess}
            availabilitySlotLimit={availabilitySlotLimit}
            availabilityCount={availabilityList.length}
            myBids={myBids}
            pendingBids={pendingBids}
            acceptedBids={acceptedBids}
            rejectedBids={rejectedBids}
            pendingConnections={pendingConnections}
            acceptedConnections={appointmentConnections}
            lawyerApproved={lawyerApproved}
            onSetupProfile={() => setActiveTab("profile")}
          />
        )}

        {activeTab === "profile" && (
          <ProfileTab
            user={user}
            form={profileForm}
            preview={profilePreview}
            saving={savingProfile}
            error={profileError}
            success={profileSuccess}
            onChange={handleProfileInputChange}
            onImageChange={handleProfileImageChange}
            onSubmit={handleSaveProfile}
          />
        )}

        {activeTab === "availability" && (
          <AvailabilityTab
            user={user}
            approved={lawyerApproved}
            activeSubscription={activeSubscription}
            availabilityList={availabilityList}
            form={availabilityForm}
            blockRangeForm={blockRangeForm}
            startDate={availabilityStartDate}
            endDate={availabilityEndDate}
            loading={loadingAvailability}
            saving={savingAvailability}
            actionLoadingId={actionLoadingId}
            error={availabilityError}
            success={availabilitySuccess}
            availabilityCalendarAccess={availabilityCalendarAccess}
            availabilitySlotLimit={availabilitySlotLimit}
            onStartDateChange={setAvailabilityStartDate}
            onEndDateChange={setAvailabilityEndDate}
            onRefresh={fetchMyAvailability}
            onFormChange={handleAvailabilityFormChange}
            onTypeToggle={handleAvailabilityTypeToggle}
            onSubmit={handleSaveAvailability}
            onBlockSlot={handleBlockSlot}
            onBlockDay={handleBlockDay}
            onDeleteAvailability={handleDeleteAvailability}
            onBlockRangeChange={handleBlockRangeChange}
            onBlockRange={handleBlockRange}
          />
        )}

        {activeTab === "bids" && (
          <BidsTab
            loading={loadingPosts}
            myBids={myBids}
            actionLoadingId={actionLoadingId}
            onWithdrawBid={handleWithdrawBid}
          />
        )}

        {activeTab === "requests" && (
          <RequestsTab
            user={user}
            loading={loadingConnections}
            connections={connections.filter((connection) => connection.sourceType !== "booking")}
            actionLoadingId={actionLoadingId}
            onAccept={(id) => handleConnectionAction(id, "accept")}
            onReject={(id) => handleConnectionAction(id, "reject")}
            onOpenChat={(id) => {
              setSelectedConnectionId(id);
              setActiveTab("chat");
            }}
          />
        )}

        {activeTab === "appointments" && (
          <AppointmentsTab
            user={user}
            appointments={appointments}
            upcomingAppointments={upcomingAppointments}
            completedAppointments={completedAppointments}
            loading={loadingAppointments}
            onRefreshAppointments={fetchMyAppointments}
            onOpenAppointmentChat={handleOpenAppointmentChat}
          />
        )}

        {activeTab === "chat" && (
          <ChatTab
            user={user}
            connections={appointmentConnections}
            selectedConnectionId={selectedConnectionId}
            selectedConnection={selectedConnection}
            messages={messages}
            canUseChat={canUseChat}
            loadingConnections={loadingConnections}
            loadingMessages={loadingMessages}
            sendingMessage={sendingMessage}
            messageText={messageText}
            attachmentText={attachmentText}
            showAttachmentInput={showAttachmentInput}
            chatError={chatError}
            onSelectConnection={setSelectedConnectionId}
            onMessageChange={(value) => {
              setMessageText(value);
              setChatError("");
            }}
            onAttachmentChange={(value) => {
              setAttachmentText(value);
              setChatError("");
            }}
            onToggleAttachmentInput={() => {
              setShowAttachmentInput((prev) => !prev);
              setChatError("");
            }}
            onClearAttachment={() => {
              setAttachmentText("");
              setShowAttachmentInput(false);
              setChatError("");
            }}
            onSendMessage={handleSendMessage}
            onRefreshMessages={() =>
              selectedConnectionId && fetchMessages(selectedConnectionId)
            }
          />
        )}
      </div>
    </div>
  );
};

const ProfileTab = ({
  user,
  form,
  preview,
  saving,
  error,
  success,
  onChange,
  onImageChange,
  onSubmit,
}) => {
  const approved = isLawyerApproved(user);

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
      <SectionCard
        icon={<UserCog className="h-6 w-6" />}
        title={user.profileCompleted ? "Update Profile" : "Setup Profile"}
        subtitle="Complete your professional profile for public approval"
      >
        <div className="space-y-5">
          <div
            className={`rounded-3xl border p-5 ${getApprovalBadgeClass(
              approved
            )}`}
          >
            <p className="text-sm font-black">Current Status</p>
            <h3 className="mt-1 text-2xl font-black">
              {approved ? "Approved Lawyer" : "Pending Approval"}
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6">
              {approved
                ? "Your profile is approved and can appear publicly."
                : "You need profile completion, phone verification, and admin approval before public visibility."}
            </p>
          </div>

          <div className="grid gap-3">
            <ProfileCheckRow
              label="Profile Completed"
              checked={user.profileCompleted}
            />
            <ProfileCheckRow
              label="Phone Verified"
              checked={user.phoneVerified === 1}
            />
            <ProfileCheckRow
              label="Admin Approved"
              checked={user.isVerifiedLawyer}
            />
          </div>

          <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-5">
            <h3 className="text-base font-black text-cyan-900">
              Required for profile completion
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-cyan-800">
              Specialization, experience years, profile image, bio, city,
              consultation fee, and availability are required.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Save className="h-6 w-6" />}
        title="Professional Information"
        subtitle="This information will be used on your public lawyer profile"
      >
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Profile Image
            </label>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <Camera className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700">
                  <ImagePlus className="h-4 w-4" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onImageChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  Upload a clear professional image. Required for profile
                  completion.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Specialization">
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <select
                  name="specialization"
                  value={form.specialization}
                  onChange={onChange}
                  required
                  className="w-full appearance-none rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">Select specialization</option>
                  {LAWYER_SPECIALIZATIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            <FormField label="Experience Years">
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  name="experienceYears"
                  min="0"
                  max="80"
                  value={form.experienceYears}
                  onChange={onChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Example: 5"
                />
              </div>
            </FormField>

            <FormField label="City">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={onChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Example: Dhaka"
                />
              </div>
            </FormField>

            <FormField label="Consultation Fee">
              <div className="relative">
                <Wallet className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  name="consultationFee"
                  min="0"
                  value={form.consultationFee}
                  onChange={onChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Example: 1000"
                />
              </div>
            </FormField>

            <FormField label="Availability" className="md:col-span-2">
              <div className="grid grid-cols-3 gap-2">
                {LAWYER_AVAILABILITY.map((item) => (
                  <label
                    key={item}
                    className={`cursor-pointer rounded-2xl border px-3 py-3 text-center text-sm font-black capitalize transition ${
                      form.availability === item
                        ? "border-cyan-600 bg-cyan-50 text-cyan-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="availability"
                      value={item}
                      checked={form.availability === item}
                      onChange={onChange}
                      className="hidden"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </FormField>

            <FormField label="Office Address" className="md:col-span-2">
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="officeAddress"
                  value={form.officeAddress}
                  onChange={onChange}
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Chamber / office address"
                />
              </div>
            </FormField>

            <FormField label="Professional Bio" className="md:col-span-2">
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-4 h-5 w-5 text-slate-400" />
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={onChange}
                  rows={5}
                  maxLength={1000}
                  required
                  className="w-full resize-none rounded-2xl border border-slate-300 py-3 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Write a short professional bio about your legal experience..."
                />
              </div>

              <div className="mt-1 flex justify-between text-xs font-semibold text-slate-500">
                <span>Keep it clear and professional.</span>
                <span>{form.bio.length}/1000</span>
              </div>
            </FormField>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black text-white transition ${
              saving
                ? "cursor-not-allowed bg-cyan-400"
                : "bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {user.profileCompleted ? "Update Profile" : "Complete Profile"}
              </>
            )}
          </button>
        </form>
      </SectionCard>
    </div>
  );
};

const ProfileCheckRow = ({ label, checked }) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-black text-slate-700">{label}</p>

      <span
        className={`rounded-full px-3 py-1 text-xs font-black ${
          checked
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {checked ? "Done" : "Pending"}
      </span>
    </div>
  );
};

const FormField = ({ label, children, className = "" }) => {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-black text-slate-800">
        {label}
      </label>
      {children}
    </div>
  );
};

const OverviewTab = ({
  user,
  loading,
  activeSubscription,
  subscriptionStatus,
  currentPlanName,
  proposalLimit,
  connectionLimit,
  inAppMessaging,
  contactUnlock,
  availabilityCalendarAccess,
  availabilitySlotLimit,
  availabilityCount,
  myBids,
  pendingBids,
  acceptedBids,
  rejectedBids,
  pendingConnections,
  acceptedConnections,
  lawyerApproved,
  onSetupProfile,
}) => {
  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-3">
      <div className="space-y-8 xl:col-span-2">
        <SectionCard
          icon={<Scale className="h-6 w-6" />}
          title="Lawyer Profile"
          subtitle="Your professional account information"
        >
          <div className="mb-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSetupProfile}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700"
            >
              <UserCog className="h-4 w-4" />
              {user.profileCompleted ? "Update Profile" : "Setup Profile"}
            </button>

            <span
              className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black ${getApprovalBadgeClass(
                lawyerApproved
              )}`}
            >
              <ShieldCheck className="h-4 w-4" />
              {lawyerApproved ? "Approved" : "Pending Approval"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard icon={<UserRound />} label="Name" value={user.name} />
            <InfoCard icon={<Mail />} label="Email" value={user.email} />
            <InfoCard icon={<Phone />} label="Phone" value={user.phone || "-"} />
            <InfoCard
              icon={<BadgeCheck />}
              label="Law Reg. Number"
              value={user.lawRegNumber || "-"}
            />
            <InfoCard
              icon={<ShieldCheck />}
              label="Phone Verification"
              value={user.phoneVerified ? "Verified" : "Not Verified"}
            />
            <InfoCard
              icon={<CheckCircle2 />}
              label="Profile Completed"
              value={user.profileCompleted ? "Completed" : "Not Completed"}
            />
            <InfoCard
              icon={<Briefcase />}
              label="Specialization"
              value={user.specialization || "-"}
            />
            <InfoCard
              icon={<MapPin />}
              label="City"
              value={user.city || "-"}
            />
            <InfoCard
              icon={<Wallet />}
              label="Consultation Fee"
              value={formatCurrency(user.consultationFee || 0)}
            />
            <InfoCard
              icon={<CalendarDays />}
              label="Joined"
              value={formatDate(user.createdAt)}
            />
          </div>
        </SectionCard>

        <SectionCard
          icon={<Briefcase className="h-6 w-6" />}
          title="Proposal Summary"
          subtitle="Your proposal/bid performance"
        >
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard title="Total Bids" value={myBids.length} />
            <StatCard title="Pending" value={pendingBids.length} />
            <StatCard title="Accepted" value={acceptedBids.length} />
            <StatCard title="Rejected" value={rejectedBids.length} />
          </div>
        </SectionCard>
      </div>

      <div className="space-y-8">
        <SectionCard
          icon={<Crown className="h-6 w-6" />}
          title="Subscription"
          subtitle="Plan and feature access"
        >
          {loading ? (
            <LoadingBox text="Loading subscription..." />
          ) : (
            <div className="space-y-4">
              <div
                className={`rounded-2xl border p-5 ${getSubscriptionBadgeClass(
                  subscriptionStatus
                )}`}
              >
                <p className="text-sm font-bold">Status</p>
                <h3 className="mt-1 text-2xl font-black capitalize">
                  {subscriptionStatus}
                </h3>
              </div>

              <MiniDetail label="Current Plan" value={currentPlanName} />

              <MiniDetail
                label="Price"
                value={
                  activeSubscription
                    ? formatCurrency(
                        activeSubscription.price,
                        activeSubscription.currency || "BDT"
                      )
                    : "No active subscription"
                }
              />

              <MiniDetail
                label="Plan End"
                value={formatDate(activeSubscription?.endDate)}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={<Wallet className="h-6 w-6" />}
          title="Feature Access"
          subtitle="Limits from your plan"
        >
          <div className="space-y-3">
            <FeatureRow label="Proposal Limit" value={proposalLimit} />
            <FeatureRow label="Connection Requests" value={connectionLimit} />
            <FeatureRow label="In-app Messaging" value={inAppMessaging} />
            <FeatureRow label="Contact Unlock" value={contactUnlock} />
            <FeatureRow
              label="Availability Calendar"
              value={availabilityCalendarAccess}
            />
            <FeatureRow
              label="Availability Slot Limit"
              value={availabilitySlotLimit}
            />
          </div>
        </SectionCard>

        <SectionCard
          icon={<Handshake className="h-6 w-6" />}
          title="Connections"
          subtitle="Client request overview"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard title="Pending" value={pendingConnections.length} />
            <StatCard title="Accepted" value={acceptedConnections.length} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

const getSlotBadgeClass = (slot) => {
  if (slot?.isBooked) {
    return slot.bookingStatus === "accepted"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (slot?.status === "blocked") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

const getSlotLabel = (slot) => {
  if (slot?.isBooked) {
    return slot.bookingStatus === "accepted" ? "Booked" : "Pending";
  }

  if (slot?.status === "blocked") return "Blocked";

  return "Available";
};

const AvailabilityTab = ({
  user,
  approved,
  activeSubscription,
  availabilityList,
  form,
  blockRangeForm,
  startDate,
  endDate,
  loading,
  saving,
  actionLoadingId,
  error,
  success,
  availabilityCalendarAccess,
  availabilitySlotLimit,
  onStartDateChange,
  onEndDateChange,
  onRefresh,
  onFormChange,
  onTypeToggle,
  onSubmit,
  onBlockSlot,
  onBlockDay,
  onDeleteAvailability,
  onBlockRangeChange,
  onBlockRange,
}) => {
  const allSlots = useMemo(() => {
    return availabilityList.flatMap((day) => day.slots || []);
  }, [availabilityList]);

  const openSlots = useMemo(() => {
    return allSlots.filter((slot) => slot.isSelectable).length;
  }, [allSlots]);

  const bookedSlots = useMemo(() => {
    return allSlots.filter((slot) => slot.isBooked).length;
  }, [allSlots]);

  const blockedSlots = useMemo(() => {
    return allSlots.filter((slot) => slot.status === "blocked").length;
  }, [allSlots]);

  const calendarAllowed = availabilityCalendarAccess === true || approved;

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-8">
        <SectionCard
          icon={<CalendarDays className="h-6 w-6" />}
          title="Availability Calendar"
          subtitle="Set working days and time slots clients can book automatically"
        >
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
              {success}
            </div>
          )}

          {!approved && (
            <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <h3 className="text-sm font-black text-amber-900">
                    Approval required
                  </h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-amber-800">
                    Complete profile, verify phone, and wait for admin approval before managing public booking slots.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard
              icon={<Crown />}
              label="Calendar Access"
              value={readableFeature(availabilityCalendarAccess)}
            />
            <InfoCard
              icon={<Clock />}
              label="Slot Limit"
              value={readableFeature(availabilitySlotLimit)}
            />
            <InfoCard
              icon={<CalendarDays />}
              label="Plan End"
              value={formatDate(activeSubscription?.endDate)}
            />
            <InfoCard
              icon={<ShieldCheck />}
              label="Approval"
              value={approved ? "Approved" : "Pending"}
            />
          </div>
        </SectionCard>

        <SectionCard
          icon={<Save className="h-6 w-6" />}
          title="Add Working Day"
          subtitle="Each line in the time box becomes one bookable slot"
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <FormField label="Working Date">
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={onFormChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </FormField>

            <FormField label="Available Times">
              <textarea
                name="slotsText"
                value={form.slotsText}
                onChange={onFormChange}
                rows={5}
                required
                placeholder={"09:00 AM\n10:00 AM\n11:00 AM"}
                className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Write one time per line. Example: 09:00 AM, 10:30 AM, 03:00 PM.
              </p>
            </FormField>

            <FormField label="Consultation Types">
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { key: "online", label: "Online" },
                  { key: "phone", label: "Phone" },
                  { key: "in_person", label: "In Person" },
                ].map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => onTypeToggle(type.key)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                      form.consultationTypes.includes(type.key)
                        ? "border-cyan-600 bg-cyan-50 text-cyan-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Slot Note">
              <input
                type="text"
                name="note"
                value={form.note}
                onChange={onFormChange}
                maxLength={300}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="Optional note for this working day"
              />
            </FormField>

            <button
              type="submit"
              disabled={saving || !approved || !calendarAllowed}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black text-white transition ${
                saving || !approved || !calendarAllowed
                  ? "cursor-not-allowed bg-cyan-400"
                  : "bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Availability...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Working Day
                </>
              )}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          icon={<XCircle className="h-6 w-6" />}
          title="Block Date Range"
          subtitle="Cancel bookings and block a full range, like a week"
        >
          <form onSubmit={onBlockRange} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Start Date">
                <input
                  type="date"
                  name="startDate"
                  value={blockRangeForm.startDate}
                  onChange={onBlockRangeChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label="End Date">
                <input
                  type="date"
                  name="endDate"
                  value={blockRangeForm.endDate}
                  onChange={onBlockRangeChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </FormField>
            </div>

            <FormField label="Reason">
              <input
                type="text"
                name="reason"
                value={blockRangeForm.reason}
                onChange={onBlockRangeChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="Example: Court work / personal leave"
              />
            </FormField>

            <button
              type="submit"
              disabled={actionLoadingId === "block-range" || !approved}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              {actionLoadingId === "block-range" ? "Blocking..." : "Block Range"}
            </button>
          </form>
        </SectionCard>
      </div>

      <div className="space-y-8">
        <SectionCard
          icon={<Clock className="h-6 w-6" />}
          title="Your Working Calendar"
          subtitle="Booked slots are locked for clients. You can block slot, day, or delete availability."
        >
          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Load
            </button>
          </div>

          <div className="mb-5 grid gap-4 md:grid-cols-4">
            <StatCard title="Days" value={availabilityList.length} />
            <StatCard title="Open" value={openSlots} />
            <StatCard title="Booked" value={bookedSlots} />
            <StatCard title="Blocked" value={blockedSlots} />
          </div>

          {loading ? (
            <LoadingBox text="Loading availability..." />
          ) : availabilityList.length === 0 ? (
            <EmptyBox text="No availability found. Add your first working day from the form." />
          ) : (
            <div className="space-y-5">
              {availabilityList.map((day) => (
                <div
                  key={day._id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-slate-950">
                          {formatDate(day.date)}
                        </h3>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                          {formatDay(day.date)}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${
                            day.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {day.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onBlockDay(day._id)}
                        disabled={actionLoadingId === `block-day-${day._id}`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-black text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        {actionLoadingId === `block-day-${day._id}`
                          ? "Blocking..."
                          : "Block Day"}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteAvailability(day._id)}
                        disabled={actionLoadingId === `delete-availability-${day._id}`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        <X className="h-4 w-4" />
                        {actionLoadingId === `delete-availability-${day._id}`
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {(day.slots || []).map((slot, index) => (
                      <div
                        key={`${day._id}-${slot.time}-${index}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-base font-black text-slate-950">
                            {slot.time}
                          </p>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getSlotBadgeClass(
                              slot
                            )}`}
                          >
                            {getSlotLabel(slot)}
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-bold capitalize text-slate-500">
                          {(slot.consultationTypes || ["online"])
                            .map((item) => item.replace("_", " "))
                            .join(", ")}
                        </p>

                        {slot.note && (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                            {slot.note}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => onBlockSlot(day._id, slot.time)}
                          disabled={
                            slot.status === "blocked" ||
                            actionLoadingId === `block-slot-${day._id}-${slot.time}`
                          }
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Lock className="h-4 w-4" />
                          {actionLoadingId === `block-slot-${day._id}-${slot.time}`
                            ? "Blocking..."
                            : slot.status === "blocked"
                            ? "Already Blocked"
                            : "Block Slot"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

const BidsTab = ({ loading, myBids, actionLoadingId, onWithdrawBid }) => {
  return (
    <SectionCard
      className="mt-8"
      icon={<Send className="h-6 w-6" />}
      title="My Bids / Proposals"
      subtitle="Track every proposal you sent to client case posts"
    >
      {loading ? (
        <LoadingBox text="Loading your bids..." />
      ) : myBids.length === 0 ? (
        <EmptyBox text="No bids found. Send proposals from legal posts after a client accepts your connection request." />
      ) : (
        <div className="space-y-5">
          {myBids.map(({ post, bid }) => {
            const canWithdraw = bid.status === "pending";

            return (
              <div
                key={`${post._id}-${bid._id}`}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${getBidBadgeClass(
                          bid.status
                        )}`}
                      >
                        {bid.status}
                      </span>

                      <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 capitalize">
                        {post.status?.replace("_", " ") || "open"}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        {formatDateTime(bid.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-950">
                      {post.title || "Untitled Case"}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {post.description || "No description available."}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <MiniDetail
                        label="Client"
                        value={post.client?.name || "Client"}
                      />

                      <MiniDetail
                        label="Fee"
                        value={formatCurrency(bid.proposedFee)}
                      />

                      <MiniDetail
                        label="Estimated Days"
                        value={`${bid.estimatedDays || 0} days`}
                      />

                      <MiniDetail
                        label="Budget"
                        value={`${formatCurrency(
                          post.budgetMin
                        )} - ${formatCurrency(post.budgetMax)}`}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                        Your Proposal Message
                      </p>
                      <p className="text-sm leading-6 text-slate-700">
                        {bid.message || "No message provided."}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-[220px]">
                    <button
                      type="button"
                      onClick={() => onWithdrawBid(post._id, bid._id)}
                      disabled={
                        !canWithdraw || actionLoadingId === `withdraw-${bid._id}`
                      }
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                        canWithdraw
                          ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                          : "bg-slate-200 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <RotateCcw className="h-4 w-4" />
                      {actionLoadingId === `withdraw-${bid._id}`
                        ? "Withdrawing..."
                        : bid.status === "accepted"
                        ? "Accepted"
                        : bid.status === "rejected"
                        ? "Rejected"
                        : bid.status === "withdrawn"
                        ? "Withdrawn"
                        : "Withdraw Bid"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

const RequestsTab = ({
  user,
  loading,
  connections,
  actionLoadingId,
  onAccept,
  onReject,
  onOpenChat,
}) => {
  const userId = String(user?._id || user?.id || "");

  return (
    <SectionCard
      className="mt-8"
      icon={<Handshake className="h-6 w-6" />}
      title="Client Connection Requests"
      subtitle="Accept requests before proposal or conversation flow"
    >
      {loading ? (
        <LoadingBox text="Loading connection requests..." />
      ) : connections.length === 0 ? (
        <EmptyBox text="No connection requests found." />
      ) : (
        <div className="space-y-5">
          {connections.map((connection) => {
            const requestedById = String(
              connection.requestedBy?._id || connection.requestedBy || ""
            );

            const canRespond =
              connection.status === "pending" && requestedById !== userId;

            return (
              <div
                key={connection._id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${getConnectionBadgeClass(
                          connection.status
                        )}`}
                      >
                        {connection.status}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        {formatDateTime(connection.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-950">
                      {connection.post?.title || "Case Request"}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {connection.requestMessage || "No request message."}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <MiniDetail
                        label="Client"
                        value={connection.client?.name || "-"}
                      />

                      <MiniDetail
                        label="Client Email"
                        value={connection.client?.email || "-"}
                      />

                      <MiniDetail
                        label="Case Category"
                        value={connection.post?.category || "-"}
                      />
                    </div>
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-3">
                    {canRespond && (
                      <>
                        <button
                          type="button"
                          onClick={() => onAccept(connection._id)}
                          disabled={
                            actionLoadingId === `accept-${connection._id}`
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {actionLoadingId === `accept-${connection._id}`
                            ? "Accepting..."
                            : "Accept Request"}
                        </button>

                        <button
                          type="button"
                          onClick={() => onReject(connection._id)}
                          disabled={
                            actionLoadingId === `reject-${connection._id}`
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          <XCircle className="h-4 w-4" />
                          {actionLoadingId === `reject-${connection._id}`
                            ? "Rejecting..."
                            : "Reject"}
                        </button>
                      </>
                    )}

                    {connection.status === "accepted" && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(connection._id)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Open Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};


const AppointmentsTab = ({
  user,
  appointments,
  upcomingAppointments,
  completedAppointments,
  loading,
  onRefreshAppointments,
  onOpenAppointmentChat,
}) => {
  const renderAppointmentCard = (booking) => {
    const client = booking.client || {};
    const connectionId = booking.connection?._id || booking.connection;
    const canChat = booking.status === "accepted" && Boolean(connectionId);

    return (
      <div
        key={booking._id}
        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${getAppointmentBadgeClass(
                  booking.status
                )}`}
              >
                {booking.status || "unknown"}
              </span>

              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                {formatConsultationType(booking.consultationType)}
              </span>

              {connectionId && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  Chat Ready
                </span>
              )}
            </div>

            <h3 className="text-lg font-black text-slate-950">
              {booking.subject || "Appointment Consultation"}
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {booking.message || "No appointment message was added."}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MiniDetail label="Client" value={client.name || "-"} />
              <MiniDetail label="Date" value={formatDate(booking.requestedDate)} />
              <MiniDetail label="Day" value={formatDay(booking.requestedDate)} />
              <MiniDetail label="Time" value={booking.requestedTime || "-"} />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <MiniDetail label="Booked At" value={formatDateTime(booking.createdAt)} />
              <MiniDetail
                label="Connection"
                value={connectionId ? "Appointment conversation available" : "No chat connection"}
              />
            </div>
          </div>

          <div className="flex min-w-[230px] flex-col gap-3">
            <button
              type="button"
              onClick={() => onOpenAppointmentChat(booking)}
              disabled={!canChat}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed ${
                canChat
                  ? "bg-cyan-600 text-white hover:bg-cyan-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              {canChat ? "Open Appointment Chat" : "Chat Not Ready"}
            </button>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs font-semibold leading-5 text-slate-500">
              Only clients with booked appointments can chat here. Case/post
              conversations are not mixed in this appointment chat.
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-black text-slate-950">
            <CalendarDays className="h-6 w-6 text-cyan-700" />
            Booked Appointments
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            View clients who booked your slots and open appointment-based chat.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshAppointments}
          className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh Appointments
        </button>
      </div>

      {loading ? (
        <LoadingBox text="Loading appointments..." />
      ) : appointments.length === 0 ? (
        <EmptyBox text="No booked appointments found yet." />
      ) : (
        <div className="space-y-8">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                Upcoming / Active
              </h3>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                {upcomingAppointments.length}
              </span>
            </div>

            {upcomingAppointments.length === 0 ? (
              <EmptyBox text="No active appointments right now." />
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                History
              </h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {completedAppointments.length}
              </span>
            </div>

            {completedAppointments.length === 0 ? (
              <EmptyBox text="No appointment history yet." />
            ) : (
              <div className="space-y-4">
                {completedAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const ChatTab = ({
  user,
  connections,
  selectedConnectionId,
  selectedConnection,
  messages,
  canUseChat,
  loadingConnections,
  loadingMessages,
  sendingMessage,
  messageText,
  attachmentText,
  showAttachmentInput,
  chatError,
  onSelectConnection,
  onMessageChange,
  onAttachmentChange,
  onToggleAttachmentInput,
  onClearAttachment,
  onSendMessage,
  onRefreshMessages,
}) => {
  const userId = String(user?._id || user?.id || "");
  const otherUser = getOtherUser(selectedConnection, user);

  return (
    <div className="mt-8 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
      <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-950">
              <MessageCircle className="h-6 w-6 text-cyan-700" />
              Appointment Conversation
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Chat only with clients who booked an accepted appointment with you.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshMessages}
            disabled={!selectedConnectionId || loadingMessages}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Chat
          </button>
        </div>
      </div>

      {!canUseChat && (
        <div className="m-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Lock className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-amber-800">
                Active Subscription Required
              </h3>

              <p className="mt-1 text-sm font-semibold leading-6 text-amber-700">
                Free and paid active plans can use conversation. Your account
                does not have an active subscription yet, so messaging is
                currently locked.
              </p>

              <a
                href="/plans"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700"
              >
                <Crown className="h-4 w-4" />
                Choose Plan
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[360px_1fr]">
        <div className="border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-slate-950">
              Appointment Clients
            </h3>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
              {connections.length}
            </span>
          </div>

          {loadingConnections ? (
            <LoadingBox text="Loading appointment clients..." />
          ) : connections.length === 0 ? (
            <EmptyBox text="No booked appointment conversations found yet." />
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => {
                const client = getOtherUser(connection, user);
                const active =
                  String(connection._id) === String(selectedConnectionId);

                const lastMessage =
                  connection.messages?.[connection.messages.length - 1];

                return (
                  <button
                    key={connection._id}
                    type="button"
                    onClick={() => onSelectConnection(connection._id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-cyan-300 bg-white shadow-md"
                        : "border-slate-200 bg-white/70 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                          active
                            ? "bg-cyan-600 text-white"
                            : "bg-cyan-50 text-cyan-700"
                        }`}
                      >
                        {getInitials(client?.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-slate-950">
                          {client?.name || "Client"}
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                          {getConnectionContextTitle(connection)}
                        </p>

                        <p className="mt-2 truncate text-xs text-slate-500">
                          {lastMessage?.message || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex min-h-[620px] flex-col bg-white">
          {selectedConnection ? (
            <>
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-lg font-black text-cyan-700">
                      {getInitials(otherUser?.name)}
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        {otherUser?.name || "Client"}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {getConnectionContextTitle(selectedConnection)}
                      </p>

                      <p className="mt-1 text-xs font-bold text-cyan-700">
                        {getConnectionContextSubtitle(selectedConnection)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-4 py-2 text-xs font-black capitalize ${getConnectionBadgeClass(
                      selectedConnection.status
                    )}`}
                  >
                    {selectedConnection.status}
                  </span>
                </div>
              </div>

              {chatError && (
                <div className="m-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  {chatError}
                </div>
              )}

              <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-5">
                {loadingMessages ? (
                  <LoadingBox text="Loading messages..." />
                ) : messages.length === 0 ? (
                  <EmptyBox text="No messages yet. Start the conversation with your client." />
                ) : (
                  messages.map((item) => {
                    const senderId = String(item.sender?._id || item.sender);
                    const isMine = senderId === userId;

                    return (
                      <div
                        key={item._id}
                        className={`flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[82%] rounded-3xl px-5 py-4 shadow-sm ${
                            isMine
                              ? "rounded-br-md bg-cyan-600 text-white"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                          }`}
                        >
                          <p
                            className={`mb-1 text-xs font-black ${
                              isMine ? "text-cyan-50" : "text-slate-500"
                            }`}
                          >
                            {isMine ? "You" : item.sender?.name || "Client"}
                          </p>

                          <p className="whitespace-pre-wrap text-sm font-semibold leading-6">
                            {item.message}
                          </p>

                          {item.attachments?.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {item.attachments.map((attachment, index) => (
                                <a
                                  key={`${attachment}-${index}`}
                                  href={attachment}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                                    isMine
                                      ? "bg-white/15 text-white"
                                      : "bg-slate-100 text-cyan-700"
                                  }`}
                                >
                                  <Paperclip className="h-3.5 w-3.5" />
                                  Google Drive Attachment {index + 1}
                                </a>
                              ))}
                            </div>
                          )}

                          <p
                            className={`mt-2 text-[11px] font-medium ${
                              isMine ? "text-cyan-50/80" : "text-slate-400"
                            }`}
                          >
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={onSendMessage}
                className="border-t border-slate-200 bg-white p-5"
              >
                <div className="grid gap-3">
                  <textarea
                    value={messageText}
                    onChange={(e) => onMessageChange(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder={
                      canUseChat
                        ? "Write your message. Do not share phone numbers, payment numbers, or social media links."
                        : "Activate a free or paid plan to use conversation..."
                    }
                    disabled={!canUseChat || sendingMessage}
                    className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />

                  {showAttachmentInput && (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-800">
                            Google Drive Attachment
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Only https://drive.google.com links are allowed.
                            Phone numbers and social media links are blocked.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={onClearAttachment}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>

                      <input
                        type="url"
                        value={attachmentText}
                        onChange={(e) => onAttachmentChange(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        disabled={!canUseChat || sendingMessage}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={onToggleAttachmentInput}
                        disabled={!canUseChat || sendingMessage}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          showAttachmentInput
                            ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Paperclip className="h-4 w-4" />
                        Attachment
                      </button>

                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          {messageText.length}/2000 characters
                        </p>

                        <p className="mt-1 text-xs font-semibold text-red-500">
                          Phone/payment numbers and social media links are
                          blocked.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        !canUseChat || sendingMessage || !messageText.trim()
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-700 hover:to-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {sendingMessage ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyBox text="Select a booked appointment client to open conversation." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HeroMiniCard = ({ icon, label, value }) => {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/15 p-4 text-white backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">{label}</p>
        {icon}
      </div>

      <h3 className="text-3xl font-black">{value}</h3>
    </div>
  );
};

const SectionCard = ({ icon, title, subtitle, children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8 ${className}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
          {icon}
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-950">{title}</h2>
          <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>

      {children}
    </motion.div>
  );
};

const InfoCard = ({ icon, label, value }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm">
        {icon}
      </div>

      <p className="text-sm font-semibold text-slate-500">{label}</p>

      <h4 className="mt-1 break-words text-base font-black text-slate-900">
        {value || "-"}
      </h4>
    </div>
  );
};

const MiniDetail = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words font-black capitalize text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
};

const StatCard = ({ title, value }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h3 className="mt-1 text-3xl font-black text-slate-950">{value}</h3>
    </div>
  );
};

const FeatureRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-black text-slate-700">{label}</p>

      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900">
        {readableFeature(value)}
      </span>
    </div>
  );
};

const LoadingBox = ({ text }) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-600">
      <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
      {text}
    </div>
  );
};

const EmptyBox = ({ text }) => {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
};

export default LawyerDashboard;