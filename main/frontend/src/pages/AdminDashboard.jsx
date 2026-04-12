import React, { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
    Users,
    Recycle,
    Calendar,
    BarChart3,
    TrendingUp,
    MapPin,
    MessageSquare,
    Settings,
    RefreshCw,
    X,
    Clock,
    UserCheck,
    Navigation,
    Eye
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'react-toastify'
// Ensure this path is correct based on your file structure
import { adminAPI, legacyAdminAPI } from '../services/api'

const AdminDashboard = () => {
    const navigate = useNavigate()
    // 1. ALL HOOKS MUST BE DECLARED AT THE TOP
    const location = useLocation();

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isMobile, setIsMobile] = useState(false)
    const [activeTab, setActiveTab] = useState('dashboard')
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // Stats & Data State
    const [stats, setStats] = useState([])
    const [recentActivities, setRecentActivities] = useState([])
    const [wasteCollectionData, setWasteCollectionData] = useState([])
    const [selectedPeriod, setSelectedPeriod] = useState('Month')
    const [platformActivity, setPlatformActivity] = useState({
        userDistribution: { ngos: 0, volunteers: 0, total: 0 },
        engagement: { dailyActive: 0, newToday: 0, growthRate: 0 },
        systemHealth: { uptime: '99.9%', responseTime: '245ms', status: 'Healthy' }
    })

    // User Management State
    const [users, setUsers] = useState([])
    const [usersPagination, setUsersPagination] = useState({ currentPage: 1, totalPages: 1, totalUsers: 0 })
    const [userFilters, setUserFilters] = useState({ role: '', status: '', search: '' })
    const [selectedUser, setSelectedUser] = useState(null)
    const [showUserModal, setShowUserModal] = useState(false)
    const [showBlockModal, setShowBlockModal] = useState(false)
    const [blockReason, setBlockReason] = useState('')

    // Current User
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    // 2. Define Tabs Array
    const tabs = [
        { id: 'dashboard', label: 'Overview', icon: BarChart3, to: '/admin' },
        { id: 'users', label: 'Users', icon: Users, to: '/admin/users' },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp, to: '/admin/analytics' },
    ];

    // 3. EFFECT: Sync activeTab with URL
    useEffect(() => {
        const parts = location.pathname.split('/').filter(Boolean);
        if (parts[1]) {
            setActiveTab(parts[1]);
        } else {
            setActiveTab('dashboard');
        }
    }, [location.pathname]);

    // 4. EFFECT: Mobile check
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // --- API Functions ---

    const fetchWasteCollectionData = async (period = 'month') => {
        try {
            const response = await legacyAdminAPI.getWasteCollectionReport(period.toLowerCase())
            if (response.success && response.data) {
                setWasteCollectionData(response.data)
            } else {
                setWasteCollectionData([])
            }
        } catch (error) {
            console.error('Error fetching waste collection data:', error)
            setWasteCollectionData([])
        }
    }

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)
            const analyticsData = await adminAPI.getAnalytics()

            if (analyticsData.success) {
                const { overview, platformGrowth, recentActivities: recentActs } = analyticsData.data

                setStats([
                    { title: 'Total Users', value: overview.totalUsers.toLocaleString(), change: platformGrowth?.growthRate ? `+${platformGrowth.growthRate}%` : '+0%', icon: Users },
                    { title: 'NGOs', value: overview.totalNGOs.toLocaleString(), change: '+5%', icon: Recycle },
                    { title: 'Volunteers', value: overview.totalVolunteers.toLocaleString(), change: '+8%', icon: Calendar },
                    { title: 'Events', value: overview.totalEvents.toString(), change: '+12%', icon: MapPin }
                ])

                setPlatformActivity(prev => ({
                    ...prev,
                    userDistribution: { ngos: overview.totalNGOs, volunteers: overview.totalVolunteers, total: overview.totalUsers },
                    engagement: { dailyActive: platformGrowth?.totalUsers || overview.totalUsers, newToday: platformGrowth?.newUsers || 0, growthRate: parseFloat(platformGrowth?.growthRate) || 0 }
                }))

                setRecentActivities(recentActs || [])
                await fetchWasteCollectionData(selectedPeriod)
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err)
            // If the interceptor handles the redirect, we just want to stop the loading spinner
            // We don't necessarily need to set a UI error if the page is about to refresh to /login
            if (err.response && err.response.status === 401) {
                // Let the api.js interceptor handle the redirect
                return;
            }

            // Don't set error string here if you want to allow partial loading, 
            // or ensure this error doesn't block the UI entirely if possible.
            // For now, keeping your logic:
            if (err.response?.status === 401) {
                setError("Unauthorized. Please login again.");
            } else {
                setError('Failed to load dashboard data');
            }
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async (page = 1) => {
        try {
            // Don't set main loading to true here to avoid full page flicker, 
            // or create a separate loading state for the table
            const params = { page, limit: 20, ...userFilters }
            const response = await adminAPI.getAllUsers(params)
            if (response.success) {
                setUsers(response.data.users)
                setUsersPagination(response.data.pagination)
            }
        } catch (err) {
            console.error('Error fetching users:', err)
        }
    }

    // --- Action Handlers ---

    const handleExportReport = async () => {
        try {
            toast.info('Generating admin report... Please wait.');

            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Extract values safely
            const totalUsers = stats.find(s => s.title === 'Total Users')?.value || 0;
            const totalNGOs = stats.find(s => s.title === 'NGOs')?.value || 0;
            const totalVols = stats.find(s => s.title === 'Volunteers')?.value || 0;
            const totalEvents = stats.find(s => s.title === 'Events')?.value || 0;

            const reportContent = `
                <html>
                <head>
                    <title>WasteZero Admin Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
                        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
                        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9; }
                        .stat-value { font-size: 24px; font-weight: bold; color: #10b981; }
                        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
                        .section { margin: 30px 0; }
                        .section h2 { color: #10b981; border-bottom: 1px solid #10b981; padding-bottom: 10px; }
                        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🌍 WasteZero Platform Admin Report</h1>
                        <p>Generated on ${currentDate}</p>
                    </div>
                    
                    <div class="section">
                        <h2>📊 Platform Overview</h2>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">${totalUsers}</div>
                                <div class="stat-label">Total Users</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${totalVols}</div>
                                <div class="stat-label">Total Volunteers</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${totalNGOs}</div>
                                <div class="stat-label">Total NGOs</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${totalEvents}</div>
                                <div class="stat-label">Events Hosted</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h2>⚙️ System Health</h2>
                        <ul>
                            <li><strong>Uptime:</strong> ${platformActivity.systemHealth.uptime}</li>
                            <li><strong>Response Time:</strong> ${platformActivity.systemHealth.responseTime}</li>
                            <li><strong>Status:</strong> ${platformActivity.systemHealth.status}</li>
                        </ul>
                    </div>
                    
                    <div class="footer">
                        <p>Automatically generated by WasteZero Admin Panel</p>
                    </div>
                </body>
                </html>
            `;

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
            }

            printWindow.document.write(reportContent);
            printWindow.document.close();

            setTimeout(() => {
                printWindow.focus();
                printWindow.print();

                setTimeout(() => {
                    printWindow.close();
                }, 100);
            }, 500);

            toast.success('📄 Admin report generated successfully!');
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to generate report. Please try again.');
        }
    }

    const handleToggleUserBlock = async (userId, isBlocking) => {
        try {
            const reasonToSend = isBlocking ? blockReason : ''
            const response = await adminAPI.toggleUserBlock(userId, reasonToSend)

            if (response.success) {
                setUsers(prev => prev.map(user =>
                    user._id === userId
                        ? { ...user, isBlocked: response.data.isBlocked, blockReason: response.data.blockReason }
                        : user
                ))
                setShowBlockModal(false)
                setBlockReason('')
                setSelectedUser(null)
                toast.success(response.message)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update user status')
        }
    }

    const handleStartChat = async (userId) => {
        navigate('/admin/message')
    }

    const handleUserFilterChange = (field, value) => {
        setUserFilters(prev => ({ ...prev, [field]: value }))
    }

    const handlePeriodChange = async (period) => {
        setSelectedPeriod(period)
        await fetchWasteCollectionData(period)
    }

    // 5. EFFECT: Initial Data Fetch
    useEffect(() => {
        fetchDashboardData()
        fetchUsers(1)
    }, [])

    // 6. EFFECT: Debounce User Filters
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers(1)
        }, 500)
        return () => clearTimeout(timeoutId)
    }, [userFilters])

    // ------------------------------------------------------------------
    // CONDITIONAL RETURNS MUST BE AFTER ALL HOOKS
    // ------------------------------------------------------------------
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-[#344e41] text-white px-4 py-2 rounded-lg hover:bg-[#588157] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* ... Your Header Code ... */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">WasteZero Admin</h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={handleExportReport} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 md:top-14 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-1 py-3">
                        {tabs.map(tab => (
                            <NavLink
                                key={tab.id}
                                to={tab.to}
                                // Remove onClick calling setActiveTab, let the useEffect handle it via URL
                                className={({ isActive }) =>
                                    `flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-shrink-0 focus:outline-none ${isActive
                                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`
                                }
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* 
                   If activeTab is dashboard, show stats. 
                   If activeTab is users, show users.
                   Or rely on <Outlet /> if you are using nested routing.
                   
                   Since you have both <Outlet/> and manual conditional rendering in your original code,
                   I will keep your manual rendering logic for safety:
                */}

                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {/* ... Dashboard Tab Content (Graphs, Stats, etc) ... */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {stats.map((stat, index) => (
                                <div key={index} className="bg-white p-6 rounded-2xl border shadow-sm">
                                    <p>{stat.title}</p>
                                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                                </div>
                            ))}
                        </div>
                        {/* Add your other Dashboard UI components here */}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-8">
                        {/* ... Users Tab Content ... */}
                        {/* Pass users state to your table here */}
                        <div className="bg-white p-6 rounded-lg border">
                            <h2 className="text-xl font-bold mb-4">User Management</h2>
                            {/* ... Your Users Table ... */}
                            <div>{users.length} Users found</div>
                        </div>
                    </div>
                )}

                {/* To support nested routes like /admin/analytics */}
                <Outlet />
            </div>

            {/* Block Modal */}
            {showBlockModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold">Block User</h3>
                        <textarea
                            value={blockReason}
                            onChange={e => setBlockReason(e.target.value)}
                            className="w-full border p-2 mt-2"
                            placeholder="Reason..."
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowBlockModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={() => handleToggleUserBlock(selectedUser._id, true)} className="px-4 py-2 bg-red-600 text-white rounded">Block</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminDashboard
