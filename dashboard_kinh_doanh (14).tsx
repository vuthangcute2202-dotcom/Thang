import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart,
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, DollarSign, 
  Package, Users, UploadCloud, Calendar, Filter,
  CheckCircle2, AlertCircle, Clock, Loader2,
  ChevronDown, ChevronUp, Minus, FileText, Copy, X, Check, Share2, Key, LogOut,
  PieChart as PieChartIcon, LayoutDashboard, Briefcase, ListTodo, AlertTriangle, Search, Plus, Trash2, Lock, Unlock, Eye, UserPlus, Edit, Settings,
  Shield, User, UserCog, CheckSquare, Square, Info, Archive, Database, Megaphone
} from 'lucide-react';

// --- FIREBASE IMPORTS DÀNH CHO LƯU TRỮ ĐÁM MÂY & PHÂN QUYỀN ---
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, dataAppId as appId } from './src/firebase';

const fallbackTeams = ['Nguyễn Huyền My', 'Nguyễn Thị Nhàn', 'Lê Quân'];
const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const PRODUCT_CATEGORIES = [
  'Bàn phím', 'Chuột', 'Tai nghe', 'Ghế', 'Bàn Gaming', 'Màn hình', 'Phụ Kiện', 'Case', 'Nguồn',
  'AIO', 'FLESPORTS', 'Thronmax', 'Sihoo', 'Huntkey', 'Patriot', 'Cidoo', 'Feeltek', 'Khác',
  'SIMORCHIP', 'GREATWALL', 'RAIDMAX', 'THUNDERBIRD', 'Netis', 'Dầu khí', 'SSTC', 'ZOTAC',
  'UNV', 'UNV- camera', 'UNV- thẻ nhớ', 'UNV- bộ chuyển mạch', 'UNV- đầu máy ghi hình', 'UNV- dây cáp mạng', 'UNV- màn hình'
];

const periodOptions = [
  { value: 'All', label: '📅 Toàn Năm 2026' },
  { value: 'Quý 1', label: '📊 Quý 1 (T1-T3)' },
  { value: 'Quý 2', label: '📊 Quý 2 (T4-T6)' },
  { value: 'Quý 3', label: '📊 Quý 3 (T7-T9)' },
  { value: 'Quý 4', label: '📊 Quý 4 (T10-T12)' },
  ...months.map(m => ({ value: m, label: `🗓️ ${m}` }))
];

const TEAM_YEARLY_PLANS = {
  'Nguyễn Huyền My': { 'Bàn phím': 7500000000, 'Màn hình': 21200000000, 'Phụ Kiện': 2000000000, 'Case': 4000000000 },
  'Nguyễn Thị Nhàn': { 'Bàn phím': 8500000000, 'Màn hình': 47600000000, 'Phụ Kiện': 10000000000 },
  'Lê Quân': { 'Dầu khí': 31700000000, 'UNV': 11500000000, 'GREATWALL': 20000000000 }
};

const monthWeights = [0.06, 0.06, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.09, 0.1, 0.1, 0.1];

const KNOWN_BRANDS = ['EDRA', 'UNV', 'UNIARCH', 'GREATWALL', 'FEELTEK', 'THUNDERBIRD', 'ACER', 'FLESPORTS', 'FL', 'THRONMAX', 'SIHOO', 'HUNTKEY', 'PATRIOT', 'CIDOO', 'SIMORCHIP', 'RAIDMAX', 'ZOTAC', 'NETIS', 'SSTC', 'DAHUA', 'HIKVISION', 'DELL', 'ASUS', 'HP', 'LOGITECH', 'MSI'];

const extractBrand = (name) => {
    if (!name) return 'Khác';
    const upperName = name.toUpperCase();
    
    // Gộp chung các định dạng viết khác nhau của EDRA
    if (upperName.includes('E-DRA') || upperName.includes('EDRA')) return 'EDRA';
    if (upperName.includes('UNIARCH')) return 'UNIARCH';
    if (upperName.includes('THUNDERBIRD')) return 'THUNDERBIRD';
    if (/(?:HIỆU|HIEU)\s*[-:]\s*FL\b/.test(upperName) || /\bFL\b/.test(upperName)) return 'FL';

    for (const b of KNOWN_BRANDS) {
        if (upperName.includes(b)) return b;
    }
    return 'Khác';
};

const generateMockPlans = () => {
  const plans = [];
  fallbackTeams.forEach(team => {
    const teamPlans = TEAM_YEARLY_PLANS[team];
    if (teamPlans) {
      Object.keys(teamPlans).forEach(product => {
        const yearlyValue = teamPlans[product];
        months.forEach((month, idx) => {
          plans.push({ team, productGroup: product, month, planValue: yearlyValue * monthWeights[idx] });
        });
      });
    }
  });
  return plans;
};

const MOCK_TASKS = [
  { id: 'DA001', name: 'Triển khai CRM Khách hàng', goal: 'Đồng bộ data Sales', empId: 'NV01', empName: 'Lê Quân', startDate: '2026-05-01', endDate: '2026-05-20', status: 'Đã hoàn thành', priority: 'Cao' },
  { id: 'DA002', name: 'Chiến dịch UNV Tháng 5', goal: 'Đạt target 5 Tỷ', empId: 'NV02', empName: 'Nguyễn Huyền My', startDate: '2026-05-10', endDate: '2026-06-05', status: 'Đang chạy', priority: 'Cao' },
  { id: 'DA003', name: 'Clear tồn kho Màn hình', goal: 'Xả 2000 chiếc', empId: 'NV03', empName: 'Nguyễn Thị Nhàn', startDate: '2026-05-28', endDate: '2026-06-15', status: 'Bắt đầu triển khai', priority: 'Trung bình' }
];

const formatVND = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#d946ef', '#f97316', '#64748b', '#84cc16', '#14b8a6', '#f43f5e', '#6366f1', '#ec4899', '#0ea5e9', '#eab308'];
const STATUS_COLORS = { 'Bắt đầu triển khai': '#3b82f6', 'Đang chạy': '#f59e0b', 'Đã hoàn thành': '#10b981', 'Hủy': '#64748b' };
const PRIORITY_COLORS = { 'Cao': '#ef4444', 'Trung bình': '#f59e0b', 'Thấp': '#3b82f6' };

export default function App() {
  const [activeTab, setActiveTab] = useState('finance'); 
  const [activeTeamTab, setActiveTeamTab] = useState('finance_team'); 
  const [activeInventoryTab, setActiveInventoryTab] = useState('overview'); // Thêm state quản lý tab Tồn kho
  
  const [chartGranularity, setChartGranularity] = useState('month'); 
  const [financeMetric, setFinanceMetric] = useState('dthuChuaVat'); 
  const [reportFilters, setReportFilters] = useState({
    finance: { teams: [], period: 'All' },
    teamFinance: { teams: [], period: 'All' },
    custom: { teams: [], period: 'All' }
  });
  const [isTeamFilterOpen, setIsTeamFilterOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeReportFilterKey = activeTab === 'custom'
    ? 'custom'
    : activeTab === 'team' && activeTeamTab === 'finance_team'
      ? 'teamFinance'
      : 'finance';
  const selectedTeams = reportFilters[activeReportFilterKey].teams;
  const selectedPeriod = reportFilters[activeReportFilterKey].period;
  const setSelectedTeams = (nextTeams) => {
    setReportFilters(current => {
      const currentTeams = current[activeReportFilterKey].teams;
      const teams = typeof nextTeams === 'function' ? nextTeams(currentTeams) : nextTeams;
      return { ...current, [activeReportFilterKey]: { ...current[activeReportFilterKey], teams } };
    });
  };
  const setSelectedPeriod = (period) => {
    setReportFilters(current => ({
      ...current,
      [activeReportFilterKey]: { ...current[activeReportFilterKey], period }
    }));
  };

  const [progressPeriodMode, setProgressPeriodMode] = useState('global'); 

  const [rawPlans, setRawPlans] = useState(generateMockPlans());
  const [rawActuals, setRawActuals] = useState([]);

  const actualFileInputRef = useRef(null);
  const planFileInputRef = useRef(null);
  const [uploadedActual, setUploadedActual] = useState(null);
  const [uploadedPlan, setUploadedPlan] = useState(null);

  // Thêm state Quản trị Tồn kho
  const [rawInventory, setRawInventory] = useState([]);
  const [invSearch, setInvSearch] = useState('');
  const [invRegionFilter, setInvRegionFilter] = useState('All');
  const [invBrandFilters, setInvBrandFilters] = useState([]);
  const [invProductFilters, setInvProductFilters] = useState([]);
  const [isInvBrandFilterOpen, setIsInvBrandFilterOpen] = useState(false);
  const [isInvProductFilterOpen, setIsInvProductFilterOpen] = useState(false);
  const inventoryFileInputRef = useRef(null);

  // Thêm state cho Tồn kho chi tiết mới
  const [rawDetailedInventory, setRawDetailedInventory] = useState([]);
  const [invDetailSearch, setInvDetailSearch] = useState('');
  const [invDetailPeriod, setInvDetailPeriod] = useState('All');
  const [invDetailBrandFilters, setInvDetailBrandFilters] = useState([]);
  const [isInvDetailBrandFilterOpen, setIsInvDetailBrandFilterOpen] = useState(false);
  const detailedInventoryFileInputRef = useRef(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [taskFilters, setTaskFilters] = useState({ startDate: '', endDate: '', empName: 'All', status: 'All' });
  const [newTask, setNewTask] = useState({ id: '', name: '', goal: '', empId: '', empName: '', startDate: '', endDate: '', status: 'Bắt đầu triển khai', priority: 'Trung bình' });
  const [salesPrograms, setSalesPrograms] = useState([]);
  const [salesPeriodFilter, setSalesPeriodFilter] = useState('All');
  const [newSalesProgram, setNewSalesProgram] = useState({
    team: '', period: 'All', name: '', goal: '', details: '',
    productTargets: {},
    completion: 0, deploymentStatus: 'Chưa triển khai'
  });
  const [salesProductDraft, setSalesProductDraft] = useState({ product: '', targetRevenue: 0, targetSales: 0, targetQty: 0 });

  // Custom Modal State thay thế cho window.confirm / alert
  const [confirmAction, setConfirmAction] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: null, hideCancel: false, confirmText: 'Xác nhận' });
  const [notification, setNotification] = useState({ isOpen: false, message: '' });

  // Auth & Sharing
  const [user, setUser] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [openCodeModal, setOpenCodeModal] = useState(false);
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  const [taskToDelete, setTaskToDelete] = useState(null);

  // App Users / Permissions
  const [appUser, setAppUser] = useState(null);
  const [appUsersList, setAppUsersList] = useState([]);
  const [isLoadingAppUsers, setIsLoadingAppUsers] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', systemCode: '' });
  const [loginError, setLoginError] = useState('');
  const [authMode, setAuthMode] = useState('login'); 

  const [isAppUserModalOpen, setIsAppUserModalOpen] = useState(false);
  const [editingAppUser, setEditingAppUser] = useState({ id: '', username: '', password: '', role: 'user', permissions: [], allowedTeams: [] });
  const [adminModalError, setAdminModalError] = useState('');

  // Custom Groups
  const [customGroups, setCustomGroups] = useState([]);
  const [isCustomGroupModalOpen, setIsCustomGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState({ id: '', name: '', target: 0, productTargets: {}, members: [] });
  const [newMemberInput, setNewMemberInput] = useState('');
  const [groupModalError, setGroupModalError] = useState('');

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent; 
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1; 
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8; 
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleAddCustomMember = () => {
    const name = newMemberInput.trim();
    if (name && !editingGroup.members.includes(name)) {
      setEditingGroup({ ...editingGroup, members: [...editingGroup.members, name] });
      setNewMemberInput('');
    }
  };

  const handleRemoveCustomMember = (nameToRemove) => {
    setEditingGroup({ ...editingGroup, members: editingGroup.members.filter(m => m !== nameToRemove) });
  };

  const periodLabel = useMemo(() => {
    const opt = periodOptions.find(o => o.value === selectedPeriod);
    return opt ? opt.label.replace(/[^a-zA-Z0-9 \-()]/g, '').trim() : selectedPeriod;
  }, [selectedPeriod]);

  const currentMonthNum = useMemo(() => {
     return new Date().getMonth() + 1; 
  }, []);
  const currentMonthLabel = useMemo(() => `Tháng ${currentMonthNum}`, [currentMonthNum]);

  useEffect(() => {
    if (!auth || !db) {
      const localAdmin = {
        id: 'local-admin',
        username: 'local',
        password: '',
        role: 'admin',
        permissions: [],
        allowedTeams: ['All']
      };
      setAppUsersList([localAdmin]);
      setAppUser(localAdmin);
      setIsLoadingAppUsers(false);
      return;
    }
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch(e) { console.error("Auth error", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const fetchAppUsers = async () => {
        try {
            const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'));
            const users = [];
            snap.forEach(doc => users.push({ ...doc.data(), id: doc.id }));
            setAppUsersList(users);
        } catch(e) { console.error("Lỗi tải users", e); }
        setIsLoadingAppUsers(false);
    };
    fetchAppUsers();
  }, [user, db]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const found = appUsersList.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (found) {
        setAppUser(found);
        if (found.role === 'admin' || found.permissions.includes('tab_finance')) setActiveTab('finance');
        else if (found.permissions.includes('tab_inventory')) setActiveTab('inventory');
        else if (found.permissions.includes('tab_team')) { setActiveTab('team'); setActiveTeamTab(found.permissions.includes('sub_finance') ? 'finance_team' : found.permissions.includes('sub_sales') ? 'sales_programs' : found.permissions.includes('sub_overview') ? 'task_overview' : 'task_management'); }
        else if (found.permissions.includes('tab_custom')) setActiveTab('custom');
        else setActiveTab('none');
    } else setLoginError('Tài khoản hoặc mật khẩu không chính xác!');
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.username || !loginForm.password || !loginForm.systemCode) return;
    
    if (loginForm.systemCode !== '22022004') {
        setLoginError('Mã hệ thống không chính xác!');
        return;
    }

    if (appUsersList.some(u => u.username === loginForm.username)) {
        setLoginError('Tên đăng nhập này đã có người sử dụng!');
        return;
    }
    const newAdmin = { username: loginForm.username, password: loginForm.password, role: 'admin', permissions: [], allowedTeams: ['All'] };
    try {
       const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), newAdmin);
       const created = { id: docRef.id, ...newAdmin };
       setAppUsersList([...appUsersList, created]);
       setAppUser(created);
       setActiveTab('admin'); 
    } catch(err) { setLoginError('Lỗi hệ thống khi tạo Admin'); }
  };

  const handleSaveAppUser = async () => {
    if (!editingAppUser.username || !editingAppUser.password) { 
        setAdminModalError('Vui lòng nhập đủ tên đăng nhập và mật khẩu!'); 
        return; 
    }
    const normalizedUsername = editingAppUser.username.trim().toLowerCase();
    if (appUsersList.some(u => u.id !== editingAppUser.id && u.username?.trim().toLowerCase() === normalizedUsername)) {
        setAdminModalError('Tên đăng nhập này đã tồn tại. Vui lòng sử dụng tên khác!');
        return;
    }
    setAdminModalError('');
    try {
        const { id, ...userData } = editingAppUser;
        if (editingAppUser.id) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', editingAppUser.id), userData);
            setAppUsersList(appUsersList.map(u => u.id === editingAppUser.id ? editingAppUser : u));
        } else {
            const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), userData);
            setAppUsersList([...appUsersList, { ...userData, id: docRef.id }]);
        }
        setIsAppUserModalOpen(false);
    } catch(e) { 
        setAdminModalError("Lỗi lưu người dùng!"); 
    }
  };

  const handleDeleteAppUser = (account) => {
    setConfirmAction({
        isOpen: true,
        title: 'Xóa Tài Khoản',
        message: `Bạn có chắc chắn muốn xóa đúng tài khoản "${account.username}" đang chọn không? Hành động này không thể hoàn tác.`,
        type: 'danger',
        onConfirm: async () => {
            try {
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', account.id));
                setAppUsersList(current => current.filter(u => u.id !== account.id));
                if (appUser?.id === account.id) setAppUser(null);
                setConfirmAction({ isOpen: false });
                setNotification({ isOpen: true, message: `Đã xóa đúng tài khoản "${account.username}" được chọn.` });
            } catch (error) {
                console.error('Lỗi xóa tài khoản:', error);
                setConfirmAction({ isOpen: false });
                setNotification({ isOpen: true, message: 'Không thể xóa tài khoản. Vui lòng thử lại hoặc kiểm tra kết nối Firebase.' });
            }
        },
        hideCancel: false,
        confirmText: 'Xác nhận'
    });
  };

  const hasAccess = (key) => {
    if (!appUser) return false;
    if (appUser.role === 'admin') return true;
    return appUser.permissions?.includes(key);
  };

  useEffect(() => {
    if (!user || !db) return;
    const loadSharedReportURL = async () => {
       const params = new URLSearchParams(window.location.search);
       const reportId = params.get('reportId');
       if (reportId) handleLoadFromCode(reportId);
    };
    loadSharedReportURL();
  }, [user]);

  const handleLoadFromCode = async (code) => {
    if (!user || !db || !code) return;
    setIsProcessing(true);
    try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_reports', code);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.plans) setRawPlans(data.plans);
            if (data.tasks) setTasks(data.tasks);
            if (data.salesPrograms) setSalesPrograms(data.salesPrograms);
            if (data.customGroups) setCustomGroups(data.customGroups);
            if (data.detailedInventory) setRawDetailedInventory(data.detailedInventory); // Load tồn kho chi tiết
            
            let allActuals = [];
            if (data.actuals) allActuals = data.actuals;
            else if (data.chunkCount !== undefined) {
                const chunkPromises = [];
                for (let i = 0; i < data.chunkCount; i++) chunkPromises.push(getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shared_reports', `${code}_chunk_${i}`)));
                const chunkSnaps = await Promise.all(chunkPromises);
                chunkSnaps.forEach(snap => {
                    if (snap.exists() && snap.data().actualsChunk) allActuals = allActuals.concat(snap.data().actualsChunk);
                });
            }
            if (allActuals.length > 0) setRawActuals(allActuals);
            
            setUploadedActual("Dữ liệu được chia sẻ");
            setUploadedPlan("Dữ liệu được chia sẻ");
            setIsViewOnly(true);
            setOpenCodeModal(false);
            setShareCodeInput('');
            setCodeError('');
        } else setCodeError("Mã báo cáo không tồn tại hoặc đã hết hạn!");
    } catch (err) {
        console.error("Lỗi khi tải báo cáo:", err);
        setCodeError("Lỗi hệ thống khi tải báo cáo.");
    }
    setIsProcessing(false);
  };

  const handleGenerateShareLink = async () => {
    if (!user || !db) return;
    setIsSharing(true);
    try {
       const reportCode = Math.random().toString(36).substring(2, 8).toUpperCase();
       const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_reports', reportCode);
       const CHUNK_SIZE = 500; 
       const chunks = [];
       for (let i = 0; i < rawActuals.length; i += CHUNK_SIZE) chunks.push(rawActuals.slice(i, i + CHUNK_SIZE));
       
       await setDoc(docRef, {
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
          plans: rawPlans,
          tasks: tasks, 
          salesPrograms: salesPrograms,
          customGroups: customGroups,
          detailedInventory: rawDetailedInventory, // Lưu tồn kho chi tiết
          chunkCount: chunks.length
       });
       
       const chunkPromises = chunks.map((chunk, i) => {
           const chunkRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_reports', `${reportCode}_chunk_${i}`);
           return setDoc(chunkRef, { actualsChunk: chunk });
       });
       await Promise.all(chunkPromises);
       
       setGeneratedLink(reportCode);
       setShareModalOpen(true);
    } catch (err) {
       console.error("Lỗi tạo mã chia sẻ:", err);
    }
    setIsSharing(false);
  };

  const copyShareLink = () => {
     try {
        navigator.clipboard.writeText(generatedLink);
        setIsCopied(true); setTimeout(() => setIsCopied(false), 2000);
     } catch (err) {
        const textArr = document.createElement("textarea"); textArr.value = generatedLink;
        document.body.appendChild(textArr); textArr.select(); document.execCommand("copy"); document.body.removeChild(textArr);
        setIsCopied(true); setTimeout(() => setIsCopied(false), 2000);
     }
  }

  const loadSheetJS = () => {
    return new Promise((resolve) => {
      if (window.XLSX) return resolve(window.XLSX);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => resolve(window.XLSX);
      document.body.appendChild(script);
    });
  };

  const parseNum = (val) => {
    if (typeof val === 'number') return val;
    if (!val || val === '') return 0;
    let str = String(val).trim();
    if (str === '-') return 0;
    if (str.startsWith('(') && str.endsWith(')')) str = '-' + str.slice(1, -1);
    str = str.replace(/\s/g, ''); 
    if (str.includes(',') && str.includes('.')) {
        const lastComma = str.lastIndexOf(',');
        const lastDot = str.lastIndexOf('.');
        if (lastDot > lastComma) str = str.replace(/,/g, ''); 
        else str = str.replace(/\./g, '').replace(',', '.'); 
    } else {
        if ((str.match(/\./g) || []).length > 1) str = str.replace(/\./g, '');
        else if ((str.match(/,/g) || []).length > 1) str = str.replace(/,/g, '');
        else {
            if (/\.\d{3}$/.test(str)) str = str.replace(/\./g, '');
            else if (/,\d{3}$/.test(str)) str = str.replace(/,/g, '');
            else str = str.replace(',', '.');
        }
    }
    const num = Number(str);
    return isNaN(num) ? 0 : num;
  };

  const matchesPeriod = (monthLabel, period) => {
    if (period === 'All') return true;
    if (period.startsWith('Quý')) {
       const mNum = parseInt(monthLabel.replace('Tháng ', ''));
       if (isNaN(mNum)) return false;
       if (period === 'Quý 1') return mNum >= 1 && mNum <= 3;
       if (period === 'Quý 2') return mNum >= 4 && mNum <= 6;
       if (period === 'Quý 3') return mNum >= 7 && mNum <= 9;
       if (period === 'Quý 4') return mNum >= 10 && mNum <= 12;
    }
    return monthLabel === period;
  };

  const filterByPeriod = (monthLabel) => {
    return matchesPeriod(monthLabel, selectedPeriod);
  };

  const persistentDatasetMetaRef = () => doc(db, 'artifacts', appId, 'public', 'data', 'persistent_datasets', 'current');
  const persistentDatasetChunksRef = () => collection(db, 'artifacts', appId, 'public', 'data', 'persistent_datasets', 'current', 'chunks');

  const savePersistentDataset = async (type, rows, fileName) => {
    if (!user || !db) return;
    const chunkSize = 200;
    const chunks = [];
    for (let index = 0; index < rows.length; index += chunkSize) chunks.push(rows.slice(index, index + chunkSize));

    const existing = await getDocs(persistentDatasetChunksRef());
    const staleDeletes = [];
    existing.forEach(snapshot => {
      if (snapshot.id.startsWith(`${type}_`)) staleDeletes.push(deleteDoc(snapshot.ref));
    });
    await Promise.all(staleDeletes);

    await Promise.all(chunks.map((chunk, index) => (
      setDoc(doc(persistentDatasetChunksRef(), `${type}_${index}`), { rows: chunk })
    )));
    await setDoc(persistentDatasetMetaRef(), {
      [`${type}ChunkCount`]: chunks.length,
      [`${type}FileName`]: fileName || '',
      [`${type}UpdatedAt`]: new Date().toISOString()
    }, { merge: true });
  };

  useEffect(() => {
    if (!user || !db || new URLSearchParams(window.location.search).has('reportId')) return;
    const loadPersistentDatasets = async () => {
      try {
        const metaSnapshot = await getDoc(persistentDatasetMetaRef());
        if (!metaSnapshot.exists()) return;
        const meta = metaSnapshot.data();
        const chunksSnapshot = await getDocs(persistentDatasetChunksRef());
        const chunkMap = {};
        chunksSnapshot.forEach(snapshot => {
          chunkMap[snapshot.id] = snapshot.data().rows || [];
        });
        const readDataset = type => {
          const count = Number(meta[`${type}ChunkCount`]) || 0;
          let rows = [];
          for (let index = 0; index < count; index++) rows = rows.concat(chunkMap[`${type}_${index}`] || []);
          return rows;
        };

        if (meta.actualsChunkCount !== undefined) setRawActuals(readDataset('actuals'));
        if (meta.plansChunkCount !== undefined) setRawPlans(readDataset('plans'));
        if (meta.inventoryChunkCount !== undefined) setRawInventory(readDataset('inventory'));
        if (meta.detailedInventoryChunkCount !== undefined) setRawDetailedInventory(readDataset('detailedInventory'));
        if (meta.actualsFileName) setUploadedActual(meta.actualsFileName);
        if (meta.plansFileName) setUploadedPlan(meta.plansFileName);
      } catch (error) {
        console.error('Lỗi tải dữ liệu đã lưu:', error);
        setNotification({ isOpen: true, message: 'Không thể tải dữ liệu đã lưu từ Firebase.' });
      }
    };
    loadPersistentDatasets();
  }, [user, db]);

  const handleActualFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadedActual(file.name);
    try {
      const XLSX = await loadSheetJS();
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" }); 
        const parsedActuals = [];
        let currentActualMonth = 'Tháng 1'; 
        let currentActualTeam = 'Chưa phân nhóm'; 

        data.forEach((row) => {
          const isTotalRow = Object.values(row).some(v => typeof v === 'string' && (v.toLowerCase().includes('tổng cộng') || v.toLowerCase() === 'cộng'));
          if (isTotalRow) return;

          let doanhSo = 0, dthuChuaVAT = 0, teamRaw = '', empRaw = '', spRaw = '', dateRaw = '';
          for (const key in row) {
              const k = key.toUpperCase();
              if (k.includes('DTHU CHƯA VAT') || k.includes('DOANH THU CHƯA VAT')) dthuChuaVAT = parseNum(row[key]);
              else if (k.includes('DOANH SỐ BÁN') || k.includes('DOANH SO BAN')) doanhSo = parseNum(row[key]);
              else if (k.includes('TRƯỞNG NHÓM')) teamRaw = row[key];
              else if (k.includes('TÊN NHÂN VIÊN') || k.includes('NHÂN VIÊN')) empRaw = row[key];
              else if (k.includes('NHÓM SẢN PHẨM') || k.includes('MẶT HÀNG') || k.includes('SẢN PHẨM')) spRaw = row[key];
              else if (k.includes('NGÀY HẠCH TOÁN') || k.includes('NGÀY CHỨNG TỪ')) dateRaw = row[key];
          }

          if (doanhSo === 0 && dthuChuaVAT === 0) return;
          if (teamRaw && String(teamRaw).trim() !== '') currentActualTeam = String(teamRaw).trim();
          let currentEmp = (empRaw && String(empRaw).trim() !== '') ? String(empRaw).trim() : 'Chưa xác định';

          let explicitMonth = null;
          Object.values(row).forEach(val => {
            if (typeof val === 'string') {
               const match = val.trim().match(/^Tháng\s*0?(\d{1,2})$/i);
               if (match) explicitMonth = `Tháng ${parseInt(match[1])}`;
            }
          });

          if (explicitMonth) currentActualMonth = explicitMonth;
          else if (dateRaw) {
              if (typeof dateRaw === 'number') {
                  const jsDate = new Date((dateRaw - 25569) * 86400 * 1000);
                  currentActualMonth = `Tháng ${jsDate.getUTCMonth() + 1}`;
              } else if (typeof dateRaw === 'string') {
                  const match = dateRaw.match(/(?:\/|-)(\d{1,2})(?:\/|-)/);
                  if (match) currentActualMonth = `Tháng ${parseInt(match[1])}`;
              }
          }

          let jsDate = new Date();
          if (typeof dateRaw === 'number') jsDate = new Date((dateRaw - 25569) * 86400 * 1000);
          else if (typeof dateRaw === 'string') {
              const parts = dateRaw.split(/[-/]/);
              if (parts.length === 3) {
                  if (parts[0].length === 4) jsDate = new Date(parts[0], parts[1]-1, parts[2]);
                  else jsDate = new Date(parts[2], parts[1]-1, parts[0]);
              }
          }
          if (isNaN(jsDate.getTime())) jsDate = new Date();
          const stdDate = `${jsDate.getFullYear()}-${String(jsDate.getMonth()+1).padStart(2, '0')}-${String(jsDate.getDate()).padStart(2, '0')}`;

          let spRawString = String(spRaw || 'Khác').trim();
          let sp = spRawString;
          let subSp = spRawString;
          if (sp.toUpperCase().startsWith('UNV')) sp = 'UNV';

          let quarterVal = 1;
          const monthNum = parseInt(currentActualMonth.replace('Tháng ', ''));
          if (!isNaN(monthNum)) quarterVal = Math.ceil(monthNum / 3);

          parsedActuals.push({
            date: stdDate, month: currentActualMonth, quarter: `Quý ${quarterVal}`, team: currentActualTeam,
            employee: currentEmp, productGroup: sp, subProductGroup: subSp, revenueActual: dthuChuaVAT, 
            doanhSoBan: doanhSo, qtyActual: parseNum(row['Tổng số lượng bán'])
          });
        });
        setRawActuals(parsedActuals);
        try {
          await savePersistentDataset('actuals', parsedActuals, file.name);
        } catch (error) {
          console.error('Lỗi lưu dữ liệu thực tế:', error);
          setNotification({ isOpen: true, message: 'Đã đọc file nhưng không thể lưu dữ liệu thực tế lên Firebase.' });
        }
        setIsProcessing(false);
      };
      reader.readAsBinaryString(file);
    } catch (error) { console.error("Lỗi đọc file Thực tế:", error); setIsProcessing(false); }
    
    e.target.value = ''; // Tự động reset input sau khi đọc xong
  };

  const handleInventoryFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const XLSX = await loadSheetJS();
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const parsedInv = [];

        const normalizeHeader = value => String(value || '').trim().toLowerCase();
        const headerIdx = data.findIndex(row => row.some(value => normalizeHeader(value).includes('mã hàng')));

        if (headerIdx > -1) {
          const mainHeaders = data[headerIdx].map(normalizeHeader);
          const subHeaders = (data[headerIdx + 1] || []).map(normalizeHeader);
          const hasSubHeaders = subHeaders.some(value => value.includes('số lượng') || value.includes('giá trị'));
          let currentGroup = '';
          let cRegion = -1, cWarehouse = -1, cProductCode = -1, cProductName = -1, cEndQty = -1, cEndValue = -1;

          for (let index = 0; index < Math.max(mainHeaders.length, subHeaders.length); index++) {
            if (mainHeaders[index]) currentGroup = mainHeaders[index];
            const main = mainHeaders[index] || '';
            const sub = subHeaders[index] || '';
            if (main.includes('khu vực')) cRegion = index;
            else if (main.includes('tên kho') || main.includes('mã kho')) cWarehouse = index;
            else if (main.includes('mã hàng')) cProductCode = index;
            else if (main.includes('tên hàng')) cProductName = index;

            const isEndPeriod = currentGroup.includes('cuối kỳ') || currentGroup.includes('tồn kho');
            if (isEndPeriod && sub.includes('số lượng')) cEndQty = index;
            if (isEndPeriod && sub.includes('giá trị')) cEndValue = index;
            if (!hasSubHeaders && (main.includes('số lượng tồn') || main.includes('cuối kỳ'))) cEndQty = index;
            if (!hasSubHeaders && main.includes('giá trị tồn')) cEndValue = index;
          }

          data.slice(headerIdx + (hasSubHeaders ? 2 : 1)).forEach(row => {
            const maHang = row[cProductCode];
            const tenHang = row[cProductName];
            const cuoiKy = parseNum(row[cEndQty]);
            const giaTriTon = parseNum(row[cEndValue]);
            const tenKho = row[cWarehouse];
            const khuVuc = cRegion > -1 ? row[cRegion] : tenKho;
            if (maHang && tenHang && (cuoiKy > 0 || giaTriTon > 0)) {
              parsedInv.push({
                  region: String(khuVuc || 'Chưa xác định').trim(),
                  warehouse: String(tenKho || 'Chưa xác định').trim(),
                  productCode: String(maHang).trim(),
                  productName: String(tenHang).trim(),
                  brand: extractBrand(tenHang),
                  qty: cuoiKy,
                  inventoryValue: giaTriTon
              });
            }
          });
        }
        setRawInventory(parsedInv);
        try {
          await savePersistentDataset('inventory', parsedInv, file.name);
        } catch (error) {
          console.error('Lỗi lưu dữ liệu tồn kho:', error);
          setNotification({ isOpen: true, message: 'Đã đọc file nhưng không thể lưu dữ liệu tồn kho lên Firebase.' });
        }
        setIsProcessing(false);
      };
      reader.readAsBinaryString(file);
    } catch (error) { console.error("Lỗi đọc file Tồn kho:", error); setIsProcessing(false); }
    
    e.target.value = '';
  };

  const handleDetailedInventoryFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const XLSX = await loadSheetJS();
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // Lấy raw data 2D array để xử lý Merge Cell (Header 2 dòng)
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }); 
        const parsedInv = [];

        // Tìm dòng chứa Header chính (dòng chứa chữ Mã hàng)
        let headerIdx = -1;
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            if (data[i].some(v => String(v).toLowerCase().includes('mã hàng'))) {
                headerIdx = i; break;
            }
        }

        if (headerIdx > -1) {
            const h1 = data[headerIdx].map(x => String(x).toLowerCase().trim());
            const h2 = data.length > headerIdx + 1 ? data[headerIdx + 1].map(x => String(x).toLowerCase().trim()) : [];

            // Mapping mặc định theo format chuẩn trong ảnh, phòng trường hợp dynamic map lỗi
            let cTenKho=0, cMaKho=1, cMaHang=2, cTenHang=3, cDVT=4, cDauKySL=5, cDauKyGT=6, cXuatKhoSL=7, cXuatKhoGT=8, cCuoiKySL=9, cCuoiKyGT=10, cNhanHang=11;

            let currentGroup = '';
            for(let i = 0; i < Math.max(h1.length, h2.length); i++) {
                const v1 = h1[i] || ''; const v2 = h2[i] || '';
                if (v1) currentGroup = v1;

                if(v1.includes('tên kho')) cTenKho = i;
                else if(v1.includes('mã kho')) cMaKho = i;
                else if(v1.includes('mã hàng')) cMaHang = i;
                else if(v1.includes('tên hàng')) cTenHang = i;
                else if(v1.includes('đvt') || v1.includes('đơn vị')) cDVT = i;
                else if(v1.includes('nhãn hàng')) cNhanHang = i;

                if(currentGroup.includes('đầu kỳ')) {
                    if(v2.includes('số lượng') || v1.includes('số lượng')) cDauKySL = i;
                    if(v2.includes('giá trị') || v1.includes('giá trị')) cDauKyGT = i;
                } else if(currentGroup.includes('xuất kho')) {
                    if(v2.includes('số lượng') || v1.includes('số lượng')) cXuatKhoSL = i;
                    if(v2.includes('giá trị') || v1.includes('giá trị')) cXuatKhoGT = i;
                } else if(currentGroup.includes('cuối kỳ')) {
                    if(v2.includes('số lượng') || v1.includes('số lượng')) cCuoiKySL = i;
                    if(v2.includes('giá trị') || v1.includes('giá trị')) cCuoiKyGT = i;
                }
            }

            const isDoubleHeader = h2.some(x => x.includes('số lượng') || x.includes('giá trị'));
            const startRow = headerIdx + (isDoubleHeader ? 2 : 1);

            for (let i = startRow; i < data.length; i++) {
                const row = data[i];
                if (!row[cMaHang] && !row[cTenHang]) continue; // Skip dòng trống
                
                parsedInv.push({
                    tenKho: row[cTenKho] || '',
                    maKho: row[cMaKho] || '',
                    maHang: row[cMaHang] || '',
                    tenHang: row[cTenHang] || '',
                    dvt: row[cDVT] || '',
                    dauKySL: parseNum(row[cDauKySL]),
                    dauKyGT: parseNum(row[cDauKyGT]),
                    xuatKhoSL: parseNum(row[cXuatKhoSL]),
                    xuatKhoGT: parseNum(row[cXuatKhoGT]),
                    cuoiKySL: parseNum(row[cCuoiKySL]),
                    cuoiKyGT: parseNum(row[cCuoiKyGT]),
                    nhanHang: row[cNhanHang] || extractBrand(row[cTenHang]),
                    nhomHang: extractBrand(`${row[cNhanHang] || ''} ${row[cTenHang] || ''}`)
                });
            }
        }
        setRawDetailedInventory(parsedInv);
        try {
          await savePersistentDataset('detailedInventory', parsedInv, file.name);
        } catch (error) {
          console.error('Lỗi lưu dữ liệu tồn kho chi tiết:', error);
          setNotification({ isOpen: true, message: 'Đã đọc file nhưng không thể lưu dữ liệu tồn kho chi tiết lên Firebase.' });
        }
        setIsProcessing(false);
      };
      reader.readAsBinaryString(file);
    } catch (error) { console.error("Lỗi đọc file Tồn kho chi tiết:", error); setIsProcessing(false); }
    
    e.target.value = '';
  };

  const handlePlanFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadedPlan(file.name);
    try {
      const XLSX = await loadSheetJS();
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const parsedPlans = [];
        let teamCol = -1, productCol = -1, monthCols = {};
        let headerRowIndex = -1;

        for (let i = 0; i < Math.min(data.length, 15); i++) {
          let tempMonthCols = {}, foundTeam = false, foundProduct = false;
          data[i].forEach((val, idx) => {
            if (typeof val === 'string') {
              const str = val.toLowerCase().trim();
              if (str.includes('trưởng nhóm')) { teamCol = idx; foundTeam = true; }
              if (str.includes('sản phẩm') || str === 'nhóm sản phẩm' || str === 'mặt hàng') { productCol = idx; foundProduct = true; }
              const monthMatch = str.match(/(?:tháng|t)\s*0?(\d{1,2})(?:\.|\/|\s|$)/i);
              if (monthMatch) {
                const mNum = parseInt(monthMatch[1]);
                if (mNum >= 1 && mNum <= 12) tempMonthCols[`Tháng ${mNum}`] = idx;
              }
            }
          });
          if (foundTeam || foundProduct || Object.keys(tempMonthCols).length > 0) {
             headerRowIndex = Math.max(headerRowIndex, i); monthCols = { ...monthCols, ...tempMonthCols }; 
          }
        }

        if (teamCol === -1) teamCol = 0;
        if (productCol === -1) productCol = 1;
        if (Object.keys(monthCols).length === 0) {
           for (let m = 1; m <= 12; m++) monthCols[`Tháng ${m}`] = productCol + m;
        }

        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 1;
        let currentTeam = 'Chưa phân nhóm'; 

        for (let i = startRow; i < data.length; i++) {
          const row = data[i];
          const rawTeam = String(row[teamCol] || '').trim();
          let product = String(row[productCol] || '').trim();

          if (rawTeam && !rawTeam.toLowerCase().includes('trưởng nhóm')) currentTeam = rawTeam;
          const team = currentTeam;

          if (!product || product.toLowerCase().includes('sản phẩm')) continue;
          if (team.toLowerCase().startsWith('tổng') || product.toLowerCase().startsWith('tổng') || product.toLowerCase().startsWith('cộng')) continue;
          if (product.toUpperCase().startsWith('UNV-') || product.toUpperCase().startsWith('UNV -')) continue;

          const mKeys = Object.keys(monthCols);
          if (mKeys.length > 0) {
            mKeys.forEach(mName => {
              const num = parseNum(row[monthCols[mName]]);
              if (num !== 0) parsedPlans.push({ team: team, productGroup: product, month: mName, planValue: num });
            });
          }
        }
        if (parsedPlans.length > 0) {
          setRawPlans(parsedPlans);
          try {
            await savePersistentDataset('plans', parsedPlans, file.name);
          } catch (error) {
            console.error('Lỗi lưu dữ liệu kế hoạch:', error);
            setNotification({ isOpen: true, message: 'Đã đọc file nhưng không thể lưu dữ liệu kế hoạch lên Firebase.' });
          }
        }
        setIsProcessing(false);
      };
      reader.readAsBinaryString(file);
    } catch (error) { console.error("Lỗi đọc file Kế hoạch:", error); setIsProcessing(false); }
    
    e.target.value = ''; // Tự động reset input sau khi đọc xong
  };

  const matchesSelectedTeams = (team) => selectedTeams.length === 0 || selectedTeams.includes(team);
  const selectedTeamLabel = selectedTeams.length === 0
    ? 'Toàn công ty'
    : selectedTeams.length === 1
      ? selectedTeams[0]
      : `${selectedTeams.length} nhóm đã chọn`;
  const toggleSelectedTeam = (team) => {
    setSelectedTeams(current => current.includes(team)
      ? current.filter(item => item !== team)
      : [...current, team]);
  };

  const filteredPlans = useMemo(() => rawPlans.filter(p => matchesSelectedTeams(p.team) && filterByPeriod(p.month)), [selectedTeams, selectedPeriod, rawPlans]);
  const filteredActuals = useMemo(() => rawActuals.filter(a => matchesSelectedTeams(a.team) && filterByPeriod(a.month)), [selectedTeams, selectedPeriod, rawActuals]);

  const kpis = useMemo(() => {
    const todayObj = new Date();
    const todayYMD = `${todayObj.getFullYear()}-${String(todayObj.getMonth()+1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

    const totalDoanhSo = filteredActuals.reduce((sum, item) => sum + (item.doanhSoBan || 0), 0);
    const totalDthuChuaVAT = filteredActuals.reduce((sum, item) => sum + (item.revenueActual || 0), 0);
    const totalDthuToday = filteredActuals.reduce((sum, item) => sum + (item.date === todayYMD ? (item.revenueActual || 0) : 0), 0);
    const totalPlan = filteredPlans.reduce((sum, item) => sum + (item.planValue || 0), 0);
    const totalQty = filteredActuals.reduce((sum, item) => sum + (item.qtyActual || 0), 0);
    const percentAchieved = totalPlan > 0 ? ((totalDthuChuaVAT / totalPlan) * 100).toFixed(2) : 0;
    
    return { totalDoanhSo, totalDthuChuaVAT, totalDthuToday, totalPlan, percentAchieved, totalQty };
  }, [filteredActuals, filteredPlans]);

  const qtyBreakdown = useMemo(() => {
    const map = {};
    filteredActuals.forEach(a => {
      if (!map[a.productGroup]) map[a.productGroup] = 0;
      map[a.productGroup] += (a.qtyActual || 0);
    });
    return Object.entries(map).filter(([_, qty]) => qty > 0).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty);
  }, [filteredActuals]);

  const forecastData = useMemo(() => {
    let targetMonth = -1, targetQuarter = -1, isAll = selectedPeriod === 'All';
    if (selectedPeriod.startsWith('Tháng')) targetMonth = parseInt(selectedPeriod.replace('Tháng ', ''));
    else if (selectedPeriod.startsWith('Quý')) targetQuarter = parseInt(selectedPeriod.replace('Quý ', ''));

    const realToday = new Date();
    const today = new Date(2026, realToday.getMonth(), realToday.getDate());
    const reportYear = 2026; 
    
    let daysPassed = 0, totalDays = 0, isPast = false, isFuture = false;
    const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

    if (isAll) {
       totalDays = 365; 
       if (today.getFullYear() > reportYear) isPast = true;
       else if (today.getFullYear() < reportYear) isFuture = true;
       else {
         const startOfYear = new Date(reportYear, 0, 1);
         daysPassed = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
       }
    } else if (targetMonth !== -1) {
       totalDays = getDaysInMonth(targetMonth, reportYear);
       if (today.getFullYear() > reportYear || (today.getFullYear() === reportYear && today.getMonth() + 1 > targetMonth)) isPast = true;
       else if (today.getFullYear() < reportYear || (today.getFullYear() === reportYear && today.getMonth() + 1 < targetMonth)) isFuture = true;
       else daysPassed = today.getDate();
    } else if (targetQuarter !== -1) {
       const startMonth = (targetQuarter - 1) * 3 + 1;
       const endMonth = targetQuarter * 3;
       totalDays = getDaysInMonth(startMonth, reportYear) + getDaysInMonth(startMonth + 1, reportYear) + getDaysInMonth(endMonth, reportYear);
       const currentQ = Math.ceil((today.getMonth() + 1) / 3);
       if (today.getFullYear() > reportYear || (today.getFullYear() === reportYear && currentQ > targetQuarter)) isPast = true;
       else if (today.getFullYear() < reportYear || (today.getFullYear() === reportYear && currentQ < targetQuarter)) isFuture = true;
       else {
         const startOfQuarter = new Date(reportYear, startMonth - 1, 1);
         daysPassed = Math.floor((today - startOfQuarter) / (1000 * 60 * 60 * 24)) + 1;
       }
    }

    const actual = filteredActuals.reduce((sum, item) => sum + (financeMetric === 'doanhSo' ? (item.doanhSoBan || 0) : (item.revenueActual || 0)), 0);
    const plan = filteredPlans.reduce((sum, item) => sum + (item.planValue || 0), 0);

    let forecast = 0, method = "", forecastPercent = 0;
    if (isPast) { forecast = actual; method = "Đã chốt kỳ"; }
    else if (isFuture) { forecast = plan; method = "Bằng Kế hoạch"; } 
    else {
       if (daysPassed > 0) { forecast = (actual / daysPassed) * totalDays; method = `Run-rate (${daysPassed}/${totalDays} ngày)`; } 
       else forecast = 0;
    }
    if (plan > 0) forecastPercent = (forecast / plan) * 100;
    return { forecast, method, forecastPercent };
  }, [filteredActuals, filteredPlans, selectedPeriod, financeMetric]);

  const productPlansFiltered = useMemo(() => {
     let base = rawPlans;
     if (selectedTeams.length > 0) base = base.filter(p => selectedTeams.includes(p.team));

     if (progressPeriodMode === 'global') {
        return base.filter(p => filterByPeriod(p.month));
     } else if (progressPeriodMode === 'ytd') {
        const activeMonths = months.slice(0, currentMonthNum);
        return base.filter(p => activeMonths.includes(p.month));
     } else if (progressPeriodMode === 'current_month') {
        return base.filter(p => p.month === currentMonthLabel);
     } else if (progressPeriodMode === 'full_year') {
        return base; 
     }
     return base;
  }, [rawPlans, selectedTeams, progressPeriodMode, selectedPeriod, currentMonthNum, currentMonthLabel]);

  const productActualsFiltered = useMemo(() => {
     let base = rawActuals;
     if (selectedTeams.length > 0) base = base.filter(a => selectedTeams.includes(a.team));

     if (progressPeriodMode === 'global') {
        return base.filter(a => filterByPeriod(a.month));
     } else if (progressPeriodMode === 'ytd') {
        const activeMonths = months.slice(0, currentMonthNum);
        return base.filter(a => activeMonths.includes(a.month));
     } else if (progressPeriodMode === 'current_month') {
        return base.filter(a => a.month === currentMonthLabel);
     } else if (progressPeriodMode === 'full_year') {
        return base; 
     }
     return base;
  }, [rawActuals, selectedTeams, progressPeriodMode, selectedPeriod, currentMonthNum, currentMonthLabel]);

  const productProgress = useMemo(() => {
    const map = {};
    productPlansFiltered.forEach(p => {
      if (!map[p.productGroup]) map[p.productGroup] = { name: p.productGroup, plan: 0, actual: 0, actualDoanhSo: 0, subItems: {} };
      map[p.productGroup].plan += p.planValue;
    });
    productActualsFiltered.forEach(a => {
      if (!map[a.productGroup]) map[a.productGroup] = { name: a.productGroup, plan: 0, actual: 0, actualDoanhSo: 0, subItems: {} };
      map[a.productGroup].actual += a.revenueActual; 
      map[a.productGroup].actualDoanhSo += (a.doanhSoBan || 0);
      if (a.subProductGroup && a.subProductGroup.toUpperCase() !== a.productGroup.toUpperCase()) {
        if (!map[a.productGroup].subItems) map[a.productGroup].subItems = {};
        if (!map[a.productGroup].subItems[a.subProductGroup]) map[a.productGroup].subItems[a.subProductGroup] = { actual: 0, actualDoanhSo: 0 };
        map[a.productGroup].subItems[a.subProductGroup].actual += a.revenueActual;
        map[a.productGroup].subItems[a.subProductGroup].actualDoanhSo += (a.doanhSoBan || 0);
      }
    });

    return Object.values(map).map(item => {
        const valToUse = financeMetric === 'doanhSo' ? item.actualDoanhSo : item.actual;
        return {
            ...item,
            actual: valToUse,
            percent: item.plan > 0 ? (valToUse / item.plan) * 100 : 0,
            subItemsArray: Object.entries(item.subItems || {}).map(([name, vals]) => {
                const subValToUse = financeMetric === 'doanhSo' ? vals.actualDoanhSo : vals.actual;
                return { name, actual: subValToUse };
            }).sort((a, b) => b.actual - a.actual)
        };
    }).sort((a, b) => b.plan - a.plan);
  }, [productPlansFiltered, productActualsFiltered, financeMetric]);

  const chartData = useMemo(() => {
    const aggregated = {};
    filteredPlans.forEach(p => {
      let key = p.month;
      if (chartGranularity === 'quarter') {
        const m = parseInt(p.month.replace('Tháng ', ''));
        key = `Quý ${Math.ceil(m / 3)}`;
      } else if (chartGranularity === 'day') key = p.month; 
      
      if (!aggregated[key]) aggregated[key] = { time: key, actualDthu: 0, actualDoanhSo: 0, plan: 0 };
      aggregated[key].plan += p.planValue;
    });

    filteredActuals.forEach(item => {
      let key = item.month;
      if (chartGranularity === 'quarter') key = item.quarter;
      if (chartGranularity === 'day') key = item.date;
      
      if (!aggregated[key]) {
        const parentMonthPlan = aggregated[item.month]?.plan || 0;
        aggregated[key] = { time: key, actualDthu: 0, actualDoanhSo: 0, plan: chartGranularity === 'day' ? parentMonthPlan/30 : 0 };
      }
      aggregated[key].actualDthu += item.revenueActual;
      aggregated[key].actualDoanhSo += (item.doanhSoBan || 0);
    });
    
    const todayForRunrate = new Date(2026, new Date().getMonth(), new Date().getDate());
    const currentMonthNum = todayForRunrate.getMonth() + 1;
    const currentQuarterNum = Math.ceil(currentMonthNum / 3);

    const sortedData = Object.values(aggregated).sort((a, b) => {
      if (a.time.includes('Tháng') && b.time.includes('Tháng')) return parseInt(a.time.replace('Tháng ', '')) - parseInt(b.time.replace('Tháng ', ''));
      return a.time.localeCompare(b.time);
    });

    return sortedData.map((item) => {
       let forecast = null;
       const valToUse = financeMetric === 'doanhSo' ? item.actualDoanhSo : item.actualDthu;

       if (chartGranularity === 'month') {
           const m = parseInt(item.time.replace('Tháng ', ''));
           if (m === currentMonthNum - 1) forecast = valToUse; 
           else if (m === currentMonthNum) {
               const totalDays = new Date(2026, m, 0).getDate();
               const daysPassed = todayForRunrate.getDate();
               forecast = daysPassed > 0 ? (valToUse / daysPassed) * totalDays : 0;
           } else if (m > currentMonthNum) forecast = item.plan; 
       } else if (chartGranularity === 'quarter') {
           const q = parseInt(item.time.replace('Quý ', ''));
           if (q === currentQuarterNum - 1) forecast = valToUse; 
           else if (q === currentQuarterNum) {
               const sm = (q - 1) * 3 + 1;
               const totalDays = new Date(2026, sm, 0).getDate() + new Date(2026, sm+1, 0).getDate() + new Date(2026, sm+2, 0).getDate();
               const startOfQ = new Date(2026, sm - 1, 1);
               const daysPassed = Math.floor((todayForRunrate - startOfQ) / (1000 * 60 * 60 * 24)) + 1;
               forecast = daysPassed > 0 ? (valToUse / daysPassed) * totalDays : 0;
           } else if (q > currentQuarterNum) forecast = item.plan;
       }
       return { ...item, actual: valToUse, forecast };
    });
  }, [filteredActuals, filteredPlans, chartGranularity, financeMetric]);

  const growthTableData = useMemo(() => {
    return chartData.map((item, index) => {
       if (index === 0) return { ...item, diffValue: 0, diffPercent: 0, hasPrev: false, prevActual: 0 };
       const prevItem = chartData[index - 1];
       const diffValue = item.actual - prevItem.actual;
       const diffPercent = prevItem.actual > 0 ? (diffValue / prevItem.actual) * 100 : 0;
       return { ...item, diffValue, diffPercent, prevActual: prevItem.actual, hasPrev: true }; 
    }).filter(item => item.actual > 0 || item.plan > 0); 
  }, [chartData]);

  const growthPeriodLabel = useMemo(() => {
     if (progressPeriodMode === 'global') return periodLabel;
     if (progressPeriodMode === 'ytd') return `Lũy kế T1 - T${currentMonthNum}`;
     if (progressPeriodMode === 'current_month') return `Tháng hiện tại (T${currentMonthNum})`;
     return 'Toàn Năm 2026';
  }, [progressPeriodMode, periodLabel, currentMonthNum]);

  const totalActual = financeMetric === 'doanhSo' ? kpis.totalDoanhSo : kpis.totalDthuChuaVAT;

  const forecastChartData = [
    { name: 'Thực tế', value: totalActual, fill: '#3b82f6' }, 
    { name: 'Dự phóng', value: forecastData.forecast, fill: '#8b5cf6' }, 
    { name: 'Kế hoạch', value: kpis.totalPlan, fill: '#94a3b8' } 
  ];

  const actualVsPlanValue = totalActual - kpis.totalPlan;
  const actualVsPlanPercent = kpis.totalPlan > 0 ? (actualVsPlanValue / kpis.totalPlan) * 100 : 0;
  const forecastVsPlanValue = forecastData.forecast - kpis.totalPlan;
  const forecastVsPlanPercent = kpis.totalPlan > 0 ? (forecastVsPlanValue / kpis.totalPlan) * 100 : 0;

  const teamAggregations = useMemo(() => {
    const map = {};
    filteredActuals.forEach(a => {
        const team = a.team;
        const emp = a.employee || 'Chưa phân tên';
        const sp = a.productGroup;
        if (!map[team]) map[team] = { name: team, totalDthu: 0, totalDoanhSo: 0, teamPlan: 0, members: {}, planByProduct: {} };
        if (!map[team].members[emp]) map[team].members[emp] = { name: emp, dthu: 0, doanhSo: 0, byProduct: {} };
        if (!map[team].members[emp].byProduct[sp]) map[team].members[emp].byProduct[sp] = { dthu: 0, doanhSo: 0 };
        map[team].totalDthu += (a.revenueActual || 0);
        map[team].totalDoanhSo += (a.doanhSoBan || 0);
        map[team].members[emp].dthu += (a.revenueActual || 0);
        map[team].members[emp].doanhSo += (a.doanhSoBan || 0);
        map[team].members[emp].byProduct[sp].dthu += (a.revenueActual || 0);
        map[team].members[emp].byProduct[sp].doanhSo += (a.doanhSoBan || 0);
    });
    filteredPlans.forEach(p => {
        const team = p.team;
        const sp = p.productGroup;
        if (!map[team]) map[team] = { name: team, totalDthu: 0, totalDoanhSo: 0, teamPlan: 0, members: {}, planByProduct: {} };
        map[team].teamPlan += (p.planValue || 0);
        if (!map[team].planByProduct[sp]) map[team].planByProduct[sp] = 0;
        map[team].planByProduct[sp] += (p.planValue || 0);
    });
    return Object.values(map).map(teamData => ({
        ...teamData, 
        membersArray: Object.values(teamData.members).sort((a,b) => b.dthu - a.dthu)
    })).sort((a,b) => b.totalDthu - a.totalDthu);
  }, [filteredActuals, filteredPlans]);

  const dynamicTeams = useMemo(() => Array.from(new Set([...rawPlans.map(p=>p.team), ...rawActuals.map(a=>a.team)])).filter(t => t && t.toLowerCase() !== 'chưa phân nhóm' && t !== 'Unknown').sort(), [rawPlans, rawActuals]);
  const dynamicEmployees = useMemo(() => Array.from(new Set([...rawActuals.map(a=>a.employee), ...tasks.map(t=>t.empName)])).filter(e => e && e !== 'Chưa xác định').sort(), [rawActuals, tasks]);
  const salesProductOptions = useMemo(() => Array.from(new Set([
    ...rawActuals.map(a => a.subProductGroup || a.productGroup),
    ...rawPlans.map(p => p.productGroup)
  ])).filter(Boolean).sort(), [rawActuals, rawPlans]);

  const salesProgramsWithActuals = useMemo(() => salesPrograms.map(program => {
    const productStats = Object.entries(program.productTargets || {}).map(([product, targets]) => {
      const matchingActuals = rawActuals.filter(item => (
        item.team === program.team &&
        (item.subProductGroup || item.productGroup) === product &&
        matchesPeriod(item.month, program.period || 'All')
      ));
      return {
        product,
        targetRevenue: Number(targets.targetRevenue) || 0,
        targetSales: Number(targets.targetSales) || 0,
        targetQty: Number(targets.targetQty) || 0,
        actualRevenue: matchingActuals.reduce((sum, item) => sum + (item.revenueActual || 0), 0),
        actualSales: matchingActuals.reduce((sum, item) => sum + (item.doanhSoBan || 0), 0),
        actualQty: matchingActuals.reduce((sum, item) => sum + (item.qtyActual || 0), 0)
      };
    });
    const sum = key => productStats.reduce((total, item) => total + (item[key] || 0), 0);
    return {
      ...program,
      productStats,
      targetRevenue: sum('targetRevenue'),
      targetSales: sum('targetSales'),
      targetQty: sum('targetQty'),
      actualRevenue: sum('actualRevenue'),
      actualSales: sum('actualSales'),
      actualQty: sum('actualQty')
    };
  }), [salesPrograms, rawActuals]);

  const filteredSalesPrograms = useMemo(() => (
    salesProgramsWithActuals.filter(program => salesPeriodFilter === 'All' || (program.period || 'All') === salesPeriodFilter)
  ), [salesProgramsWithActuals, salesPeriodFilter]);

  const customGroupStats = useMemo(() => {
    return customGroups.map(group => {
        let dthu = 0;
        let doanhSo = 0;
        let qty = 0;
        let membersData = {};
        let productData = {}; 
        
        group.members.forEach(m => membersData[m] = { name: m, dthu: 0, doanhSo: 0, qty: 0 });

        if (group.productTargets) {
           Object.keys(group.productTargets).forEach(sp => {
              productData[sp] = { name: sp, target: group.productTargets[sp], doanhSo: 0, dthu: 0, qty: 0, subItems: {} };
           });
        }
        
        const hasOthersTarget = group.productTargets && group.productTargets['Các sản phẩm còn lại'] !== undefined;

        filteredActuals.forEach(a => {
            if (group.members.includes(a.employee)) {
                dthu += (a.revenueActual || 0);
                doanhSo += (a.doanhSoBan || 0);
                qty += (a.qtyActual || 0);
                membersData[a.employee].dthu += (a.revenueActual || 0);
                membersData[a.employee].doanhSo += (a.doanhSoBan || 0);
                membersData[a.employee].qty += (a.qtyActual || 0);

                let spName = a.productGroup;
                let originalSpName = a.subProductGroup || a.productGroup;

                if (group.productTargets && group.productTargets[originalSpName] !== undefined) {
                   spName = originalSpName;
                }

                if (group.productTargets && group.productTargets[spName] !== undefined) {
                   productData[spName].doanhSo += (a.doanhSoBan || 0);
                   productData[spName].dthu += (a.revenueActual || 0);
                   productData[spName].qty += (a.qtyActual || 0);
                   if (!productData[spName].subItems) productData[spName].subItems = {};
                   if (!productData[spName].subItems[originalSpName]) productData[spName].subItems[originalSpName] = {doanhSo: 0, dthu: 0, qty: 0};
                   productData[spName].subItems[originalSpName].doanhSo += (a.doanhSoBan || 0);
                   productData[spName].subItems[originalSpName].dthu += (a.revenueActual || 0);
                   productData[spName].subItems[originalSpName].qty += (a.qtyActual || 0);
                } else {
                   if (hasOthersTarget) {
                      productData['Các sản phẩm còn lại'].doanhSo += (a.doanhSoBan || 0);
                      productData['Các sản phẩm còn lại'].dthu += (a.revenueActual || 0);
                      productData['Các sản phẩm còn lại'].qty += (a.qtyActual || 0);
                      if (!productData['Các sản phẩm còn lại'].subItems) productData['Các sản phẩm còn lại'].subItems = {};
                      if (!productData['Các sản phẩm còn lại'].subItems[originalSpName]) productData['Các sản phẩm còn lại'].subItems[originalSpName] = {doanhSo: 0, dthu: 0, qty: 0};
                      productData['Các sản phẩm còn lại'].subItems[originalSpName].doanhSo += (a.doanhSoBan || 0);
                      productData['Các sản phẩm còn lại'].subItems[originalSpName].dthu += (a.revenueActual || 0);
                      productData['Các sản phẩm còn lại'].subItems[originalSpName].qty += (a.qtyActual || 0);
                   } else {
                      if (!productData[spName]) productData[spName] = { name: spName, target: 0, doanhSo: 0, dthu: 0, qty: 0, subItems: {} };
                      productData[spName].doanhSo += (a.doanhSoBan || 0);
                      productData[spName].dthu += (a.revenueActual || 0);
                      productData[spName].qty += (a.qtyActual || 0);
                      if (!productData[spName].subItems) productData[spName].subItems = {};
                      if (!productData[spName].subItems[originalSpName]) productData[spName].subItems[originalSpName] = {doanhSo: 0, dthu: 0, qty: 0};
                      productData[spName].subItems[originalSpName].doanhSo += (a.doanhSoBan || 0);
                      productData[spName].subItems[originalSpName].dthu += (a.revenueActual || 0);
                      productData[spName].subItems[originalSpName].qty += (a.qtyActual || 0);
                   }
                }
            }
        });

        let calculatedTotalTarget = group.target || 0;
        if (calculatedTotalTarget === 0 && group.productTargets) {
             calculatedTotalTarget = Object.values(group.productTargets).reduce((sum, val) => sum + (val || 0), 0);
        }

        return {
            ...group,
            actualDthu: dthu,
            actualDoanhSo: doanhSo,
            actualQty: qty,
            memberList: Object.values(membersData).sort((a,b) => b.doanhSo - a.doanhSo),
            productList: Object.values(productData).filter(p => p.target > 0 || p.doanhSo > 0 || p.dthu > 0).map(p => ({
                ...p,
                subItemsArray: p.subItems ? Object.entries(p.subItems).map(([name, vals]) => ({ name, ...vals })).sort((a,b) => b.doanhSo - a.doanhSo) : []
            })).sort((a,b) => {
                if (a.name === 'Các sản phẩm còn lại') return 1;
                if (b.name === 'Các sản phẩm còn lại') return -1;
                return b.target - a.target;
            }), 
            calculatedTarget: calculatedTotalTarget,
            percent: calculatedTotalTarget > 0 ? (doanhSo / calculatedTotalTarget) * 100 : 0
        };
    });
  }, [customGroups, filteredActuals]);

  // XỬ LÝ DỮ LIỆU TỒN KHO
  const invDynamicRegions = useMemo(() => Array.from(new Set(rawInventory.map(i => i.region))).sort(), [rawInventory]);
  const invDynamicBrands = useMemo(() => Array.from(new Set(rawInventory.map(i => i.brand))).sort(), [rawInventory]);
  const invDynamicProducts = useMemo(() => {
    const products = new Map();
    rawInventory.forEach(item => products.set(item.productCode, { code: item.productCode, name: item.productName }));
    return Array.from(products.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [rawInventory]);

  const inventoryDataProcessed = useMemo(() => {
      let filtered = rawInventory;
      if (invRegionFilter !== 'All') filtered = filtered.filter(i => i.region === invRegionFilter);
      if (invBrandFilters.length > 0) filtered = filtered.filter(i => invBrandFilters.includes(i.brand));
      if (invProductFilters.length > 0) filtered = filtered.filter(i => invProductFilters.includes(i.productCode));
      if (invSearch.trim()) {
          const q = invSearch.toLowerCase();
          filtered = filtered.filter(i => i.productCode.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q));
      }

      let totalQty = 0;
      let totalValue = 0;
      const regionMap = {};
      const brandMap = {};
      const productMap = {};

      filtered.forEach(item => {
          totalQty += item.qty;
          totalValue += item.inventoryValue || 0;
          
          if (!regionMap[item.region]) regionMap[item.region] = 0;
          regionMap[item.region] += item.qty;

          if (!brandMap[item.brand]) brandMap[item.brand] = 0;
          brandMap[item.brand] += item.qty;

          const pKey = item.productCode;
          if (!productMap[pKey]) {
              productMap[pKey] = {
                  code: item.productCode,
                  name: item.productName,
                  brand: item.brand,
                  totalQty: 0,
                  totalValue: 0,
                  locations: {}
              };
          }
          productMap[pKey].totalQty += item.qty;
          productMap[pKey].totalValue += item.inventoryValue || 0;
          const locKey = `${item.region} - ${item.warehouse}`;
          if(!productMap[pKey].locations[locKey]) productMap[pKey].locations[locKey] = 0;
          productMap[pKey].locations[locKey] += item.qty;
      });

      const byRegion = Object.entries(regionMap).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value);
      const byBrand = Object.entries(brandMap).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value);
      
      const products = Object.values(productMap).map(p => ({
          ...p,
          locArray: Object.entries(p.locations).map(([loc, qty]) => ({loc, qty})).sort((a,b) => b.qty - a.qty)
      })).sort((a,b) => b.totalQty - a.totalQty);

      return { totalQty, totalValue, byRegion, byBrand, products };
  }, [rawInventory, invRegionFilter, invBrandFilters, invProductFilters, invSearch]);

  const invDetailDynamicBrands = useMemo(() => Array.from(new Set(rawDetailedInventory.map(item => (
    item.nhomHang || extractBrand(`${item.nhanHang || ''} ${item.tenHang || ''}`)
  )))).filter(Boolean).sort(), [rawDetailedInventory]);

  const detailedInventoryAnalysis = useMemo(() => {
    const groupMap = {};
    const ensureGroup = name => {
      const groupName = name && name !== 'Khác' ? name : 'Khác';
      if (!groupMap[groupName]) groupMap[groupName] = { name: groupName, qty: 0, inventoryValue: 0, revenue: 0, itemCount: 0 };
      return groupMap[groupName];
    };

    rawDetailedInventory.forEach(item => {
      const itemGroup = item.nhomHang || extractBrand(`${item.nhanHang || ''} ${item.tenHang || ''}`);
      if (invDetailBrandFilters.length > 0 && !invDetailBrandFilters.includes(itemGroup)) return;
      const group = ensureGroup(itemGroup);
      group.qty += item.cuoiKySL || 0;
      group.inventoryValue += item.cuoiKyGT || 0;
      group.itemCount += 1;
    });

    rawActuals
      .filter(item => matchesPeriod(item.month, invDetailPeriod))
      .forEach(item => {
        const extractedGroup = extractBrand(`${item.subProductGroup || ''} ${item.productGroup || ''}`);
        const groupName = extractedGroup === 'Khác' ? (item.productGroup || 'Khác') : extractedGroup;
        if (invDetailBrandFilters.length === 0 || invDetailBrandFilters.includes(groupName)) {
          ensureGroup(groupName).revenue += item.revenueActual || 0;
        }
      });

    const groups = Object.values(groupMap)
      .map(group => ({
        ...group,
        revenueToInventory: group.inventoryValue > 0 ? (group.revenue / group.inventoryValue) * 100 : 0
      }))
      .filter(group => {
        if (!invDetailSearch.trim()) return true;
        return group.name.toLowerCase().includes(invDetailSearch.trim().toLowerCase());
      })
      .sort((a, b) => b.inventoryValue - a.inventoryValue);

    const totalQty = groups.reduce((sum, group) => sum + group.qty, 0);
    const totalInventoryValue = groups.reduce((sum, group) => sum + group.inventoryValue, 0);
    const totalRevenue = groups.reduce((sum, group) => sum + group.revenue, 0);
    return {
      groups,
      totalQty,
      totalInventoryValue,
      totalRevenue,
      revenueToInventory: totalInventoryValue > 0 ? (totalRevenue / totalInventoryValue) * 100 : 0
    };
  }, [rawDetailedInventory, rawActuals, invDetailPeriod, invDetailSearch, invDetailBrandFilters]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchStartDate = !taskFilters.startDate || t.startDate >= taskFilters.startDate;
      const matchEndDate = !taskFilters.endDate || t.endDate <= taskFilters.endDate;
      const matchEmp = taskFilters.empName === 'All' || t.empName === taskFilters.empName;
      const matchStatus = taskFilters.status === 'All' || t.status === taskFilters.status;
      return matchStartDate && matchEndDate && matchEmp && matchStatus;
    });
  }, [tasks, taskFilters]);

  const taskKPIs = useMemo(() => {
    const now = new Date().toISOString().split('T')[0];
    let total = tasks.length;
    let completed = tasks.filter(t => t.status === 'Đã hoàn thành' || t.status === 'Hủy').length;
    let inProgress = tasks.filter(t => t.status === 'Đang chạy' || t.status === 'Bắt đầu triển khai').length;
    let overdueList = tasks.filter(t => t.endDate < now && t.status !== 'Đã hoàn thành' && t.status !== 'Hủy');
    
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let upcomingList = tasks.filter(t => t.endDate >= now && t.endDate <= next7Days && t.status !== 'Đã hoàn thành' && t.status !== 'Hủy');

    const statusChartData = [
      { name: 'Bắt đầu triển khai', value: tasks.filter(t => t.status === 'Bắt đầu triển khai').length },
      { name: 'Đang chạy', value: tasks.filter(t => t.status === 'Đang chạy').length },
      { name: 'Đã hoàn thành', value: tasks.filter(t => t.status === 'Đã hoàn thành').length },
      { name: 'Hủy', value: tasks.filter(t => t.status === 'Hủy').length }
    ].filter(s => s.value > 0);

    return { total, completed, inProgress, overdue: overdueList.length, overdueList, upcomingList, statusChartData };
  }, [tasks]);

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    const newId = newTask.id || `DA${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    setTasks([...tasks, { ...newTask, id: newId }]);
    setNewTask({ id: '', name: '', goal: '', empId: '', empName: '', startDate: '', endDate: '', status: 'Bắt đầu triển khai', priority: 'Trung bình' });
  };

  const handleSalesProgramSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(newSalesProgram.productTargets || {}).length === 0) {
      setConfirmAction({ isOpen: true, title: 'Thiếu mục tiêu mặt hàng', message: 'Vui lòng chọn ít nhất một mặt hàng và nhập mục tiêu trước khi tạo chương trình.', type: 'warning', onConfirm: () => setConfirmAction({ isOpen: false }), hideCancel: true, confirmText: 'Đã hiểu' });
      return;
    }
    const program = {
      ...newSalesProgram,
      id: `SALE-${Date.now()}`,
      completion: Math.min(100, Math.max(0, Number(newSalesProgram.completion) || 0))
    };
    setSalesPrograms([...salesPrograms, program]);
    setNewSalesProgram({
      team: '', period: 'All', name: '', goal: '', details: '',
      productTargets: {},
      completion: 0, deploymentStatus: 'Chưa triển khai'
    });
    setSalesProductDraft({ product: '', targetRevenue: 0, targetSales: 0, targetQty: 0 });
  };

  const handleAddSalesProductTarget = () => {
    if (!salesProductDraft.product) return;
    setNewSalesProgram({
      ...newSalesProgram,
      productTargets: {
        ...(newSalesProgram.productTargets || {}),
        [salesProductDraft.product]: {
          targetRevenue: Number(salesProductDraft.targetRevenue) || 0,
          targetSales: Number(salesProductDraft.targetSales) || 0,
          targetQty: Number(salesProductDraft.targetQty) || 0
        }
      }
    });
    setSalesProductDraft({ product: '', targetRevenue: 0, targetSales: 0, targetQty: 0 });
  };

  const updateSalesProgram = (id, changes) => {
    setSalesPrograms(salesPrograms.map(program => (
      program.id === id ? { ...program, ...changes } : program
    )));
  };

  const handleDeleteSalesProgram = (id) => {
    setConfirmAction({
      isOpen: true,
      title: 'Xóa chương trình bán hàng',
      message: 'Bạn có chắc chắn muốn xóa chương trình bán hàng này không?',
      type: 'danger',
      onConfirm: () => {
        setSalesPrograms(salesPrograms.filter(program => program.id !== id));
        setConfirmAction({ isOpen: false });
      },
      hideCancel: false,
      confirmText: 'Xác nhận'
    });
  };

  const handleDeleteTaskConfirm = (id) => {
    setConfirmAction({
        isOpen: true,
        title: 'Xóa Công Việc',
        message: 'Bạn có chắc chắn muốn xóa công việc này không? Hành động này không thể hoàn tác.',
        type: 'danger',
        onConfirm: () => {
            setTasks(tasks.filter(t => t.id !== id));
            setConfirmAction({ isOpen: false });
        },
        hideCancel: false,
        confirmText: 'Xác nhận'
    });
  };

  const generatedReport = useMemo(() => {
    return `========================================
BÁO CÁO KẾT QUẢ KINH DOANH
Thời gian xuất: ${new Date().toLocaleString('vi-VN')}
Kỳ báo cáo: ${periodLabel}
Nhóm: ${selectedTeamLabel}
========================================

1. TỔNG QUAN TÀI CHÍNH
- Doanh thu chưa VAT: ${formatVND(kpis.totalDthuChuaVAT)} VNĐ
- Doanh số bán: ${formatVND(kpis.totalDoanhSo)} VNĐ
- Kế hoạch đề ra: ${formatVND(kpis.totalPlan)} VNĐ
- Tiến độ hoàn thành: ${kpis.percentAchieved}%

2. DỰ BÁO (FORECAST)
- Dự báo đạt: ${formatVND(forecastData.forecast)} VNĐ
- Phương pháp dự báo: ${forecastData.method}
- Tỷ lệ dự báo / KH: ${forecastData.forecastPercent.toFixed(1)}%

3. CHI TIẾT THEO MẶT HÀNG (${financeMetric === 'doanhSo' ? 'Doanh số bán' : 'Doanh thu CVAT'})
${productProgress.map(p => `- ${p.name}: Thực tế ${formatVND(p.actual)} / KH ${formatVND(p.plan)} (${p.percent.toFixed(1)}%)`).join('\n')}

========================================
Báo cáo được tạo tự động từ hệ thống.`;
  }, [kpis, forecastData, productProgress, periodLabel, selectedTeamLabel, financeMetric]);

  const handleCopyReport = () => {
    try {
      navigator.clipboard.writeText(generatedReport);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch(e) {
      console.error("Lỗi copy report", e);
    }
  };

  if (isLoadingAppUsers) {
      return <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 mb-4" size={40}/><p className="text-slate-500 font-medium">Đang tải dữ liệu hệ thống...</p></div>;
  }

  if (!appUser) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black p-4">
             <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-indigo-600 p-6 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Shield className="text-white" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                        {authMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản Admin'}
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">
                        {authMode === 'login' ? 'Truy cập Dashboard Quản Trị' : 'Yêu cầu mã hệ thống để tạo'}
                    </p>
                </div>
                <form onSubmit={authMode === 'login' ? handleLogin : handleCreateAdmin} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên đăng nhập</label>
                        <input type="text" autoFocus required value={loginForm.username} onChange={e=>setLoginForm({...loginForm, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" placeholder="Nhập tên tài khoản..." />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
                        <input type="password" required value={loginForm.password} onChange={e=>setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" placeholder="••••••••" />
                    </div>
                    {authMode === 'create_admin' && (
                        <div className="mb-6 animate-in slide-in-from-top-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mã hệ thống (Chỉ dành cho Admin)</label>
                            <input type="password" required value={loginForm.systemCode} onChange={e=>setLoginForm({...loginForm, systemCode: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono tracking-widest" placeholder="********" />
                        </div>
                    )}
                    {loginError && <p className="text-rose-500 text-xs font-bold text-center mb-4">{loginError}</p>}
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-lg p-3 hover:bg-indigo-700 transition-colors shadow-md">
                        {authMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản Admin'}
                    </button>
                    <div className="mt-4 text-center">
                        {authMode === 'login' ? (
                            <p className="text-sm text-slate-500">Admin mới? <button type="button" onClick={() => {setAuthMode('create_admin'); setLoginError('');}} className="text-indigo-600 font-bold hover:underline">Tạo tài khoản Admin</button></p>
                        ) : (
                            <p className="text-sm text-slate-500">Đã có tài khoản? <button type="button" onClick={() => {setAuthMode('login'); setLoginError('');}} className="text-indigo-600 font-bold hover:underline">Đăng nhập</button></p>
                        )}
                    </div>
                </form>
             </div>
             <button onClick={() => setAppUser({ role: 'guest', permissions: [] })} className="mt-8 text-slate-400 hover:text-white text-sm font-medium transition-colors">Tiếp tục với tư cách Khách (Chỉ xem báo cáo chia sẻ)</button>
          </div>
      );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden">
      {/* --- CÁC MODAL THÔNG BÁO VÀ XÁC NHẬN TOÀN CỤC --- */}
      {confirmAction.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6 text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmAction.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                   {confirmAction.type === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{confirmAction.title}</h3>
                <p className="text-sm text-slate-600">{confirmAction.message}</p>
             </div>
             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                {!confirmAction.hideCancel && (
                    <button onClick={() => setConfirmAction({ isOpen: false })} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">Hủy</button>
                )}
                <button 
                   onClick={confirmAction.onConfirm || (() => setConfirmAction({ isOpen: false }))} 
                   className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${confirmAction.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                   {confirmAction.confirmText || 'Xác nhận'}
                </button>
             </div>
          </div>
        </div>
      )}
      {notification.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24}/>
            </div>
            <p className="text-sm text-slate-700">{notification.message}</p>
            <button onClick={() => setNotification({ isOpen: false, message: '' })} className="mt-5 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700">Đóng</button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="bg-slate-900 text-slate-300 w-full md:w-64 shrink-0 flex flex-col shadow-xl z-20">
         <div className="p-5 border-b border-slate-800">
            <h2 className="text-white font-bold text-xl flex items-center gap-2"><LayoutDashboard className="text-indigo-500"/> Dashboard</h2>
            <p className="text-slate-500 text-xs mt-1">Version 2.0 (2026)</p>
         </div>
         
         <div className="flex flex-row md:flex-col gap-2 p-3 overflow-x-auto md:overflow-visible">
            {hasAccess('tab_finance') && (
                <button onClick={() => setActiveTab('finance')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'finance' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
                   <PieChartIcon size={20} className={activeTab === 'finance' ? 'text-indigo-200' : 'text-slate-500'} /> <span className="font-medium">Quản trị tài chính</span>
                </button>
            )}
            {hasAccess('tab_inventory') && (
                <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
                   <Archive size={20} className={activeTab === 'inventory' ? 'text-indigo-200' : 'text-slate-500'} /> <span className="font-medium">Quản trị tồn kho</span>
                </button>
            )}
            {hasAccess('tab_team') && (
                <button onClick={() => {setActiveTab('team'); setActiveTeamTab(hasAccess('sub_finance') ? 'finance_team' : hasAccess('sub_sales') ? 'sales_programs' : hasAccess('sub_overview') ? 'task_overview' : 'task_management')}} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'team' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
                   <Users size={20} className={activeTab === 'team' ? 'text-indigo-200' : 'text-slate-500'} /> <span className="font-medium">Quản trị đội nhóm</span>
                </button>
            )}
            {hasAccess('tab_custom') && (
                <button onClick={() => setActiveTab('custom')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'custom' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
                   <Eye size={20} className={activeTab === 'custom' ? 'text-indigo-200' : 'text-slate-500'} /> <span className="font-medium">Theo dõi riêng</span>
                </button>
            )}
            {appUser.role === 'admin' && (
                <div className="md:mt-auto pt-2 md:border-t border-slate-800">
                    <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
                       <Shield size={20} className={activeTab === 'admin' ? 'text-indigo-200' : 'text-slate-500'} /> <span className="font-medium">Quản trị hệ thống</span>
                    </button>
                </div>
            )}
         </div>

         <div className="mt-auto p-4 border-t border-slate-800 hidden md:block">
            {isViewOnly ? (
               <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-amber-500 text-sm flex items-center gap-2"><Clock size={16}/> Chế độ khách</div>
            ) : (
               <div className="bg-slate-800 p-3 rounded-lg text-xs flex flex-col gap-1"><span className="text-slate-400">Trạng thái hệ thống:</span><span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12}/> Online & Đã lưu</span></div>
            )}
         </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
         <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            
            {/* HEADER */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  {activeTab === 'finance' ? 'Phân tích Kết quả Kinh doanh' : (activeTab === 'inventory' ? 'Quản Trị Tồn Kho' : activeTab === 'admin' ? 'Quản Trị Hệ Thống' : 'Quản trị Đội nhóm & Công việc')}
                  {isProcessing && <Loader2 className="animate-spin text-blue-500" size={20} />}
                </h1>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                  {activeTab === 'finance' ? 'Theo dõi % hoàn thành mục tiêu đa chiều' : (activeTab === 'inventory' ? 'Kiểm soát hàng hóa tồn kho theo khu vực và thương hiệu' : activeTab === 'admin' ? 'Cấp quyền và quản lý tài khoản người dùng' : 'Thống kê tài chính team và quản lý tiến độ dự án')}
                  {isViewOnly && <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-bold ml-2">👁️ Khách</span>}
                </p>
              </div>
              
              <div className="flex flex-col items-end gap-2 w-full xl:w-auto">
                <div className="flex flex-wrap gap-2 md:gap-3 w-full xl:w-auto justify-start xl:justify-end">
                  {isViewOnly ? (
                      <button onClick={() => {setIsViewOnly(false); setRawActuals([]); setRawPlans(generateMockPlans()); setTasks(MOCK_TASKS); setSalesPrograms([]); setCustomGroups([]); setRawInventory([]);}} className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-100 shadow-sm"><LogOut size={16} /> Thoát chế độ xem</button>
                  ) : (
                      <>
                          {(activeTab === 'finance' || activeTab === 'custom' || (activeTab === 'team' && activeTeamTab === 'finance_team') || activeTab === 'inventory') && (
                            <>
                              {(activeTab !== 'inventory') && (
                                  <>
                                      <button onClick={() => setOpenCodeModal(true)} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"><Key size={16} /> Mở bằng Mã</button>
                                      <button onClick={handleGenerateShareLink} disabled={isSharing} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-sm font-semibold text-emerald-700 hover:bg-emerald-100 shadow-sm"><Share2 size={16} /> Chia Sẻ</button>
                                  </>
                              )}
                              
                              {activeTab === 'finance' && (
                                 <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 hover:bg-indigo-100 shadow-sm"><FileText size={16} /> Báo Cáo</button>
                              )}

                              {activeTab === 'inventory' ? (
                                  <>
                                      {hasAccess('action_upload_inventory') && activeInventoryTab === 'overview' && (
                                          <>
                                              <input type="file" ref={inventoryFileInputRef} onChange={handleInventoryFileChange} accept=".xlsx, .xls, .csv" style={{ display: 'none' }} />
                                              <button onClick={() => inventoryFileInputRef.current.click()} disabled={isProcessing} className="flex items-center gap-2 bg-blue-600 border border-blue-600 px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm"><Database size={16} /> Up Tồn Kho Tổng Quan</button>
                                          </>
                                      )}
                                      {hasAccess('action_upload_inventory') && activeInventoryTab === 'detailed' && (
                                          <>
                                              <input type="file" ref={detailedInventoryFileInputRef} onChange={handleDetailedInventoryFileChange} accept=".xlsx, .xls, .csv" style={{ display: 'none' }} />
                                              <button onClick={() => detailedInventoryFileInputRef.current.click()} disabled={isProcessing} className="flex items-center gap-2 bg-emerald-600 border border-emerald-600 px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-emerald-700 shadow-sm"><Archive size={16} /> Up Tồn Kho Chi Tiết</button>
                                          </>
                                      )}
                                  </>
                              ) : (
                                  <>
                                      {hasAccess('action_upload_finance') && (
                                          <>
                                              <input type="file" ref={actualFileInputRef} onChange={handleActualFileChange} accept=".xlsx, .xls, .csv" style={{ display: 'none' }} />
                                              <button onClick={() => actualFileInputRef.current.click()} disabled={isProcessing} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm text-slate-600"><UploadCloud size={16} /> Up Thực Tế</button>
                                              <input type="file" ref={planFileInputRef} onChange={handlePlanFileChange} accept=".xlsx, .xls, .csv" style={{ display: 'none' }} />
                                              <button onClick={() => planFileInputRef.current.click()} disabled={isProcessing} className="flex items-center gap-2 bg-blue-600 border border-blue-600 px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm"><Target size={16} /> Up Kế Hoạch</button>
                                          </>
                                      )}
                                  </>
                              )}
                            </>
                          )}
                          <button onClick={() => {setAppUser(null); setLoginForm({username: '', password: ''});}} className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-100 shadow-sm ml-2"><LogOut size={16} /> Đăng xuất</button>
                      </>
                  )}
                </div>
              </div>
            </div>

            {/* FILTERS */}
            {(activeTab === 'finance' || activeTab === 'custom' || (activeTab === 'team' && activeTeamTab === 'finance_team')) && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-4 flex-wrap w-full">
                    <div className="flex items-center gap-2 text-slate-500 font-medium min-w-fit"><Filter size={18} /> Lọc Báo Cáo:</div>
                    <div className="relative min-w-[240px]">
                      <button
                        type="button"
                        onClick={() => setIsTeamFilterOpen(open => !open)}
                        className="w-full bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-sm rounded-lg p-2.5 outline-none flex items-center justify-between gap-3"
                      >
                        <span className="truncate">👥 {selectedTeamLabel}</span>
                        <ChevronDown size={16} className={`shrink-0 transition-transform ${isTeamFilterOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isTeamFilterOpen && (
                        <div className="absolute left-0 top-full mt-2 z-50 w-full min-w-[280px] max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTeams([])}
                            className="w-full flex items-center gap-2 p-2.5 rounded-lg text-left text-sm hover:bg-blue-50"
                          >
                            {selectedTeams.length === 0 ? <CheckSquare size={17} className="text-blue-600" /> : <Square size={17} className="text-slate-400" />}
                            <span className="font-semibold text-slate-700">Toàn công ty</span>
                          </button>
                          <div className="h-px bg-slate-100 my-1" />
                          {dynamicTeams.map(team => (
                            <button
                              type="button"
                              key={team}
                              onClick={() => toggleSelectedTeam(team)}
                              className="w-full flex items-center gap-2 p-2.5 rounded-lg text-left text-sm hover:bg-blue-50"
                            >
                              {selectedTeams.includes(team) ? <CheckSquare size={17} className="text-blue-600" /> : <Square size={17} className="text-slate-400" />}
                              <span className="text-slate-700">{team}</span>
                            </button>
                          ))}
                          <button type="button" onClick={() => setIsTeamFilterOpen(false)} className="sticky bottom-0 mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-semibold">
                            Áp dụng ({selectedTeams.length === 0 ? 'Tất cả' : selectedTeams.length})
                          </button>
                        </div>
                      )}
                    </div>
                    <select className="bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-sm rounded-lg p-2.5 outline-none min-w-[180px]" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
                      {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    
                    {activeTab === 'finance' && (
                       <>
                         <div className="w-px h-8 bg-slate-200 hidden md:block mx-2"></div>
                         <div className="flex items-center gap-4 ml-auto flex-wrap">
                            <div className="flex items-center gap-2">
                               <span className="text-sm text-slate-500">Chỉ số:</span>
                               <select className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none" value={financeMetric} onChange={(e) => setFinanceMetric(e.target.value)}>
                                  <option value="dthuChuaVat">Doanh thu CVAT</option>
                                  <option value="doanhSo">Doanh số bán</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-sm text-slate-500">Kỳ đối chiếu:</span>
                               <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none" value={chartGranularity} onChange={(e) => setChartGranularity(e.target.value)}>
                                  <option value="day">Theo Ngày</option>
                                  <option value="month">Theo Tháng</option>
                                  <option value="quarter">Theo Quý</option>
                                </select>
                            </div>
                         </div>
                       </>
                    )}
                  </div>
                </div>
            )}

            {activeTab === 'finance' && (
               <div className="animate-in fade-in duration-300">
                  
                  {/* KPI CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                    <KPICard title={`Doanh thu hôm nay`} value={formatVND(kpis.totalDthuToday)} icon={<Calendar className="text-orange-500" size={24}/>} valueColor="text-orange-600" />
                    <KPICard title={`Doanh thu chưa VAT`} value={formatVND(kpis.totalDthuChuaVAT)} icon={<DollarSign className="text-emerald-500" size={24}/>} />
                    <KPICard title={`Kế hoạch (${periodLabel})`} value={formatVND(kpis.totalPlan)} icon={<Target className="text-slate-500" size={24}/>} />
                    <KPICard 
                      title={`Dự phóng (${periodLabel})`} 
                      value={formatVND(forecastData.forecast)} 
                      subValue={`${forecastData.method} • Dự kiến đạt: ${forecastData.forecastPercent.toFixed(1)}% KH`}
                      icon={<TrendingUp className="text-indigo-500" size={24}/>} 
                    />
                    <KPICard 
                      title={`Tiến độ hiện tại`} 
                      value={`${kpis.percentAchieved}%`} 
                      icon={<Clock className={kpis.percentAchieved >= 80 ? "text-emerald-500" : "text-amber-500"} size={24}/>}
                      valueColor={kpis.percentAchieved >= 80 ? "text-emerald-600" : "text-amber-600"}
                    />
                    <KPICard title={`Doanh số bán`} value={formatVND(kpis.totalDoanhSo)} icon={<DollarSign className="text-blue-500" size={24}/>} />
                    <ExpandableQtyCard 
                      title="Số lượng sp đã bán" 
                      totalQty={kpis.totalQty} 
                      breakdown={qtyBreakdown}
                      icon={<Package className="text-purple-500" size={24}/>} 
                    />
                  </div>

                  {/* PROGRESS BARS */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           <Target className="text-blue-600" size={20}/> Hoàn thành Mục tiêu từng Mặt hàng
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                           Nhóm: <strong className="text-blue-600">{selectedTeamLabel}</strong>
                           <span className="mx-2">|</span> 
                           Mốc đối chiếu: <strong className="text-indigo-600">{growthPeriodLabel}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 w-full sm:w-auto">
                         <span className="text-xs font-bold text-slate-500 whitespace-nowrap pl-2">Mốc kế hoạch:</span>
                         <select 
                            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-md py-1 px-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={progressPeriodMode}
                            onChange={(e) => setProgressPeriodMode(e.target.value)}
                         >
                            <option value="global">🔗 Đồng bộ bộ lọc chung ({periodLabel})</option>
                            <option value="ytd">📅 Lũy kế từ đầu năm (YTD - T1-T6)</option>
                            <option value="current_month">🗓️ Chỉ riêng Tháng hiện tại (T6)</option>
                            <option value="full_year">📊 Toàn bộ kế hoạch cả năm 2026</option>
                         </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-6">
                      {productProgress.map((prod, idx) => (
                        <ProgressBarCard key={idx} data={prod} />
                      ))}
                      {productProgress.length === 0 && (
                         <div className="col-span-full py-10 text-center text-slate-400 font-medium">Chưa có dữ liệu kế hoạch và thực tế cho mốc thời gian này.</div>
                      )}
                    </div>
                  </div>

                  {/* BIỂU ĐỒ XU HƯỚNG */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
                    <div className="mb-4">
                      <h2 className="text-lg font-bold text-slate-800">Biến động & Dự báo Doanh thu</h2>
                      <p className="text-sm text-slate-500">Đường dự báo nối tiếp thực tế theo {chartGranularity === 'day' ? 'Ngày' : chartGranularity === 'month' ? 'Quý' : 'Năm'}</p>
                    </div>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} minTickGap={20} />
                          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${(val / 1000000000).toFixed(0)}Tỷ`} />
                          <Tooltip content={<TrendTooltip />} />
                          <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                          <Line yAxisId="left" type="monotone" dataKey="plan" name="Kế hoạch giao" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                          <Line yAxisId="left" type="monotone" dataKey="forecast" name="Dự báo (Forecast)" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="3 3" dot={{r: 4, fill: '#8b5cf6', strokeWidth: 0}} />
                          <Area yAxisId="left" type="monotone" dataKey="actual" name={`Thực tế (${financeMetric === 'doanhSo' ? 'DS' : 'CVAT'})`} stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* PIE CHART VÀ SO SÁNH */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                      <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-800">So sánh Tổng quan</h2>
                        <p className="text-sm text-slate-500">Thực tế ({financeMetric === 'doanhSo' ? 'Doanh số' : 'Doanh thu CVAT'}) & Dự phóng vs Kế hoạch ({periodLabel})</p>
                      </div>
                      <div className="flex gap-4 mb-6">
                         <div className="flex-1 bg-blue-50/40 p-3 rounded-lg border border-blue-100">
                            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Thực tế vs KH</p>
                            <div className="flex items-center gap-1.5">
                               {actualVsPlanValue > 0 ? <TrendingUp size={16} className="text-emerald-500"/> : (actualVsPlanValue < 0 ? <TrendingDown size={16} className="text-rose-500"/> : <Minus size={16} className="text-slate-400"/>)}
                               <span className={`font-bold ${actualVsPlanValue > 0 ? 'text-emerald-600' : (actualVsPlanValue < 0 ? 'text-rose-600' : 'text-slate-600')}`}>
                                  {actualVsPlanValue > 0 ? '+' : ''}{formatVND(actualVsPlanValue)}
                               </span>
                            </div>
                            <p className={`text-xs mt-0.5 font-medium ${actualVsPlanValue > 0 ? 'text-emerald-600' : (actualVsPlanValue < 0 ? 'text-rose-600' : 'text-slate-500')}`}>
                              ({actualVsPlanPercent > 0 ? '+' : ''}{actualVsPlanPercent.toFixed(1)}%)
                            </p>
                         </div>
                         <div className="flex-1 bg-purple-50/40 p-3 rounded-lg border border-purple-100">
                            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">Dự phóng vs KH</p>
                            <div className="flex items-center gap-1.5">
                               {forecastVsPlanValue > 0 ? <TrendingUp size={16} className="text-emerald-500"/> : (forecastVsPlanValue < 0 ? <TrendingDown size={16} className="text-rose-500"/> : <Minus size={16} className="text-slate-400"/>)}
                               <span className={`font-bold ${forecastVsPlanValue > 0 ? 'text-emerald-600' : (forecastVsPlanValue < 0 ? 'text-rose-600' : 'text-slate-600')}`}>
                                  {forecastVsPlanValue > 0 ? '+' : ''}{formatVND(forecastVsPlanValue)}
                               </span>
                            </div>
                            <p className={`text-xs mt-0.5 font-medium ${forecastVsPlanValue > 0 ? 'text-emerald-600' : (forecastVsPlanValue < 0 ? 'text-rose-600' : 'text-slate-500')}`}>
                              ({forecastVsPlanPercent > 0 ? '+' : ''}{forecastVsPlanPercent.toFixed(1)}%)
                            </p>
                         </div>
                      </div>
                      <div className="flex-1 min-h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={forecastChartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }} barSize={50}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${(val / 1000000000).toFixed(0)}Tỷ`} />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }} 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100">
                                      <p className="font-bold text-slate-700">{payload[0].payload.name}</p>
                                      <p className="font-bold text-lg" style={{color: payload[0].payload.fill}}>{formatVND(payload[0].value)}</p>
                                    </div>
                                  )
                                }
                                return null;
                              }} 
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                              {forecastChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                      <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-800">Cơ cấu Doanh thu</h2>
                        <p className="text-sm text-slate-500">Đóng góp của các mặt hàng vào số Thực tế</p>
                      </div>
                      <div className="h-[350px] w-full flex flex-col">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={productProgress.filter(p => p.actual > 0)} cx="50%" cy="45%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="actual">
                              {productProgress.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<PieTooltip total={totalActual} />} />
                            <Legend content={<CustomLegend />} verticalAlign="bottom" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* BẢNG PHÂN TÍCH TĂNG TRƯỞNG */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
                    <div className="mb-4">
                      <h2 className="text-lg font-bold text-slate-800">Phân tích Tăng trưởng (Period-over-Period)</h2>
                      <p className="text-sm text-slate-500">So sánh thực tế giữa các <strong className="text-blue-600">{chartGranularity === 'day' ? 'ngày' : chartGranularity === 'month' ? 'tháng' : 'quý'}</strong> liên tiếp</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-sm border-y border-slate-200">
                            <th className="p-3 font-semibold">Kỳ báo cáo</th>
                            <th className="p-3 font-semibold text-right">Thực tế ({financeMetric === 'doanhSo' ? 'Doanh số' : 'Doanh thu CVAT'})</th>
                            <th className="p-3 font-semibold text-right">Kế hoạch</th>
                            <th className="p-3 font-semibold text-right">Tiến độ KH</th>
                            <th className="p-3 font-semibold text-right">+/- Giá trị vs Kỳ trước</th>
                            <th className="p-3 font-semibold text-right">Tăng trưởng (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {growthTableData.map((row, idx) => {
                            const isPositive = row.diffValue > 0;
                            const isNegative = row.diffValue < 0;
                            const isFirst = !row.hasPrev;

                            return (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-medium text-slate-700">{row.time}</td>
                                <td className="p-3 text-right font-bold text-slate-800">{formatVND(row.actual)}</td>
                                <td className="p-3 text-right text-slate-500">{formatVND(row.plan)}</td>
                                <td className="p-3 text-right">
                                   {row.plan > 0 ? (
                                     <span className={`font-medium ${row.actual >= row.plan ? 'text-emerald-600' : 'text-blue-600'}`}>
                                       {((row.actual / row.plan) * 100).toFixed(1)}%
                                     </span>
                                   ) : <span className="text-slate-300">-</span>}
                               </td>
                                <td className="p-3 text-right">
                                  {!isFirst && (row.actual > 0 || row.prevActual > 0) ? (
                                    <span className={`flex items-center justify-end gap-1 font-medium ${isPositive ? 'text-emerald-600' : (isNegative ? 'text-rose-600' : 'text-slate-500')}`}>
                                      {isPositive ? <TrendingUp size={14}/> : (isNegative ? <TrendingDown size={14}/> : <Minus size={14}/>)}
                                      {isPositive ? '+' : ''}{formatVND(row.diffValue)}
                                    </span>
                                  ) : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="p-3 text-right">
                                   {!isFirst && row.prevActual > 0 ? (
                                     <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${isPositive ? 'bg-emerald-100 text-emerald-700' : (isNegative ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600')}`}>
                                       {isPositive ? '+' : ''}{row.diffPercent.toFixed(1)}%
                                     </span>
                                   ) : <span className="text-slate-300">-</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
               </div>
            )}

            {activeTab === 'team' && (
               <div className="animate-in fade-in duration-300">
                  <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3 overflow-x-auto custom-scrollbar">
                     {hasAccess('sub_finance') && (
                         <button onClick={()=>setActiveTeamTab('finance_team')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${activeTeamTab === 'finance_team' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <DollarSign size={18}/> Tài chính nhóm
                         </button>
                     )}
                     {hasAccess('sub_sales') && (
                         <button onClick={()=>setActiveTeamTab('sales_programs')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${activeTeamTab === 'sales_programs' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <Megaphone size={18}/> Chương trình bán hàng
                         </button>
                     )}
                     {hasAccess('sub_overview') && (
                         <button onClick={()=>setActiveTeamTab('task_overview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${activeTeamTab === 'task_overview' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <PieChartIcon size={18}/> Tổng quan công việc
                         </button>
                     )}
                     {hasAccess('sub_task') && (
                         <button onClick={()=>setActiveTeamTab('task_management')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${activeTeamTab === 'task_management' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <ListTodo size={18}/> Quản lý công việc
                         </button>
                     )}
                  </div>

                  {activeTeamTab === 'finance_team' && hasAccess('sub_finance') && (
                     <div className="animate-in slide-in-from-bottom-2 duration-300">
                        {teamAggregations.length === 0 ? (
                           <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-100 text-center">
                              <Users size={48} className="text-slate-300 mb-4 mx-auto" />
                              <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có dữ liệu đội nhóm</h3>
                              <p className="text-slate-500">Vui lòng tải lên file báo cáo thực tế chứa thông tin Trưởng nhóm và Nhân viên.</p>
                           </div>
                        ) : (() => {
                           // Lọc ra các nhóm mà user được quyền xem (theo allowedTeams)
                           const visibleTeams = teamAggregations.filter(team => {
                               if (appUser?.role === 'admin' || isViewOnly) return true;
                               const allowed = appUser?.allowedTeams || [];
                               return allowed.includes('All') || allowed.includes(team.name);
                           });

                           if (visibleTeams.length === 0) {
                               return (
                                   <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-100 text-center flex flex-col items-center">
                                      <Lock size={48} className="text-slate-300 mb-4" />
                                      <h3 className="text-xl font-bold text-slate-700 mb-2">Không có quyền truy cập</h3>
                                      <p className="text-slate-500 max-w-sm text-center">Bạn chưa được Quản trị viên cấp quyền xem dữ liệu tài chính của bất kỳ nhóm nào. Vui lòng liên hệ Admin.</p>
                                   </div>
                               );
                           }

                           return (
                               <div className="flex flex-col gap-4">
                                  {visibleTeams.map((team, idx) => (
                                     <TeamFinanceCard key={idx} team={team} isViewOnly={isViewOnly} />
                                  ))}
                               </div>
                           );
                        })()}
                     </div>
                  )}

                  {activeTeamTab === 'sales_programs' && hasAccess('sub_sales') && (
                     <div className="animate-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap items-center gap-3">
                           <div className="flex items-center gap-2 text-slate-600 font-semibold"><Calendar size={18}/> Lọc chương trình:</div>
                           <select className="bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-sm rounded-lg p-2.5 outline-none min-w-[210px]" value={salesPeriodFilter} onChange={e=>setSalesPeriodFilter(e.target.value)}>
                              {periodOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                           </select>
                           <span className="text-xs text-slate-500">Kết quả thực tế tự tính từ file Excel trong kỳ áp dụng của từng chương trình.</span>
                        </div>

                        {!isViewOnly && hasAccess('action_manage_sales') && (
                           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18}/> Thêm chương trình bán hàng</h3>
                              <form onSubmit={handleSalesProgramSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                 <select required className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={newSalesProgram.team} onChange={e=>setNewSalesProgram({...newSalesProgram, team: e.target.value})}>
                                    <option value="">Chọn nhóm phụ trách</option>
                                    {(dynamicTeams.length ? dynamicTeams : fallbackTeams).map(team => <option key={team} value={team}>{team}</option>)}
                                 </select>
                                 <select required className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={newSalesProgram.period} onChange={e=>setNewSalesProgram({...newSalesProgram, period: e.target.value})}>
                                    {periodOptions.map(option => <option key={option.value} value={option.value}>Kỳ áp dụng: {option.label}</option>)}
                                 </select>
                                 <input required type="text" placeholder="Tên chương trình" className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={newSalesProgram.name} onChange={e=>setNewSalesProgram({...newSalesProgram, name: e.target.value})} />
                                 <select className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={newSalesProgram.deploymentStatus} onChange={e=>setNewSalesProgram({...newSalesProgram, deploymentStatus: e.target.value})}>
                                    <option value="Chưa triển khai">Chưa triển khai</option>
                                    <option value="Đang triển khai">Đang triển khai</option>
                                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                                 </select>
                                 <input required type="text" placeholder="Mục tiêu chương trình" className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 lg:col-span-2" value={newSalesProgram.goal} onChange={e=>setNewSalesProgram({...newSalesProgram, goal: e.target.value})} />
                                 <textarea required placeholder="Chi tiết chương trình" className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 lg:col-span-2 resize-none" value={newSalesProgram.details} onChange={e=>setNewSalesProgram({...newSalesProgram, details: e.target.value})} />
                                 <input type="number" min="0" max="100" placeholder="% hoàn thành công việc" className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={newSalesProgram.completion || ''} onChange={e=>setNewSalesProgram({...newSalesProgram, completion: Number(e.target.value)})} />
                                 <div className="lg:col-span-4 border border-indigo-100 bg-indigo-50/40 rounded-xl p-4">
                                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Package size={17} className="text-indigo-600"/> Mục tiêu theo mặt hàng</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                       <select className="bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={salesProductDraft.product} onChange={e=>setSalesProductDraft({...salesProductDraft, product: e.target.value})}>
                                          <option value="">Chọn mặt hàng từ file</option>
                                          {salesProductOptions.map(product => <option key={product} value={product}>{product}</option>)}
                                       </select>
                                       <input type="number" min="0" placeholder="KH DT chưa VAT" className="bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={salesProductDraft.targetRevenue || ''} onChange={e=>setSalesProductDraft({...salesProductDraft, targetRevenue: Number(e.target.value)})} />
                                       <input type="number" min="0" placeholder="KH doanh số" className="bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={salesProductDraft.targetSales || ''} onChange={e=>setSalesProductDraft({...salesProductDraft, targetSales: Number(e.target.value)})} />
                                       <div className="flex gap-2">
                                          <input type="number" min="0" placeholder="KH số lượng" className="min-w-0 flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={salesProductDraft.targetQty || ''} onChange={e=>setSalesProductDraft({...salesProductDraft, targetQty: Number(e.target.value)})} />
                                          <button type="button" onClick={handleAddSalesProductTarget} className="bg-indigo-600 text-white px-3 rounded-lg hover:bg-indigo-700"><Plus size={18}/></button>
                                       </div>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-3">
                                       {Object.entries(newSalesProgram.productTargets || {}).map(([product, target]) => (
                                          <div key={product} className="bg-white border border-indigo-100 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                                             <span className="font-bold text-slate-700">{product}</span>
                                             <span className="text-slate-500">DT: {formatVND(target.targetRevenue)} | DS: {formatVND(target.targetSales)} | SL: {formatVND(target.targetQty)}</span>
                                             <button type="button" onClick={() => {
                                                const next = {...newSalesProgram.productTargets};
                                                delete next[product];
                                                setNewSalesProgram({...newSalesProgram, productTargets: next});
                                             }} className="text-rose-500 hover:text-rose-700 self-end md:self-auto"><Trash2 size={15}/></button>
                                          </div>
                                       ))}
                                       {Object.keys(newSalesProgram.productTargets || {}).length === 0 && <p className="text-xs text-slate-500 italic">Tải file thực tế trước để có danh sách mặt hàng, sau đó chọn và nhập kế hoạch.</p>}
                                    </div>
                                 </div>
                                 <button type="submit" className="bg-indigo-600 text-white font-bold rounded-lg p-2.5 text-sm hover:bg-indigo-700 transition-colors lg:col-span-4">Thêm chương trình</button>
                              </form>
                           </div>
                        )}

                        {filteredSalesPrograms.length === 0 ? (
                           <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-100 text-center flex flex-col items-center">
                              <Megaphone size={48} className="text-slate-300 mb-4"/>
                              <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có chương trình bán hàng</h3>
                              <p className="text-slate-500">Không có chương trình bán hàng trong kỳ đang chọn.</p>
                           </div>
                        ) : (
                           <div className="flex flex-col gap-6">
                              {Array.from(new Set(filteredSalesPrograms.map(program => program.team))).map(team => {
                                 const programs = filteredSalesPrograms.filter(program => program.team === team);
                                 if (appUser?.role !== 'admin' && !isViewOnly) {
                                    const allowed = appUser?.allowedTeams || [];
                                    if (!allowed.includes('All') && !allowed.includes(team)) return null;
                                 }
                                 return (
                                    <section key={team} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                       <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600"/>{team}</h3>
                                          <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full">{programs.length} chương trình</span>
                                       </div>
                                       <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4">
                                          {programs.map(program => (
                                             <SalesProgramCard key={program.id} program={program} canEdit={!isViewOnly && hasAccess('action_manage_sales')} onUpdate={updateSalesProgram} onDelete={handleDeleteSalesProgram} />
                                          ))}
                                       </div>
                                    </section>
                                 );
                              })}
                           </div>
                        )}
                     </div>
                  )}

                  {activeTeamTab === 'task_overview' && hasAccess('sub_overview') && (
                     <div className="animate-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
                           <div>
                              <p className="text-xs font-semibold text-slate-500 mb-1">Từ ngày</p>
                              <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 outline-none" value={taskFilters.startDate} onChange={e=>setTaskFilters({...taskFilters, startDate: e.target.value})} />
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-slate-500 mb-1">Đến ngày</p>
                              <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 outline-none" value={taskFilters.endDate} onChange={e=>setTaskFilters({...taskFilters, endDate: e.target.value})} />
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-slate-500 mb-1">Nhân sự phụ trách</p>
                              <select className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 outline-none w-40" value={taskFilters.empName} onChange={e=>setTaskFilters({...taskFilters, empName: e.target.value})}>
                                 <option value="All">Tất cả nhân sự</option>
                                 {dynamicEmployees.map(e => <option key={e} value={e}>{e}</option>)}
                              </select>
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-slate-500 mb-1">Trạng thái</p>
                              <select className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 outline-none w-40" value={taskFilters.status} onChange={e=>setTaskFilters({...taskFilters, status: e.target.value})}>
                                 <option value="All">Tất cả trạng thái</option>
                                 {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                              <p className="text-sm font-medium text-slate-500 mb-1">Tổng công việc</p>
                              <h3 className="text-2xl font-bold text-indigo-600">{taskKPIs.total}</h3>
                           </div>
                           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                              <p className="text-sm font-medium text-slate-500 mb-1">Hoàn thành / Hủy</p>
                              <h3 className="text-2xl font-bold text-emerald-600">{taskKPIs.completed}</h3>
                           </div>
                           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                              <p className="text-sm font-medium text-slate-500 mb-1">Đang làm</p>
                              <h3 className="text-2xl font-bold text-amber-500">{taskKPIs.inProgress}</h3>
                           </div>
                           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                              <p className="text-sm font-medium text-slate-500 mb-1">Quá hạn</p>
                              <h3 className="text-2xl font-bold text-rose-600">{taskKPIs.overdue}</h3>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                           <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-100">
                              <h3 className="text-lg font-bold text-rose-800 flex items-center gap-2 mb-4"><AlertTriangle size={18}/> Quá hạn cần xử lý</h3>
                              <div className="flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                                 {taskKPIs.overdueList.length === 0 ? <p className="text-sm text-slate-500 italic">Không có công việc nào quá hạn.</p> : taskKPIs.overdueList.map(t => (
                                    <div key={t.id} className="bg-white p-3 rounded-lg border border-rose-200 shadow-sm flex flex-col">
                                       <div className="flex justify-between items-start mb-1">
                                          <p className="font-bold text-slate-800 truncate" title={t.name}>{t.name}</p>
                                          <TaskPriorityBadge priority={t.priority} />
                                       </div>
                                       <p className="text-xs text-slate-500 mb-2 truncate">PT: {t.empName} | Hạn: {t.endDate}</p>
                                       <TaskStatusBadge status={t.status} />
                                    </div>
                                 ))}
                              </div>
                           </div>
                           
                           <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100">
                              <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2 mb-4"><Clock size={18}/> Sắp đến hạn (7 ngày tới)</h3>
                              <div className="flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                                 {taskKPIs.upcomingList.length === 0 ? <p className="text-sm text-slate-500 italic">Không có công việc sắp đến hạn.</p> : taskKPIs.upcomingList.map(t => (
                                    <div key={t.id} className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm flex flex-col">
                                       <div className="flex justify-between items-start mb-1">
                                          <p className="font-bold text-slate-800 truncate" title={t.name}>{t.name}</p>
                                          <TaskPriorityBadge priority={t.priority} />
                                       </div>
                                       <p className="text-xs text-slate-500 mb-2 truncate">PT: {t.empName} | Hạn: {t.endDate}</p>
                                       <TaskStatusBadge status={t.status} />
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 h-[350px] w-full flex flex-col">
                           <h3 className="text-lg font-bold text-slate-800 mb-4">Dashboard Trạng Thái Công Việc</h3>
                           <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                               <Pie data={taskKPIs.statusChartData} cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                 {taskKPIs.statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />)}
                               </Pie>
                               <Tooltip />
                               <Legend verticalAlign="bottom"/>
                             </PieChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}

                  {activeTeamTab === 'task_management' && hasAccess('sub_task') && (
                     <div className="animate-in slide-in-from-bottom-2 duration-300">
                        {!isViewOnly && hasAccess('action_manage_tasks') && (
                           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18}/> Thêm mới công việc / dự án</h3>
                              <form onSubmit={handleTaskSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                 <input type="text" placeholder="Mã dự án (Tự động nếu trống)" className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={newTask.id} onChange={e=>setNewTask({...newTask, id: e.target.value})} />
                                 <input type="text" required placeholder="Tên dự án" className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 lg:col-span-2" value={newTask.name} onChange={e=>setNewTask({...newTask, name: e.target.value})} />
                                 <input type="text" required placeholder="Mục tiêu" className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={newTask.goal} onChange={e=>setNewTask({...newTask, goal: e.target.value})} />
                                 <input type="text" placeholder="Mã NV quản lý" className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={newTask.empId} onChange={e=>setNewTask({...newTask, empId: e.target.value})} />
                                 <input type="text" required placeholder="Họ tên NV quản lý" className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={newTask.empName} onChange={e=>setNewTask({...newTask, empName: e.target.value})} />
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Bắt đầu:</span>
                                    <input type="date" required className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none w-full" value={newTask.startDate} onChange={e=>setNewTask({...newTask, startDate: e.target.value})} />
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Kết thúc:</span>
                                    <input type="date" required className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none w-full" value={newTask.endDate} onChange={e=>setNewTask({...newTask, endDate: e.target.value})} />
                                 </div>
                                 <select className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none lg:col-span-2" value={newTask.status} onChange={e=>setNewTask({...newTask, status: e.target.value})}>
                                    {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                                 </select>
                                 <select className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" value={newTask.priority} onChange={e=>setNewTask({...newTask, priority: e.target.value})}>
                                    <option value="Thấp">Ưu tiên: Thấp</option>
                                    <option value="Trung bình">Ưu tiên: Trung bình</option>
                                    <option value="Cao">Ưu tiên: Cao</option>
                                 </select>
                                 <button type="submit" className="bg-indigo-600 text-white font-bold rounded-lg p-2.5 text-sm hover:bg-indigo-700 transition-colors">Thêm Công Việc</button>
                              </form>
                           </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                           <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Briefcase size={18}/> Danh sách toàn bộ công việc</h3>
                              <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full">{tasks.length} tasks</span>
                           </div>
                           <div className="overflow-x-auto w-full">
                              <table className="w-full text-left border-collapse min-w-[1000px]">
                                 <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                                       <th className="p-3 font-semibold pl-5">Mã</th>
                                       <th className="p-3 font-semibold">Tên Dự án / Mục tiêu</th>
                                       <th className="p-3 font-semibold">Nhân sự</th>
                                       <th className="p-3 font-semibold">Thời gian</th>
                                       <th className="p-3 font-semibold text-center">Trạng thái</th>
                                       <th className="p-3 font-semibold text-center">Ưu tiên</th>
                                       {!isViewOnly && hasAccess('action_manage_tasks') && <th className="p-3 font-semibold text-center pr-5">Thao tác</th>}
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {filteredTasks.map((t, idx) => (
                                       <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                          <td className="p-3 pl-5 text-xs font-mono text-slate-500">{t.id}</td>
                                          <td className="p-3">
                                             <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                                             <p className="text-xs text-slate-500 mt-0.5">{t.goal}</p>
                                          </td>
                                          <td className="p-3">
                                             <p className="font-medium text-slate-700 text-sm">{t.empName}</p>
                                             <p className="text-xs text-slate-400">{t.empId}</p>
                                          </td>
                                          <td className="p-3 text-xs text-slate-600">
                                             {t.startDate} ➔ <strong className="text-slate-800">{t.endDate}</strong>
                                          </td>
                                          <td className="p-3 text-center"><TaskStatusBadge status={t.status}/></td>
                                          <td className="p-3 text-center"><TaskPriorityBadge priority={t.priority}/></td>
                                          {!isViewOnly && hasAccess('action_manage_tasks') && (
                                             <td className="p-3 text-center pr-5">
                                                <button onClick={() => handleDeleteTaskConfirm(t.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors" title="Xóa công việc"><Trash2 size={16} /></button>
                                             </td>
                                          )}
                                       </tr>
                                    ))}
                                    {filteredTasks.length === 0 && (
                                       <tr><td colSpan={isViewOnly ? "6" : "7"} className="p-8 text-center text-slate-500 italic">Không tìm thấy công việc nào.</td></tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'custom' && (
               <div className="animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                     <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Eye className="text-indigo-600" size={24}/> Dashboard Theo Dõi Tùy Chỉnh</h2>
                        <p className="text-sm text-slate-500 mt-1">Tạo các nhóm riêng biệt và gán chỉ tiêu từng mặt hàng để theo dõi chi tiết.</p>
                     </div>
                     {!isViewOnly && (
                        <button onClick={() => { setEditingGroup({ id: '', name: '', target: 0, productTargets: {}, members: [] }); setNewMemberInput(''); setGroupModalError(''); setIsCustomGroupModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap">
                           <UserPlus size={18} /> Tạo nhóm mới
                        </button>
                     )}
                  </div>

                  {customGroups.length === 0 ? (
                     <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-100 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4"><Search size={32}/></div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có nhóm theo dõi nào</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-6">Bạn có thể tạo các nhóm theo dõi riêng biệt (ví dụ: Nhóm chiến dịch Mùa Hè, Nhóm nhân sự mới) để đo lường hiệu quả độc lập.</p>
                        {!isViewOnly && (
                           <button onClick={() => { setEditingGroup({ id: '', name: '', target: 0, productTargets: {}, members: [] }); setNewMemberInput(''); setGroupModalError(''); setIsCustomGroupModalOpen(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                              <Plus size={18}/> Tạo nhóm đầu tiên
                           </button>
                        )}
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {customGroupStats.map((group, idx) => (
                           <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                                 <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                       {group.name}
                                       {!isViewOnly && (
                                          <button onClick={() => { setEditingGroup(group); setNewMemberInput(''); setGroupModalError(''); setIsCustomGroupModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 transition-colors p-1"><Edit size={14}/></button>
                                       )}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">{group.members.length} thành viên được theo dõi</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Tổng Mục Tiêu</p>
                                    <p className="font-bold text-slate-700">{group.calculatedTarget > 0 ? formatVND(group.calculatedTarget) : 'Chưa thiết lập'}</p>
                                 </div>
                              </div>
                              
                              <div className="p-5 flex-1 flex flex-col">
                                 <div className="flex justify-between items-end mb-2">
                                    <div>
                                       <p className="text-xs font-semibold text-slate-500 mb-1">Tổng Thực tế đạt (Doanh số bán)</p>
                                       <div className="flex items-baseline gap-2">
                                           <p className="text-2xl font-bold text-emerald-600">{formatVND(group.actualDoanhSo)}</p>
                                           <p className="text-xs text-slate-500 font-medium pb-1">SL: {group.actualQty || 0} | CVAT: {formatVND(group.actualDthu)}</p>
                                       </div>
                                    </div>
                                    {group.calculatedTarget > 0 && (
                                       <div className="text-right">
                                          <span className={`text-xl font-bold ${group.percent >= 100 ? 'text-emerald-500' : 'text-blue-600'}`}>{group.percent.toFixed(1)}%</span>
                                       </div>
                                    )}
                                 </div>

                                 {group.calculatedTarget > 0 && (
                                    <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden">
                                       <div className={`h-2.5 rounded-full transition-all duration-1000 ${group.percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(group.percent, 100)}%` }}></div>
                                    </div>
                                 )}

                                 <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                     {/* Cột Chi tiết Sản phẩm */}
                                     <div className="flex flex-col h-full border-r-0 md:border-r border-slate-100 pr-0 md:pr-4">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Mục tiêu theo mặt hàng</p>
                                        
                                        {group.productList.length > 0 && (
                                           <div className="h-[140px] w-full mb-4">
                                              <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={group.productList} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                  <XAxis dataKey="name" hide />
                                                  <Tooltip 
                                                    cursor={{fill: '#f8fafc'}}
                                                    content={({ active, payload }) => {
                                                      if (active && payload && payload.length) {
                                                        const item = payload[0].payload;
                                                        const percent = item.target > 0 ? ((item.doanhSo / item.target) * 100).toFixed(1) : 0;
                                                        return (
                                                          <div className="bg-white p-2 rounded shadow-md border border-slate-100 text-xs">
                                                            <p className="font-bold text-slate-700 mb-1">{item.name}</p>
                                                            {payload.map((p, i) => (
                                                              <p key={i} style={{color: p.color}}>
                                                                {p.name}: {formatVND(p.value)}
                                                              </p>
                                                            ))}
                                                            {item.target > 0 && <p className="text-indigo-600 font-bold mt-1">Hoàn thành: {percent}%</p>}
                                                          </div>
                                                        );
                                                      }
                                                      return null;
                                                    }} 
                                                  />
                                                  <Bar dataKey="target" name="Mục tiêu" fill="#cbd5e1" radius={[2, 2, 0, 0]} maxBarSize={30} />
                                                  <Bar dataKey="doanhSo" name="Thực tế (DS)" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={30}>
                                                     <LabelList 
                                                        dataKey="doanhSo" 
                                                        content={(props) => {
                                                           const { x, y, width, index } = props;
                                                           const target = group.productList[index].target;
                                                           const val = group.productList[index].doanhSo;
                                                           if (!target || target === 0) return null;
                                                           const percent = ((val / target) * 100).toFixed(0);
                                                           return (
                                                              <text x={x + width / 2} y={y - 4} fill="#3b82f6" fontSize="9" fontWeight="bold" textAnchor="middle">
                                                                 {percent}%
                                                              </text>
                                                           );
                                                        }}
                                                     />
                                                  </Bar>
                                                </BarChart>
                                              </ResponsiveContainer>
                                           </div>
                                        )}

                                        <div className="flex flex-col gap-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                           {group.productList.length === 0 ? (
                                                <p className="text-sm text-slate-500 italic">Chưa có chỉ tiêu mặt hàng.</p>
                                           ) : (
                                                group.productList.map((prod, pidx) => (
                                                    <CustomGroupProductItem key={pidx} prod={prod} />
                                                ))
                                           )}
                                        </div>
                                     </div>
                                     
                                     {/* Cột Đóng góp Thành viên */}
                                     <div className="flex flex-col h-full pl-0 md:pl-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Đóng góp của thành viên</p>
                                        
                                        {group.memberList.some(m => m.dthu > 0) && (
                                           <div className="h-[140px] w-full mb-4">
                                              <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                  <Pie 
                                                    data={group.memberList.filter(m => m.doanhSo > 0 || m.dthu > 0)} 
                                                    cx="50%" cy="50%" 
                                                    innerRadius={30} outerRadius={60} 
                                                    paddingAngle={2} dataKey="doanhSo" nameKey="name"
                                                  >
                                                    {group.memberList.filter(m => m.doanhSo > 0 || m.dthu > 0).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                  </Pie>
                                                  <Tooltip 
                                                    content={({ active, payload }) => {
                                                      if (active && payload && payload.length) {
                                                        const p = payload[0];
                                                        return (
                                                          <div className="bg-white p-2 rounded shadow-md border border-slate-100 text-xs text-center">
                                                            <p className="font-bold text-slate-700 mb-1">{p.name}</p>
                                                            <p className="font-bold" style={{color: p.payload.fill}}>{formatVND(p.value)}</p>
                                                          </div>
                                                        )
                                                      }
                                                      return null;
                                                    }}
                                                  />
                                                </PieChart>
                                              </ResponsiveContainer>
                                           </div>
                                        )}

                                        <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                           {group.memberList.map((m, midx) => {
                                              const mPercent = group.actualDoanhSo > 0 ? ((m.doanhSo / group.actualDoanhSo) * 100).toFixed(1) : 0;
                                              return (
                                                 <div key={midx} className="flex justify-between items-center text-sm border-b border-dashed border-slate-100 pb-2 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                                                       <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">{m.name.charAt(0)}</div>
                                                       <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-700 truncate" title={m.name}>{m.name}</span>
                                                            <span className="text-[10px] text-slate-500">SL: {m.qty} | CVAT: {formatVND(m.dthu)}</span>
                                                       </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                       <p className="font-bold text-slate-800">{formatVND(m.doanhSo)}</p>
                                                       <p className="text-[10px] text-slate-500 font-medium">Chiếm {mPercent}% nhóm</p>
                                                    </div>
                                                 </div>
                                              )
                                           })}
                                           {group.memberList.length === 0 && <p className="text-sm text-slate-500 italic">Nhóm chưa có dữ liệu đóng góp trong kỳ này.</p>}
                                        </div>
                                     </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'inventory' && (
               <div className="animate-in fade-in duration-300">
                  {/* SUB TABS CHO TỒN KHO */}
                  <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3 overflow-x-auto custom-scrollbar">
                     <button onClick={()=>setActiveInventoryTab('overview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${activeInventoryTab === 'overview' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <PieChartIcon size={18}/> Tổng quan
                     </button>
                     <button onClick={()=>setActiveInventoryTab('detailed')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${activeInventoryTab === 'detailed' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <Archive size={18}/> Tổng tồn kho chi tiết
                     </button>
                  </div>

                  {activeInventoryTab === 'overview' && (
                      <div className="animate-in slide-in-from-bottom-2 duration-300">
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
                              <div className="flex-1 min-w-[250px]">
                                  <p className="text-xs font-semibold text-slate-500 mb-1">Tìm kiếm Mã hoặc Tên hàng</p>
                                  <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                      <input 
                                          type="text" 
                                          placeholder="Nhập mã hàng hoặc tên hàng..." 
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" 
                                          value={invSearch} 
                                          onChange={e => setInvSearch(e.target.value)} 
                                      />
                                  </div>
                              </div>
                              <div className="w-full md:w-auto">
                                  <p className="text-xs font-semibold text-slate-500 mb-1">Khu vực</p>
                                  <select className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 outline-none w-full md:w-48" value={invRegionFilter} onChange={e=>setInvRegionFilter(e.target.value)}>
                                     <option value="All">Tất cả Khu vực</option>
                                     {invDynamicRegions.map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                              </div>
                              <div className="w-full md:w-auto">
                                  <p className="text-xs font-semibold text-slate-500 mb-1">Thương hiệu</p>
                                  <div className="relative w-full md:w-56">
                                    <button type="button" onClick={() => setIsInvBrandFilterOpen(open => !open)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 flex items-center justify-between gap-2">
                                      <span className="truncate">{invBrandFilters.length === 0 ? 'Tất cả Thương hiệu' : `${invBrandFilters.length} thương hiệu đã chọn`}</span>
                                      <ChevronDown size={16}/>
                                    </button>
                                    {isInvBrandFilterOpen && (
                                      <div className="absolute right-0 top-full mt-2 z-50 w-64 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-2">
                                        <button type="button" onClick={() => setInvBrandFilters([])} className="w-full flex items-center gap-2 p-2 rounded-lg text-sm hover:bg-slate-50">
                                          {invBrandFilters.length === 0 ? <CheckSquare size={16} className="text-blue-600"/> : <Square size={16}/>} Tất cả thương hiệu
                                        </button>
                                        {invDynamicBrands.map(brand => (
                                          <button type="button" key={brand} onClick={() => setInvBrandFilters(current => current.includes(brand) ? current.filter(item => item !== brand) : [...current, brand])} className="w-full flex items-center gap-2 p-2 rounded-lg text-sm hover:bg-slate-50">
                                            {invBrandFilters.includes(brand) ? <CheckSquare size={16} className="text-blue-600"/> : <Square size={16}/>} {brand}
                                          </button>
                                        ))}
                                        <button type="button" onClick={() => setIsInvBrandFilterOpen(false)} className="sticky bottom-0 mt-2 w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold">Áp dụng</button>
                                      </div>
                                    )}
                                  </div>
                              </div>
                              <div className="w-full md:w-auto">
                                  <p className="text-xs font-semibold text-slate-500 mb-1">Sản phẩm</p>
                                  <div className="relative w-full md:w-64">
                                    <button type="button" onClick={() => setIsInvProductFilterOpen(open => !open)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 flex items-center justify-between gap-2">
                                      <span className="truncate">{invProductFilters.length === 0 ? 'Tất cả Sản phẩm' : `${invProductFilters.length} sản phẩm đã chọn`}</span>
                                      <ChevronDown size={16}/>
                                    </button>
                                    {isInvProductFilterOpen && (
                                      <div className="absolute right-0 top-full mt-2 z-50 w-96 max-w-[90vw] max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-2">
                                        <button type="button" onClick={() => setInvProductFilters([])} className="w-full flex items-center gap-2 p-2 rounded-lg text-sm hover:bg-slate-50">
                                          {invProductFilters.length === 0 ? <CheckSquare size={16} className="text-blue-600"/> : <Square size={16}/>} Tất cả sản phẩm
                                        </button>
                                        {invDynamicProducts.map(product => (
                                          <button type="button" key={product.code} onClick={() => setInvProductFilters(current => current.includes(product.code) ? current.filter(item => item !== product.code) : [...current, product.code])} className="w-full flex items-start gap-2 p-2 rounded-lg text-left text-sm hover:bg-slate-50">
                                            {invProductFilters.includes(product.code) ? <CheckSquare size={16} className="text-blue-600 shrink-0 mt-0.5"/> : <Square size={16} className="shrink-0 mt-0.5"/>}
                                            <span><strong>{product.code}</strong> - {product.name}</span>
                                          </button>
                                        ))}
                                        <button type="button" onClick={() => setIsInvProductFilterOpen(false)} className="sticky bottom-0 mt-2 w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold">Áp dụng</button>
                                      </div>
                                    )}
                                  </div>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={24}/></div>
                                <div><p className="text-sm font-medium text-slate-500">Tổng SL Tồn</p><h3 className="text-2xl font-bold text-slate-800">{inventoryDataProcessed.totalQty.toLocaleString()}</h3></div>
                             </div>
                             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><DollarSign size={24}/></div>
                                <div><p className="text-sm font-medium text-slate-500">Tổng Giá trị Tồn</p><h3 className="text-xl font-bold text-slate-800">{formatVND(inventoryDataProcessed.totalValue)}</h3></div>
                             </div>
                             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Archive size={24}/></div>
                                <div><p className="text-sm font-medium text-slate-500">Số Sản Phẩm</p><h3 className="text-2xl font-bold text-slate-800">{inventoryDataProcessed.products.length.toLocaleString()}</h3></div>
                             </div>
                             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Database size={24}/></div>
                                <div><p className="text-sm font-medium text-slate-500">Khu vực</p><h3 className="text-2xl font-bold text-slate-800">{inventoryDataProcessed.byRegion.length}</h3></div>
                             </div>
                             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Target size={24}/></div>
                                <div><p className="text-sm font-medium text-slate-500">Thương hiệu</p><h3 className="text-2xl font-bold text-slate-800">{inventoryDataProcessed.byBrand.length}</h3></div>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 lg:col-span-1">
                                  <h3 className="text-lg font-bold text-slate-800 mb-4">Tồn kho theo Khu vực</h3>
                                  <div className="h-[250px] w-full">
                                    {inventoryDataProcessed.byRegion.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                          <PieChart>
                                            <Pie data={inventoryDataProcessed.byRegion} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                                              {inventoryDataProcessed.byRegion.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(value) => value.toLocaleString()} />
                                            <Legend verticalAlign="bottom"/>
                                          </PieChart>
                                        </ResponsiveContainer>
                                    ) : <div className="h-full flex items-center justify-center text-slate-400 italic">Không có dữ liệu</div>}
                                  </div>
                              </div>
                              
                              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
                                  <h3 className="text-lg font-bold text-slate-800 mb-4">Tồn kho theo Thương hiệu (Top 10)</h3>
                                  <div className="h-[250px] w-full">
                                    {inventoryDataProcessed.byBrand.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={inventoryDataProcessed.byBrand.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={5} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={v => v.toLocaleString()} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => [value.toLocaleString(), 'Tồn kho']} />
                                            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                                <LabelList dataKey="value" position="top" formatter={(val) => val.toLocaleString()} style={{fontSize: '10px', fill: '#64748b', fontWeight: 'bold'}} />
                                            </Bar>
                                          </BarChart>
                                        </ResponsiveContainer>
                                    ) : <div className="h-full flex items-center justify-center text-slate-400 italic">Không có dữ liệu</div>}
                                  </div>
                              </div>
                          </div>

                          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Briefcase size={18}/> Danh sách Hàng hóa Tồn kho</h3>
                              </div>
                              <div className="overflow-x-auto w-full max-h-[600px] custom-scrollbar relative">
                                  <table className="w-full text-left border-collapse min-w-[1050px]">
                                      <thead className="sticky top-0 bg-slate-50 z-10">
                                          <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                                              <th className="p-4 font-semibold pl-6 w-[150px]">Mã hàng</th>
                                              <th className="p-4 font-semibold w-[30%]">Tên sản phẩm</th>
                                              <th className="p-4 font-semibold text-center">Thương hiệu</th>
                                              <th className="p-4 font-semibold text-right pr-6 w-[120px]">Tổng tồn</th>
                                              <th className="p-4 font-semibold text-right pr-6 w-[160px]">Giá trị tồn</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {inventoryDataProcessed.products.map((p, idx) => (
                                              <React.Fragment key={idx}>
                                                  <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                                      <td className="p-4 pl-6 font-mono text-sm font-bold text-slate-700">{p.code}</td>
                                                      <td className="p-4">
                                                          <p className="font-semibold text-slate-800 text-sm leading-snug">{p.name}</p>
                                                          <div className="mt-2 flex flex-wrap gap-2">
                                                              {p.locArray.map((locItem, locIdx) => (
                                                                  <span key={locIdx} className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded text-[11px] font-medium">
                                                                      {locItem.loc}: <strong className="text-blue-600">{locItem.qty.toLocaleString()}</strong>
                                                                  </span>
                                                              ))}
                                                          </div>
                                                      </td>
                                                      <td className="p-4 text-center">
                                                          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap">{p.brand}</span>
                                                      </td>
                                                      <td className="p-4 text-right pr-6">
                                                          <span className="text-lg font-black text-slate-800">{p.totalQty.toLocaleString()}</span>
                                                      </td>
                                                      <td className="p-4 text-right pr-6">
                                                          <span className="text-sm font-bold text-rose-600">{formatVND(p.totalValue)}</span>
                                                      </td>
                                                  </tr>
                                              </React.Fragment>
                                          ))}
                                          {inventoryDataProcessed.products.length === 0 && (
                                              <tr><td colSpan="5" className="p-10 text-center text-slate-500 italic">Không tìm thấy dữ liệu tồn kho nào. Vui lòng thử tìm kiếm khác hoặc tải lên file dữ liệu.</td></tr>
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeInventoryTab === 'detailed' && (
                      <div className="animate-in slide-in-from-bottom-2 duration-300">
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap items-end gap-4">
                              <div className="flex-1 min-w-[250px] max-w-md">
                                  <p className="text-xs font-semibold text-slate-500 mb-1">Tìm kiếm nhóm hàng</p>
                                  <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                      <input 
                                          type="text" 
                                          placeholder="Nhập tên nhóm hàng..."
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500" 
                                          value={invDetailSearch} 
                                          onChange={e => setInvDetailSearch(e.target.value)} 
                                      />
                                  </div>
                              </div>
                              <div className="w-full md:w-auto">
                                  <p className="text-xs font-semibold text-slate-500 mb-1">Thời gian doanh thu</p>
                                  <select className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-sm font-semibold text-amber-800 outline-none w-full md:w-52" value={invDetailPeriod} onChange={e => setInvDetailPeriod(e.target.value)}>
                                    {periodOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                  </select>
                              </div>
                              <div className="w-full md:w-auto">
                                <p className="text-xs font-semibold text-slate-500 mb-1">Thương hiệu</p>
                                <div className="relative w-full md:w-56">
                                  <button type="button" onClick={() => setIsInvDetailBrandFilterOpen(open => !open)} className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-sm font-semibold text-blue-800 flex items-center justify-between gap-2">
                                    <span className="truncate">{invDetailBrandFilters.length === 0 ? 'Tất cả thương hiệu' : `${invDetailBrandFilters.length} thương hiệu đã chọn`}</span>
                                    <ChevronDown size={16}/>
                                  </button>
                                  {isInvDetailBrandFilterOpen && (
                                    <div className="absolute right-0 top-full mt-2 z-50 w-64 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-2">
                                      <button type="button" onClick={() => setInvDetailBrandFilters([])} className="w-full flex items-center gap-2 p-2 rounded-lg text-sm hover:bg-blue-50">
                                        {invDetailBrandFilters.length === 0 ? <CheckSquare size={16} className="text-blue-600"/> : <Square size={16}/>} Tất cả thương hiệu
                                      </button>
                                      {invDetailDynamicBrands.map(brand => (
                                        <button type="button" key={brand} onClick={() => setInvDetailBrandFilters(current => current.includes(brand) ? current.filter(item => item !== brand) : [...current, brand])} className="w-full flex items-center gap-2 p-2 rounded-lg text-sm hover:bg-blue-50">
                                          {invDetailBrandFilters.includes(brand) ? <CheckSquare size={16} className="text-blue-600"/> : <Square size={16}/>} {brand}
                                        </button>
                                      ))}
                                      <button type="button" onClick={() => setIsInvDetailBrandFilterOpen(false)} className="sticky bottom-0 mt-2 w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold">Áp dụng</button>
                                    </div>
                                  )}
                                </div>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                              <p className="text-xs font-semibold text-slate-500">Tổng số lượng tồn</p>
                              <p className="text-2xl font-black text-slate-800 mt-1">{detailedInventoryAnalysis.totalQty.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                              <p className="text-xs font-semibold text-slate-500">Tổng giá trị tồn</p>
                              <p className="text-xl font-black text-emerald-700 mt-1">{formatVND(detailedInventoryAnalysis.totalInventoryValue)}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                              <p className="text-xs font-semibold text-slate-500">Doanh thu chưa VAT</p>
                              <p className="text-xl font-black text-blue-700 mt-1">{formatVND(detailedInventoryAnalysis.totalRevenue)}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                              <p className="text-xs font-semibold text-slate-500">Tỷ lệ Doanh thu / Tồn kho</p>
                              <p className="text-2xl font-black text-purple-700 mt-1">{detailedInventoryAnalysis.revenueToInventory.toFixed(1)}%</p>
                            </div>
                          </div>

                          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                              <h3 className="font-bold text-slate-800">Hiệu quả doanh thu theo nhóm hàng</h3>
                              <p className="text-xs text-slate-500 mt-1">Doanh thu chưa VAT theo kỳ đã chọn so với giá trị tồn cuối kỳ.</p>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left min-w-[760px]">
                                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                                  <tr>
                                    <th className="p-3">Nhóm hàng</th>
                                    <th className="p-3 text-right">Số lượng tồn</th>
                                    <th className="p-3 text-right">Giá trị tồn</th>
                                    <th className="p-3 text-right">Doanh thu chưa VAT</th>
                                    <th className="p-3 text-right">Doanh thu / Tồn</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detailedInventoryAnalysis.groups.map(group => (
                                    <tr key={group.name} className="border-t border-slate-100 hover:bg-slate-50/60">
                                      <td className="p-3 font-bold text-slate-700">{group.name}</td>
                                      <td className="p-3 text-right font-semibold">{group.qty.toLocaleString()}</td>
                                      <td className="p-3 text-right font-semibold text-emerald-700">{formatVND(group.inventoryValue)}</td>
                                      <td className="p-3 text-right font-semibold text-blue-700">{formatVND(group.revenue)}</td>
                                      <td className="p-3 text-right"><span className="inline-block rounded-lg bg-purple-50 px-2.5 py-1 font-bold text-purple-700">{group.revenueToInventory.toFixed(1)}%</span></td>
                                    </tr>
                                  ))}
                                  {detailedInventoryAnalysis.groups.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500 italic">Chưa có dữ liệu nhóm hàng phù hợp.</td></tr>}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Archive size={18} className="text-emerald-600"/> Báo cáo Tổng tồn kho chi tiết</h3>
                                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">{rawDetailedInventory.length} mã hàng</span>
                              </div>
                              <div className="overflow-x-auto w-full max-h-[650px] custom-scrollbar relative">
                                  <table className="w-full text-left border-collapse min-w-[1400px]">
                                      <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                                          <tr>
                                              <th rowSpan={2} className="p-3 border-r border-b border-slate-200 text-center w-[150px]">Tên kho</th>
                                              <th rowSpan={2} className="p-3 border-r border-b border-slate-200 text-center w-[100px]">Mã kho</th>
                                              <th rowSpan={2} className="p-3 border-r border-b border-slate-200 text-center w-[120px]">Mã hàng</th>
                                              <th rowSpan={2} className="p-3 border-r border-b border-slate-200 w-[200px]">Tên hàng</th>
                                              <th rowSpan={2} className="p-3 border-r border-b border-slate-200 text-center w-[60px]">ĐVT</th>
                                              <th colSpan={2} className="p-2 border-r border-b border-slate-200 text-center bg-blue-50 text-blue-800">Đầu kỳ</th>
                                              <th colSpan={2} className="p-2 border-r border-b border-slate-200 text-center bg-orange-50 text-orange-800">Xuất kho</th>
                                              <th colSpan={2} className="p-2 border-r border-b border-slate-200 text-center bg-emerald-50 text-emerald-800">Cuối kỳ</th>
                                              <th rowSpan={2} className="p-3 border-b border-slate-200 text-center w-[100px]">Nhãn hàng</th>
                                          </tr>
                                          <tr className="bg-slate-50 text-[10px]">
                                              <th className="p-2 border-r border-b border-slate-200 text-right">Số lượng</th>
                                              <th className="p-2 border-r border-b border-slate-200 text-right">Giá trị</th>
                                              <th className="p-2 border-r border-b border-slate-200 text-right">Số lượng</th>
                                              <th className="p-2 border-r border-b border-slate-200 text-right">Giá trị</th>
                                              <th className="p-2 border-r border-b border-slate-200 text-right">Số lượng</th>
                                              <th className="p-2 border-b border-slate-200 text-right">Giá trị</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {rawDetailedInventory
                                              .filter(item => {
                                                  if (!invDetailSearch) return true;
                                                  const q = invDetailSearch.toLowerCase();
                                                  return (item.tenKho || '').toLowerCase().includes(q) || 
                                                         (item.maHang || '').toLowerCase().includes(q) || 
                                                         (item.tenHang || '').toLowerCase().includes(q) ||
                                                         (item.nhomHang || '').toLowerCase().includes(q) ||
                                                         (item.nhanHang || '').toLowerCase().includes(q);
                                              })
                                              .map((row, idx) => (
                                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                                                  <td className="p-3 border-r border-slate-100 text-xs text-slate-600">{row.tenKho}</td>
                                                  <td className="p-3 border-r border-slate-100 text-xs text-slate-500 font-mono text-center">{row.maKho}</td>
                                                  <td className="p-3 border-r border-slate-100 font-mono font-semibold text-slate-700">{row.maHang}</td>
                                                  <td className="p-3 border-r border-slate-100 text-xs font-medium text-slate-800 leading-snug">{row.tenHang}</td>
                                                  <td className="p-3 border-r border-slate-100 text-xs text-center text-slate-500">{row.dvt}</td>
                                                  
                                                  {/* Đầu kỳ */}
                                                  <td className="p-3 border-r border-slate-100 text-right font-medium text-slate-700 bg-blue-50/20">{row.dauKySL.toLocaleString()}</td>
                                                  <td className="p-3 border-r border-slate-100 text-right font-semibold text-blue-700 bg-blue-50/20">{formatVND(row.dauKyGT)}</td>
                                                  
                                                  {/* Xuất kho */}
                                                  <td className="p-3 border-r border-slate-100 text-right font-medium text-slate-700 bg-orange-50/20">{row.xuatKhoSL.toLocaleString()}</td>
                                                  <td className="p-3 border-r border-slate-100 text-right font-semibold text-orange-700 bg-orange-50/20">{formatVND(row.xuatKhoGT)}</td>
                                                  
                                                  {/* Cuối kỳ */}
                                                  <td className="p-3 border-r border-slate-100 text-right font-bold text-slate-800 bg-emerald-50/20">{row.cuoiKySL.toLocaleString()}</td>
                                                  <td className="p-3 border-r border-slate-100 text-right font-bold text-emerald-700 bg-emerald-50/20">{formatVND(row.cuoiKyGT)}</td>
                                                  
                                                  <td className="p-3 text-center"><span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold whitespace-nowrap">{row.nhanHang}</span></td>
                                              </tr>
                                          ))}
                                          {rawDetailedInventory.length === 0 && (
                                              <tr><td colSpan="12" className="p-10 text-center text-slate-500 italic">Không có dữ liệu. Vui lòng tải lên file "Tổng tồn kho chi tiết" để xem báo cáo này.</td></tr>
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  )}
               </div>
            )}

            {activeTab === 'admin' && appUser?.role === 'admin' && (
               <div className="animate-in fade-in duration-300">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                       <div>
                           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Shield className="text-indigo-600" size={24}/> Quản trị Hệ thống</h2>
                           <p className="text-sm text-slate-500 mt-1">Tạo, sửa và phân quyền cho các tài khoản truy cập vào Dashboard.</p>
                       </div>
                       <button onClick={() => { setEditingAppUser({ id: '', username: '', password: '', role: 'user', permissions: [], allowedTeams: [] }); setAdminModalError(''); setIsAppUserModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                          <UserPlus size={18} /> Tạo Tài Khoản
                       </button>
                   </div>

                   <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                       <table className="w-full text-left border-collapse min-w-[800px]">
                           <thead>
                               <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                                  <th className="p-4 font-semibold pl-6">Tài khoản</th>
                                  <th className="p-4 font-semibold text-center">Vai trò</th>
                                  <th className="p-4 font-semibold">Quyền truy cập & Thao tác</th>
                                  <th className="p-4 font-semibold text-right pr-6">Thao tác</th>
                               </tr>
                           </thead>
                           <tbody>
                               {appUsersList.map(u => (
                                   <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                       <td className="p-4 pl-6 font-bold text-slate-700 flex items-center gap-3">
                                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${u.role === 'admin' ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                                               {u.role === 'admin' ? <Shield size={14}/> : <User size={14}/>}
                                           </div>
                                           {u.username}
                                       </td>
                                       <td className="p-4 text-center">
                                           <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                                       </td>
                                       <td className="p-4 text-xs text-slate-500 font-medium">
                                           {u.role === 'admin' ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Toàn quyền hệ thống</span> : (
                                               <div className="flex flex-col gap-2">
                                                   <div className="flex flex-wrap gap-1.5">
                                                       {u.permissions?.includes('tab_finance') && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">Tài chính</span>}
                                                       {u.permissions?.includes('tab_team') && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">Đội nhóm</span>}
                                                       {u.permissions?.includes('tab_custom') && <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100">Theo dõi riêng</span>}
                                                       {u.permissions?.includes('tab_inventory') && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">Tồn kho</span>}
                                                       {u.permissions?.length === 0 && <span className="italic text-rose-500 font-bold flex items-center gap-1"><Clock size={12}/> Chờ duyệt</span>}
                                                   </div>
                                                   {/* Hiển thị quyền thao tác (Upload/Edit) */}
                                                   <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-1.5">
                                                       {u.permissions?.includes('action_upload_finance') && <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">⬆️ Up Tài Chính</span>}
                                                       {u.permissions?.includes('action_upload_inventory') && <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">⬆️ Up Tồn Kho</span>}
                                                       {u.permissions?.includes('action_manage_tasks') && <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">✏️ Sửa Công Việc</span>}
                                                   </div>

                                                   {u.permissions?.includes('sub_finance') && (
                                                       <span className="text-[10px] text-slate-500 mt-0.5">
                                                          <strong>Nhóm xem:</strong> {(u.allowedTeams || []).includes('All') ? 'Tất cả các nhóm' : ((u.allowedTeams || []).length > 0 ? (u.allowedTeams || []).join(', ') : 'Chưa chọn nhóm')}
                                                       </span>
                                                   )}
                                               </div>
                                           )}
                                       </td>
                                       <td className="p-4 text-right pr-6">
                                           <button onClick={() => { setEditingAppUser(u); setAdminModalError(''); setIsAppUserModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-2 rounded transition-colors" title="Sửa"><Edit size={16} /></button>
                                           <button onClick={() => handleDeleteAppUser(u)} className="text-slate-400 hover:text-rose-600 p-2 rounded transition-colors" title="Xóa"><Trash2 size={16} /></button>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>
            )}

            {activeTab === 'none' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-6">
                        <Shield size={48}/>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Chờ Cấp Quyền Truy Cập</h2>
                    <p className="text-slate-500 max-w-md mb-6">Tài khoản của bạn đã được tạo thành công, nhưng chưa được cấp quyền xem dữ liệu. Vui lòng liên hệ Quản trị viên (Admin) để được phân quyền.</p>
                </div>
            )}

         </div>
      </div>

      {isAppUserModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
               <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><UserCog className="text-indigo-600" size={20} /> {editingAppUser.id ? 'Sửa Tài Khoản' : 'Tạo Tài Khoản Mới'}</h3>
                  <button onClick={() => setIsAppUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
               </div>
               <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  {adminModalError && <p className="text-rose-500 text-xs font-bold mb-3">{adminModalError}</p>}
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Tên đăng nhập <span className="text-rose-500">*</span></label>
                          <input type="text" value={editingAppUser.username} onChange={e=>setEditingAppUser({...editingAppUser, username: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" placeholder="VD: nguyenvan_a" />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu <span className="text-rose-500">*</span></label>
                          <input type="text" value={editingAppUser.password} onChange={e=>setEditingAppUser({...editingAppUser, password: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" placeholder="••••••••" />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Vai trò hệ thống</label>
                          <select value={editingAppUser.role} onChange={e=>setEditingAppUser({...editingAppUser, role: e.target.value, permissions: e.target.value === 'admin' ? [] : editingAppUser.permissions})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 font-medium">
                              <option value="user">Người dùng cơ bản (User)</option>
                              <option value="admin">Quản trị viên (Admin)</option>
                          </select>
                      </div>

                      {editingAppUser.role === 'user' && (
                          <div className="pt-2 border-t border-slate-100">
                              <label className="block text-sm font-bold text-slate-800 mb-3">Phân quyền chức năng</label>
                              <div className="flex flex-col gap-4">
                                  <div className="flex flex-col gap-2.5">
                                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quyền Xem (View)</p>
                                      {[
                                          { id: 'tab_finance', label: '📊 Phân tích Tài chính', isSub: false },
                                          { id: 'tab_inventory', label: '📦 Quản trị Tồn kho', isSub: false },
                                          { id: 'tab_team', label: '👥 Quản trị Đội nhóm & Dự án', isSub: false },
                                          { id: 'sub_finance', label: '↳ Tài chính nhóm', isSub: true, parent: 'tab_team' },
                                          { id: 'sub_sales', label: '↳ Chương trình bán hàng', isSub: true, parent: 'tab_team' },
                                          { id: 'sub_overview', label: '↳ Tổng quan công việc', isSub: true, parent: 'tab_team' },
                                          { id: 'sub_task', label: '↳ Quản lý công việc', isSub: true, parent: 'tab_team' },
                                          { id: 'tab_custom', label: '👁️ Theo dõi Nhóm riêng', isSub: false }
                                      ].map(perm => {
                                          const isChecked = editingAppUser.permissions.includes(perm.id);
                                          const parentChecked = perm.parent ? editingAppUser.permissions.includes(perm.parent) : true;
                                          return (
                                              <label key={perm.id} className={`flex items-center gap-3 cursor-pointer ${perm.isSub ? 'ml-6' : ''} ${!parentChecked && perm.isSub ? 'opacity-40 pointer-events-none' : ''}`}>
                                                  <div onClick={() => {
                                                      if (!parentChecked && perm.isSub) return;
                                                      let newPerms = [...editingAppUser.permissions];
                                                      if (isChecked) {
                                                          newPerms = newPerms.filter(p => p !== perm.id);
                                                          if (!perm.isSub && perm.id === 'tab_team') newPerms = newPerms.filter(p => !['sub_finance', 'sub_sales', 'sub_overview', 'sub_task', 'action_manage_sales'].includes(p));
                                                          if (perm.id === 'sub_sales') newPerms = newPerms.filter(p => p !== 'action_manage_sales');
                                                          
                                                          if (perm.id === 'sub_finance' || perm.id === 'tab_team') {
                                                              setEditingAppUser({...editingAppUser, permissions: newPerms, allowedTeams: []});
                                                              return;
                                                          }
                                                      } else {
                                                          newPerms.push(perm.id);
                                                          if (!perm.isSub && perm.id === 'tab_team') newPerms.push('sub_finance', 'sub_sales', 'sub_overview', 'sub_task');
                                                      }
                                                      setEditingAppUser({...editingAppUser, permissions: newPerms});
                                                  }}>
                                                      {isChecked ? <CheckSquare className="text-indigo-600" size={20}/> : <Square className="text-slate-300" size={20}/>}
                                                  </div>
                                                  <span className={`text-sm ${perm.isSub ? 'text-slate-600' : 'font-semibold text-slate-800'}`}>{perm.label}</span>
                                              </label>
                                          )
                                      })}
                                  </div>

                                  <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
                                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quyền Thao tác (Edit / Upload)</p>
                                      {[
                                          { id: 'action_upload_finance', label: '⬆️ Tải lên Kế hoạch & Thực tế (Tài chính)', dependsOn: 'tab_finance' },
                                          { id: 'action_upload_inventory', label: '⬆️ Tải lên dữ liệu Tồn kho', dependsOn: 'tab_inventory' },
                                          { id: 'action_manage_sales', label: '✏️ Thêm/Sửa/Xóa Chương trình bán hàng', dependsOn: 'sub_sales' },
                                          { id: 'action_manage_tasks', label: '✏️ Thêm/Xóa Công việc dự án', dependsOn: 'sub_task' }
                                      ].map(perm => {
                                          const isChecked = editingAppUser.permissions.includes(perm.id);
                                          const hasDependency = editingAppUser.permissions.includes(perm.dependsOn);
                                          return (
                                              <label key={perm.id} className={`flex items-center gap-3 cursor-pointer ${!hasDependency ? 'opacity-40 pointer-events-none' : ''}`}>
                                                  <div onClick={() => {
                                                      if (!hasDependency) return;
                                                      let newPerms = [...editingAppUser.permissions];
                                                      if (isChecked) {
                                                          newPerms = newPerms.filter(p => p !== perm.id);
                                                      } else {
                                                          newPerms.push(perm.id);
                                                      }
                                                      setEditingAppUser({...editingAppUser, permissions: newPerms});
                                                  }}>
                                                      {isChecked ? <CheckSquare className="text-emerald-600" size={20}/> : <Square className="text-slate-300" size={20}/>}
                                                  </div>
                                                  <span className="text-sm font-semibold text-slate-700">{perm.label}</span>
                                              </label>
                                          )
                                      })}
                                      <p className="text-[10px] text-slate-400 mt-1 italic">* Các quyền thao tác chỉ có thể được chọn khi người dùng đã có quyền Xem tương ứng.</p>
                                  </div>
                              </div>

                              {/* QUYỀN XEM NHÓM */}
                              {(editingAppUser.permissions.includes('sub_finance') || editingAppUser.permissions.includes('sub_sales')) && (
                                  <div className="mt-3 pt-3 border-t border-slate-100 animate-in slide-in-from-top-2">
                                      <label className="block text-sm font-bold text-slate-800 mb-2">Quyền xem nhóm</label>
                                      <div className="flex flex-col gap-2 ml-6">
                                          <label className="flex items-center gap-3 cursor-pointer">
                                              <div onClick={() => {
                                                  if ((editingAppUser.allowedTeams || []).includes('All')) {
                                                      setEditingAppUser({...editingAppUser, allowedTeams: []});
                                                  } else {
                                                      setEditingAppUser({...editingAppUser, allowedTeams: ['All']});
                                                  }
                                              }}>
                                                  {(editingAppUser.allowedTeams || []).includes('All') ? <CheckSquare className="text-indigo-600" size={18}/> : <Square className="text-slate-300" size={18}/>}
                                              </div>
                                              <span className="text-sm font-bold text-slate-800">Tất cả các nhóm</span>
                                          </label>
                                          
                                          {dynamicTeams.length > 0 && dynamicTeams.map(team => (
                                              <label key={team} className={`flex items-center gap-3 cursor-pointer ml-6 ${(editingAppUser.allowedTeams || []).includes('All') ? 'opacity-40 pointer-events-none' : ''}`}>
                                                  <div onClick={() => {
                                                      let newTeams = [...(editingAppUser.allowedTeams || [])];
                                                      if (newTeams.includes(team)) {
                                                          newTeams = newTeams.filter(t => t !== team);
                                                      } else {
                                                          newTeams.push(team);
                                                      }
                                                      setEditingAppUser({...editingAppUser, allowedTeams: newTeams});
                                                  }}>
                                                      {((editingAppUser.allowedTeams || []).includes(team) || (editingAppUser.allowedTeams || []).includes('All')) ? <CheckSquare className="text-indigo-600" size={18}/> : <Square className="text-slate-300" size={18}/>}
                                                  </div>
                                                  <span className="text-sm font-semibold text-slate-600">{team}</span>
                                              </label>
                                          ))}
                                          {dynamicTeams.length === 0 && <p className="text-xs text-slate-400 italic ml-6">Chưa có dữ liệu nhóm trên hệ thống.</p>}
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
               </div>
               <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                  <button onClick={() => setIsAppUserModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200">Hủy</button>
                  <button onClick={handleSaveAppUser} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700">Lưu tài khoản</button>
               </div>
            </div>
         </div>
      )}

      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                <div>
                   <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="text-indigo-600" size={24} /> Báo Cáo Tổng Hợp
                   </h3>
                   <p className="text-sm text-slate-500 mt-1">Tự động tạo dựa trên dữ liệu đang xem</p>
                </div>
                <button onClick={() => setIsReportModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                   <X size={20} />
                </button>
             </div>
             
             <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                <textarea 
                   readOnly
                   value={generatedReport}
                   className="w-full h-[400px] p-4 bg-white border border-slate-200 rounded-xl font-mono text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none custom-scrollbar"
                />
             </div>

             <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
                <button onClick={() => setIsReportModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Đóng</button>
                <button 
                   onClick={handleCopyReport}
                   className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm'}`}
                >
                   {isCopied ? <Check size={18} /> : <Copy size={18} />} 
                   {isCopied ? 'Đã sao chép!' : 'Copy Báo Cáo'}
                </button>
             </div>
          </div>
        </div>
      )}
      
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Share2 className="text-emerald-600" size={20} /> Đã Tạo Mã Chia Sẻ</h3>
                <button onClick={() => setShareModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
             </div>
             <div className="p-6 text-center">
                <p className="text-sm text-slate-600 mb-4">Gửi mã này cho sếp hoặc đồng nghiệp. Họ có thể ấn nút <strong>"Mở bằng Mã"</strong> trên màn hình chính để xem báo cáo.</p>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg inline-block w-full"><span className="text-3xl font-black tracking-widest text-emerald-600">{generatedLink}</span></div>
             </div>
             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={copyShareLink} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${isCopied ? 'bg-emerald-500' : 'bg-emerald-600 shadow-sm'}`}>
                   {isCopied ? <Check size={16} /> : <Copy size={16} />} {isCopied ? 'Đã Copy Mã!' : 'Copy Mã'}
                </button>
             </div>
          </div>
        </div>
      )}

      {openCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
             <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Key className="text-indigo-600" size={20} /> Mở Báo Cáo</h3>
                <button onClick={() => { setOpenCodeModal(false); setCodeError(''); setShareCodeInput(''); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
             </div>
             <div className="p-6">
                <p className="text-sm text-slate-600 mb-4 text-center">Nhập mã báo cáo đã được chia sẻ cho bạn.</p>
                <input type="text" value={shareCodeInput} onChange={e => { setShareCodeInput(e.target.value.toUpperCase()); setCodeError(''); }} placeholder="VD: A1B2C3" maxLength={6} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-center text-2xl font-bold tracking-widest text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/50" />
                {codeError && <p className="text-rose-500 text-sm mt-3 text-center font-medium animate-in slide-in-from-top-2">{codeError}</p>}
             </div>
             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => { setOpenCodeModal(false); setCodeError(''); setShareCodeInput(''); }} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200">Hủy</button>
                <button onClick={() => handleLoadFromCode(shareCodeInput)} disabled={shareCodeInput.length < 6 || isProcessing} className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                   {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} {isProcessing ? 'Đang tải...' : 'Tải Dữ Liệu'}
                </button>
             </div>
          </div>
        </div>
      )}

      {isCustomGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <Settings className="text-indigo-600" size={20} /> 
                   {editingGroup.id ? 'Chỉnh sửa Nhóm Tùy Chỉnh' : 'Tạo Nhóm Tùy Chỉnh Mới'}
                </h3>
                <button onClick={() => setIsCustomGroupModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
             </div>
             <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                
                {groupModalError && (
                    <div className="absolute top-0 left-6 right-6 bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-sm font-bold border border-rose-200 z-10 flex items-center gap-2">
                        <AlertTriangle size={16}/> {groupModalError}
                    </div>
                )}

                <div className={`flex flex-col gap-5 border-r md:border-slate-100 md:pr-6 border-b md:border-b-0 pb-6 md:pb-0 ${groupModalError ? 'mt-8' : ''}`}>
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Tên nhóm <span className="text-rose-500">*</span></label>
                      <input type="text" value={editingGroup.name} onChange={e => setEditingGroup({...editingGroup, name: e.target.value})} placeholder="VD: Nhóm Chiến Dịch Mùa Hè..." className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" />
                   </div>
                   
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Tổng Mục tiêu Doanh thu (Không bắt buộc)</label>
                      <input type="number" value={editingGroup.target || ''} onChange={e => setEditingGroup({...editingGroup, target: Number(e.target.value)})} placeholder="Để trống nếu muốn tự tính tổng từ các mặt hàng..." className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" />
                      <p className="text-[10px] text-slate-500 mt-1">VD: 5000000000 (5 Tỷ). Nếu để trống, hệ thống sẽ cộng dồn mục tiêu từ các mặt hàng bên cạnh.</p>
                   </div>
                   
                   <div className="flex-1 flex flex-col">
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center justify-between">
                         Thành viên trong nhóm ({editingGroup.members.length})
                         {editingGroup.members.length > 0 && <button onClick={() => setEditingGroup({...editingGroup, members: []})} className="text-xs text-rose-500 hover:underline font-medium">Xóa tất cả</button>}
                      </label>
                      
                      <div className="flex gap-2 mb-3">
                         <input 
                            type="text" 
                            value={newMemberInput}
                            onChange={(e) => setNewMemberInput(e.target.value)}
                            onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomMember();
                               }
                            }}
                            placeholder="Nhập tên nhân sự và ấn Enter..." 
                            className="flex-1 bg-white border border-slate-200 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                         />
                         <button 
                            type="button" 
                            onClick={handleAddCustomMember}
                            disabled={!newMemberInput.trim()}
                            className="bg-slate-100 text-slate-700 font-semibold px-4 rounded-lg text-sm hover:bg-slate-200 disabled:opacity-50 transition-colors"
                         >
                            Thêm
                         </button>
                      </div>

                      <div className="flex flex-wrap gap-2 flex-1 min-h-[150px] content-start p-3 border border-slate-200 rounded-lg bg-slate-50/50 overflow-y-auto custom-scrollbar">
                         {editingGroup.members.map(member => (
                            <div key={member} className="bg-white border border-slate-200 text-slate-700 shadow-sm px-2.5 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium animate-in zoom-in duration-200">
                               <span className="truncate max-w-[150px]">{member}</span>
                               <button 
                                  type="button" 
                                  onClick={() => handleRemoveCustomMember(member)} 
                                  className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-0.5 rounded transition-colors"
                               >
                                  <X size={14}/>
                               </button>
                            </div>
                         ))}
                         {editingGroup.members.length === 0 && <p className="w-full text-center text-xs text-slate-400 italic mt-4">Chưa có thành viên nào. Hãy nhập tên để theo dõi.</p>}
                      </div>
                   </div>
                </div>

                <div className={`flex flex-col h-full ${groupModalError ? 'mt-8' : ''}`}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center justify-between">
                         Giao chỉ tiêu theo Mặt hàng
                         <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">Không bắt buộc</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">Nhập số tiền mục tiêu (VNĐ) cho các mặt hàng bạn muốn theo dõi. Các mặt hàng bỏ trống sẽ được bỏ qua.</p>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 border border-slate-200 rounded-lg bg-slate-50/50 p-2">
                        <div className="flex items-center gap-3 py-2 border-b-2 border-slate-300 mb-2 bg-indigo-50/50 rounded px-2">
                            <span className="text-xs font-bold text-indigo-800 w-1/3 truncate" title="Các sản phẩm còn lại">Các sản phẩm còn lại</span>
                            <input 
                                type="number" 
                                value={editingGroup.productTargets?.['Các sản phẩm còn lại'] || ''}
                                onChange={(e) => {
                                    const newTargets = { ...(editingGroup.productTargets || {}) };
                                    if (e.target.value === '' || Number(e.target.value) === 0) {
                                        delete newTargets['Các sản phẩm còn lại'];
                                    } else {
                                        newTargets['Các sản phẩm còn lại'] = Number(e.target.value);
                                    }
                                    setEditingGroup({ ...editingGroup, productTargets: newTargets });
                                }}
                                placeholder="Gộp chung KH còn lại..."
                                className="flex-1 bg-white border border-indigo-200 rounded p-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-right font-semibold text-indigo-700"
                            />
                        </div>

                        {PRODUCT_CATEGORIES.map(cat => {
                            const val = editingGroup.productTargets?.[cat] || '';
                            return (
                                <div key={cat} className="flex items-center gap-3 py-1.5 border-b border-dashed border-slate-200 last:border-0 group hover:bg-slate-100 rounded px-2 transition-colors">
                                    <span className="text-xs font-medium text-slate-700 w-1/3 truncate" title={cat}>{cat}</span>
                                    <input 
                                        type="number" 
                                        value={val}
                                        onChange={(e) => {
                                            const newTargets = { ...(editingGroup.productTargets || {}) };
                                            if (e.target.value === '' || Number(e.target.value) === 0) {
                                                delete newTargets[cat];
                                            } else {
                                                newTargets[cat] = Number(e.target.value);
                                            }
                                            setEditingGroup({ ...editingGroup, productTargets: newTargets });
                                        }}
                                        placeholder="Chỉ tiêu VNĐ..."
                                        className="flex-1 bg-white border border-slate-300 rounded p-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-right"
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
             </div>
             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                {editingGroup.id ? (
                   <button 
                      onClick={() => { 
                          setConfirmAction({
                              isOpen: true,
                              title: 'Xóa Nhóm',
                              message: `Bạn có chắc chắn muốn xóa nhóm "${editingGroup.name}"? Dữ liệu theo dõi của nhóm sẽ bị mất.`,
                              type: 'danger',
                              onConfirm: () => {
                                  setCustomGroups(customGroups.filter(g => g.id !== editingGroup.id)); 
                                  setIsCustomGroupModalOpen(false); 
                                  setConfirmAction({ isOpen: false });
                              },
                              hideCancel: false,
                              confirmText: 'Xác nhận'
                          });
                      }} 
                      className="px-4 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-100 flex items-center gap-2"
                   >
                      <Trash2 size={16}/> Xóa nhóm
                   </button>
                ) : <div></div>}
                <div className="flex gap-3">
                   <button onClick={() => setIsCustomGroupModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">Hủy</button>
                   <button 
                      onClick={() => {
                         if (!editingGroup.name.trim()) { setGroupModalError('Vui lòng nhập tên nhóm!'); return; }
                         setGroupModalError('');
                         if (editingGroup.id) {
                            setCustomGroups(customGroups.map(g => g.id === editingGroup.id ? editingGroup : g));
                         } else {
                            setCustomGroups([...customGroups, { ...editingGroup, id: 'CG' + Date.now() }]);
                         }
                         setIsCustomGroupModalOpen(false);
                      }} 
                      className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-2"
                   >
                      <Check size={16}/> Lưu nhóm
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamFinanceCard({ team, isViewOnly }) {
   const [isExpanded, setIsExpanded] = useState(false);
   const percentTeamPlan = team.teamPlan > 0 ? ((team.totalDthu / team.teamPlan) * 100).toFixed(1) : 0;

   return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all relative">
         <div className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`} onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center gap-4 flex-1">
               <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shrink-0">{team.name.charAt(0)}</div>
               <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                     {team.name} 
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                     <span className="text-emerald-600 font-semibold" title="Thực tế đạt được">Thực: {formatVND(team.totalDthu)}</span>
                     <span className="text-slate-400 hidden sm:inline">|</span>
                     <span className="text-slate-500" title="Kế hoạch được giao">KH: {formatVND(team.teamPlan)}</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-4 justify-between md:justify-end w-full md:w-auto">
               <div className="flex flex-col items-start md:items-end">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Tiến độ KH</span>
                  <span className={`font-bold text-lg ${percentTeamPlan >= 100 ? 'text-emerald-500' : 'text-blue-600'}`}>{percentTeamPlan}%</span>
               </div>
               <div className="p-2 bg-slate-100 rounded-full text-slate-500">
                  {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
               </div>
            </div>
         </div>

         {isExpanded && (
            <div className="border-t border-slate-200 bg-slate-50/50 p-4 md:p-5 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-200">
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col h-64">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Cơ cấu Doanh thu theo Thành viên</p>
                     {team.membersArray.some(m => m.dthu > 0) ? (
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie 
                               data={team.membersArray.filter(m => m.dthu > 0)} 
                               cx="50%" cy="50%" 
                               innerRadius={50} outerRadius={80} 
                               paddingAngle={2} dataKey="dthu" nameKey="name"
                             >
                               {team.membersArray.filter(m => m.dthu > 0).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                             </Pie>
                             <Tooltip 
                               content={({ active, payload }) => {
                                 if (active && payload && payload.length) {
                                   const p = payload[0];
                                   const percent = team.totalDthu > 0 ? ((p.value / team.totalDthu) * 100).toFixed(1) : 0;
                                   return (
                                     <div className="bg-white p-2.5 rounded-lg shadow-md border border-slate-100 text-xs text-center z-50">
                                       <p className="font-bold text-slate-700 mb-1">{p.name}</p>
                                       <p className="font-bold text-sm" style={{color: p.payload.fill}}>{formatVND(p.value)}</p>
                                       <p className="text-[10px] text-slate-500 mt-0.5">Tỷ trọng: {percent}%</p>
                                     </div>
                                   )
                                 }
                                 return null;
                               }}
                             />
                             <Legend verticalAlign="bottom" content={(props) => {
                                 const { payload } = props;
                                 return (
                                   <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 overflow-y-auto max-h-16 pt-2 custom-scrollbar">
                                     {payload.map((entry, index) => (
                                       <li key={`item-${index}`} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                         <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                                         <span className="truncate max-w-[80px]" title={entry.value}>{entry.value}</span>
                                       </li>
                                     ))}
                                   </ul>
                                 );
                             }}/>
                           </PieChart>
                         </ResponsiveContainer>
                     ) : (
                         <div className="flex-1 flex items-center justify-center text-sm text-slate-400 italic">Chưa có dữ liệu</div>
                     )}
                  </div>

                  <div className="flex flex-col h-64 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-4">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Top Sản phẩm đóng góp</p>
                     {(() => {
                         const groupProducts = {};
                         team.membersArray.forEach(m => {
                             Object.keys(m.byProduct).forEach(sp => {
                                 if (!groupProducts[sp]) groupProducts[sp] = 0;
                                 groupProducts[sp] += m.byProduct[sp].dthu;
                             });
                         });
                         const sortedProducts = Object.entries(groupProducts)
                             .filter(([_, val]) => val > 0)
                             .map(([name, dthu]) => ({ name, dthu }))
                             .sort((a,b) => b.dthu - a.dthu)
                             .slice(0, 7); 

                         if (sortedProducts.length === 0) return <div className="flex-1 flex items-center justify-center text-sm text-slate-400 italic">Chưa có dữ liệu</div>;

                         return (
                             <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={sortedProducts} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                 <XAxis type="number" hide />
                                 <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} width={80} />
                                 <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const p = payload[0];
                                        return (
                                          <div className="bg-white p-2 rounded shadow-md border border-slate-100 text-xs">
                                            <p className="font-bold text-slate-700 mb-1">{p.payload.name}</p>
                                            <p className="font-bold text-indigo-600">{formatVND(p.value)}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }} 
                                 />
                                 <Bar dataKey="dthu" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={20}>
                                    <LabelList dataKey="dthu" position="right" formatter={(val) => {
                                        if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'Tỷ';
                                        if (val >= 1000000) return (val / 1000000).toFixed(0) + 'Tr';
                                        return val;
                                    }} style={{fontSize: '9px', fill: '#64748b', fontWeight: 'bold'}} />
                                 </Bar>
                               </BarChart>
                             </ResponsiveContainer>
                         )
                     })()}
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                   <p className="text-sm font-bold text-slate-700 px-1 border-b border-slate-200 pb-2">Chi tiết từng nhân sự:</p>
                   {team.membersArray.map((m, midx) => {
                      const percentContrib = team.totalDthu > 0 ? ((m.dthu / team.totalDthu) * 100).toFixed(1) : 0;
                      const products = Object.keys(m.byProduct).map(sp => ({
                         name: sp, ...m.byProduct[sp]
                      })).filter(p => p.dthu > 0 || p.doanhSo > 0).sort((a,b) => b.dthu - a.dthu);

                      return (
                         <div key={midx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                               <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">{m.name.charAt(0)}</div>
                                  <span className="font-bold text-slate-700 text-base">{m.name}</span>
                               </div>
                               <div className="flex items-center gap-4 text-sm w-full sm:w-auto justify-between sm:justify-end">
                                  <div className="flex flex-col sm:items-end">
                                     <span className="text-[10px] text-slate-400 uppercase font-semibold">Doanh số bán</span>
                                     <span className="font-semibold text-slate-600">{formatVND(m.doanhSo)}</span>
                                  </div>
                                  <div className="flex flex-col sm:items-end">
                                     <span className="text-[10px] text-slate-400 uppercase font-semibold">Doanh thu CVAT</span>
                                     <span className="font-bold text-emerald-600">{formatVND(m.dthu)} <span className="text-xs text-indigo-500 font-medium ml-1">({percentContrib}%)</span></span>
                                  </div>
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                               {products.map((p, pidx) => {
                                  const teamPlanForSP = team.planByProduct[p.name] || 0;
                                  const pPercent = teamPlanForSP > 0 ? ((p.dthu / teamPlanForSP) * 100).toFixed(1) : 0;
                                  
                                  return (
                                     <div key={pidx} className="flex justify-between items-center text-sm py-1 border-b border-dashed border-slate-100 last:border-0">
                                        <span className="text-slate-600 font-medium flex items-center gap-1.5 truncate">
                                           <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span> {p.name}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                           <span className="font-semibold text-slate-700">{formatVND(p.dthu)}</span>
                                           {teamPlanForSP > 0 && (
                                              <span className="text-xs font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded" title={`Đóng góp ${pPercent}% vào Kế hoạch ${formatVND(teamPlanForSP)} của nhóm mặt hàng này`}>
                                                 {pPercent}%
                                              </span>
                                           )}
                                        </div>
                                     </div>
                                  )
                               })}
                            </div>
                         </div>
                      );
                   })}
               </div>
            </div>
         )}
      </div>
   );
}

function TaskStatusBadge({ status }) {
   const colorMap = { 'Bắt đầu triển khai': 'bg-blue-100 text-blue-700 border-blue-200', 'Đang chạy': 'bg-amber-100 text-amber-700 border-amber-200', 'Đã hoàn thành': 'bg-emerald-100 text-emerald-700 border-emerald-200', 'Hủy': 'bg-slate-100 text-slate-600 border-slate-200' };
   return <span className={`text-[11px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${colorMap[status] || colorMap['Hủy']}`}>{status}</span>;
}

function TaskPriorityBadge({ priority }) {
   const colorMap = { 'Cao': 'bg-rose-100 text-rose-700 border-rose-200', 'Trung bình': 'bg-orange-100 text-orange-700 border-orange-200', 'Thấp': 'bg-blue-100 text-blue-700 border-blue-200' };
   return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${colorMap[priority]}`}>{priority}</span>;
}

function SalesProgramCard({ program, canEdit, onUpdate, onDelete }) {
  const statusStyles = {
    'Chưa triển khai': 'bg-slate-100 text-slate-700 border-slate-200',
    'Đang triển khai': 'bg-amber-100 text-amber-700 border-amber-200',
    'Đã hoàn thành': 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };
  const metrics = [
    { label: 'DT chưa VAT', actualKey: 'actualRevenue', targetKey: 'targetRevenue', color: 'bg-blue-500' },
    { label: 'Doanh số', actualKey: 'actualSales', targetKey: 'targetSales', color: 'bg-indigo-500' },
    { label: 'Số lượng', actualKey: 'actualQty', targetKey: 'targetQty', color: 'bg-emerald-500', quantity: true }
  ];

  return (
    <article className="border border-slate-200 rounded-xl p-5 flex flex-col gap-4 bg-white">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h4 className="font-bold text-slate-800 text-lg">{program.name}</h4>
          <p className="text-sm text-indigo-600 font-semibold mt-1">{program.goal}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Calendar size={12}/> Kỳ áp dụng: {program.period === 'All' || !program.period ? 'Toàn năm 2026' : program.period}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusStyles[program.deploymentStatus] || statusStyles['Chưa triển khai']}`}>{program.deploymentStatus}</span>
          {canEdit && <button onClick={() => onDelete(program.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>}
        </div>
      </div>

      <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-lg p-3">{program.details}</p>

      <div className="h-56 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
        <p className="text-xs font-bold text-slate-600 mb-2">DT chưa VAT: Kế hoạch và thực tế theo mặt hàng</p>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={program.productStats || []} margin={{top: 5, right: 5, left: 5, bottom: 5}}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
            <XAxis dataKey="product" tick={{fontSize: 9}} interval={0} angle={-15} textAnchor="end" height={48}/>
            <YAxis hide/>
            <Tooltip formatter={(value) => formatVND(value)}/>
            <Legend wrapperStyle={{fontSize: '10px'}}/>
            <Bar dataKey="targetRevenue" name="Kế hoạch" fill="#94a3b8" radius={[4,4,0,0]}/>
            <Bar dataKey="actualRevenue" name="Thực tế" fill="#3b82f6" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3">
        {metrics.map(metric => {
          const actual = Number(program[metric.actualKey]) || 0;
          const target = Number(program[metric.targetKey]) || 0;
          const percent = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
          return (
            <div key={metric.actualKey}>
              <div className="flex justify-between items-center gap-3 mb-1.5">
                <span className="text-xs font-semibold text-slate-600">{metric.label}</span>
                <span className="text-xs text-slate-500">{metric.quantity ? formatVND(actual) : formatVND(actual)} / {formatVND(target)} ({percent.toFixed(1)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`${metric.color} h-full rounded-full`} style={{width: `${percent}%`}}></div></div>
            </div>
          );
        })}
      </div>

      <div className="border border-slate-100 rounded-xl overflow-x-auto">
        <table className="w-full text-xs min-w-[620px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="p-2 text-left">Mặt hàng</th><th className="p-2 text-right">DT/KH</th><th className="p-2 text-right">DS/KH</th><th className="p-2 text-right">SL/KH</th></tr>
          </thead>
          <tbody>
            {(program.productStats || []).map(item => (
              <tr key={item.product} className="border-t border-slate-100">
                <td className="p-2 font-semibold text-slate-700">{item.product}</td>
                <td className="p-2 text-right text-slate-600">{formatVND(item.actualRevenue)} / {formatVND(item.targetRevenue)}</td>
                <td className="p-2 text-right text-slate-600">{formatVND(item.actualSales)} / {formatVND(item.targetSales)}</td>
                <td className="p-2 text-right text-slate-600">{formatVND(item.actualQty)} / {formatVND(item.targetQty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-3 border-t border-slate-100">
        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5"><span>Mức độ hoàn thành công việc</span><span>{Number(program.completion) || 0}%</span></div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-violet-500 rounded-full" style={{width: `${Math.min(100, Number(program.completion) || 0)}%`}}></div></div>
        {canEdit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            <input type="number" min="0" max="100" value={program.completion || ''} onChange={e=>onUpdate(program.id, {completion: Math.min(100, Math.max(0, Number(e.target.value)))})} placeholder="% hoàn thành" className="border border-slate-200 bg-slate-50 rounded-lg p-2 text-xs outline-none focus:border-indigo-400"/>
            <select value={program.deploymentStatus} onChange={e=>onUpdate(program.id, {deploymentStatus: e.target.value})} className="border border-slate-200 bg-slate-50 rounded-lg p-2 text-xs outline-none focus:border-indigo-400">
              <option value="Chưa triển khai">Chưa triển khai</option>
              <option value="Đang triển khai">Đang triển khai</option>
              <option value="Đã hoàn thành">Đã hoàn thành</option>
            </select>
          </div>
        )}
      </div>
    </article>
  );
}

function KPICard({ title, value, subValue, icon, valueColor = "text-slate-800" }) {
  return (
    <div className="bg-white p-5 lg:p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
          <h3 className={`text-2xl font-bold truncate ${valueColor}`} title={value}>{value}</h3>
          {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
        <div className="p-3 bg-slate-50 rounded-lg shrink-0">{icon}</div>
      </div>
    </div>
  );
}

function ExpandableQtyCard({ title, totalQty, breakdown, icon }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasBreakdown = breakdown && breakdown.length > 0;
  return (
    <div className={`bg-white p-5 lg:p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full ${hasBreakdown ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`} onClick={() => hasBreakdown && setIsExpanded(!isExpanded)}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1.5">{title}{hasBreakdown && (isExpanded ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>)}</p>
          <h3 className="text-2xl font-bold truncate text-slate-800" title={totalQty.toLocaleString()}>{totalQty.toLocaleString()}</h3>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg shrink-0">{icon}</div>
      </div>
      {isExpanded && hasBreakdown && (
         <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2 max-h-36 overflow-y-auto pr-2 custom-scrollbar">
            {breakdown.map((item, idx) => (
               <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 truncate mr-2" title={item.name}>{item.name}</span>
                  <span className="font-semibold text-slate-800">{item.qty.toLocaleString()}</span>
               </div>
            ))}
         </div>
      )}
    </div>
  );
}

function ProgressBarCard({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubItems = data.subItemsArray && data.subItemsArray.length > 0;
  const isOverTarget = data.percent >= 100;
  const isOnTrack = data.percent >= 35; 
  let barColor = "bg-blue-500";
  if (isOverTarget) barColor = "bg-emerald-500"; else if (!isOnTrack) barColor = "bg-amber-500";

  return (
    <div className={`flex flex-col group p-3 -m-3 rounded-xl transition-colors ${hasSubItems ? 'hover:bg-slate-50' : ''}`}>
      <div className={hasSubItems ? 'cursor-pointer' : ''} onClick={() => hasSubItems && setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-end mb-1.5">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            {data.name} 
            {isOverTarget && <CheckCircle2 size={14} className="text-emerald-500"/>}
            {hasSubItems && (isExpanded ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>)}
          </span>
          <span className={`font-bold text-sm ${isOverTarget ? 'text-emerald-600' : 'text-blue-600'}`}>{data.percent.toFixed(2)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden relative">
          <div className={`${barColor} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min(data.percent, 100)}%` }}></div>
          {data.percent > 100 && <div className="absolute top-0 bottom-0 right-0 w-1 bg-emerald-700"></div>}
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span className="truncate mr-2">Thực: <strong className="text-slate-700">{formatVND(data.actual)}</strong></span>
          <span className="truncate text-right">KH: {formatVND(data.plan)}</span>
        </div>
      </div>

      {isExpanded && hasSubItems && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Chi tiết doanh thu Thực tế:</p>
          {data.subItemsArray.map((sub, idx) => {
            const subPercent = data.plan > 0 ? ((sub.actual / data.plan) * 100).toFixed(2) : 0;
            return (
              <div key={idx} className="flex justify-between items-center pl-1">
                <span className="text-slate-600 text-xs flex items-center gap-2 truncate pr-2" title={sub.name}>
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span><span className="truncate">{sub.name}</span>
                </span>
                <span className="font-medium text-slate-700 text-xs shrink-0 text-right">
                  {formatVND(sub.actual)}
                  <span className="text-indigo-600 ml-1 font-semibold" title={`Đóng góp ${subPercent}% vào kế hoạch`}>({subPercent}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CustomLegend = ({ payload }) => (
  <ul className="flex flex-wrap justify-center gap-x-3 gap-y-2 overflow-y-auto max-h-24 pt-2 px-2 custom-scrollbar">
    {payload.map((entry, index) => (
      <li key={`item-${index}`} className="flex items-center gap-1.5 text-xs text-slate-600">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
        <span className="truncate max-w-[100px]" title={entry.value}>{entry.value}</span>
      </li>
    ))}
  </ul>
);

const TrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-100">
        <p className="font-bold text-slate-800 mb-2 border-b pb-2">{label}</p>
        {payload.filter(p => p.value !== null).map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-slate-600 text-sm">{entry.name}:</span>
            <span className="font-bold text-slate-800">{formatVND(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percent = total > 0 ? ((data.value / total) * 100).toFixed(2) : 0;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 min-w-[160px]">
        <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.fill }}></div>
           <p className="font-bold text-slate-700">{data.name}</p>
        </div>
        <div>
          <p className="font-bold text-slate-800 text-base">{formatVND(data.value)}</p>
          <p className="text-sm text-slate-500 mt-1">
            Tỷ trọng: <strong className="text-blue-600">{percent}%</strong>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

function CustomGroupProductItem({ prod }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const prodPercent = prod.target > 0 ? (prod.doanhSo / prod.target) * 100 : 0;
  const isProdOverTarget = prodPercent >= 100;
  let prodBarColor = "bg-blue-500";
  if (isProdOverTarget) prodBarColor = "bg-emerald-500"; else if (prodPercent < 35) prodBarColor = "bg-amber-500";

  const hasSubItems = prod.subItemsArray && prod.subItemsArray.length > 0 && !(prod.subItemsArray.length === 1 && prod.subItemsArray[0].name === prod.name);

  return (
    <div className={`flex flex-col gap-1 ${hasSubItems ? 'group/item p-1.5 -m-1.5 rounded-lg hover:bg-slate-50 transition-colors' : ''}`}>
      <div className={`flex justify-between items-center text-xs ${hasSubItems ? 'cursor-pointer' : ''}`} onClick={() => hasSubItems && setIsExpanded(!isExpanded)}>
        <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
          <span className="truncate" title={prod.name}>{prod.name}</span>
          {hasSubItems && (isExpanded ? <ChevronUp size={14} className="text-slate-400 shrink-0"/> : <ChevronDown size={14} className="text-slate-400 shrink-0"/>)}
        </span>
        <span className={`font-bold ${isProdOverTarget ? 'text-emerald-600' : 'text-blue-600'}`}>{prod.target > 0 ? `${prodPercent.toFixed(1)}%` : '-'}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`${prodBarColor} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(prodPercent, 100)}%` }}></div>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>DS: <span className="font-semibold text-slate-700">{formatVND(prod.doanhSo)}</span> <span className="ml-1 opacity-70">| SL: {prod.qty} | CVAT: {formatVND(prod.dthu)}</span></span>
        <span>KH: {formatVND(prod.target)}</span>
      </div>

      {isExpanded && hasSubItems && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex flex-col gap-1.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Chi tiết các mặt hàng:</p>
          {prod.subItemsArray.map((sub, idx) => {
            const percentOfTotal = prod.doanhSo > 0 ? ((sub.doanhSo / prod.doanhSo) * 100).toFixed(1) : 0;
            return (
              <div key={idx} className="flex flex-col gap-0.5 text-[10px] pl-1 mb-1">
                <div className="flex justify-between items-center">
                    <span className="text-slate-600 flex items-center gap-1.5 truncate pr-2" title={sub.name}>
                      <span className="w-1 h-1 rounded-full bg-indigo-300 shrink-0"></span>
                      <span className="truncate">{sub.name}</span>
                    </span>
                    <span className="font-medium text-slate-700 shrink-0 text-right">
                      {formatVND(sub.doanhSo)} 
                      <span className="text-indigo-500 font-semibold ml-1">({percentOfTotal}%)</span>
                    </span>
                </div>
                <div className="text-[9px] text-slate-400 pl-2.5">SL: {sub.qty} | CVAT: {formatVND(sub.dthu)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
