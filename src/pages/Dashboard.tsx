import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  FileText, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  totalInvoices: number;
  totalClients: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'invoice_paid' | 'invoice_created' | 'expense_added' | 'client_added';
  description: string;
  amount?: number;
  timestamp: string;
  status?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalClients: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    revenueGrowth: 15.2,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Get stats in parallel
        const [
          { count: clientCount },
          { count: invoiceCount },
          { count: paidCount },
          { count: unpaidCount },
          { data: paidInvoices },
          { data: expenses },
          { data: recentInvoices },
          { data: recentExpenses }
        ] = await Promise.all([
          supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'paid'),
          supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['draft', 'sent', 'overdue']),
          supabase.from('invoices').select('total_amount, created_at').eq('user_id', user.id).eq('status', 'paid'),
          supabase.from('expenses').select('amount, created_at').eq('user_id', user.id),
          supabase.from('invoices').select('*, clients(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
        ]);

        const totalRevenue = paidInvoices?.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0;
        const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
        
        // Calculate monthly revenue
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = paidInvoices?.filter(invoice => {
          const invoiceDate = new Date(invoice.created_at);
          return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
        }).reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0;

        setStats({
          totalInvoices: invoiceCount || 0,
          totalClients: clientCount || 0,
          paidInvoices: paidCount || 0,
          unpaidInvoices: unpaidCount || 0,
          totalRevenue,
          monthlyRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          revenueGrowth: 15.2, // Mock growth percentage
        });

        // Build recent activity
        const activities: RecentActivity[] = [];
        
        recentInvoices?.forEach(invoice => {
          activities.push({
            id: invoice.id,
            type: invoice.status === 'paid' ? 'invoice_paid' : 'invoice_created',
            description: `Invoice #${invoice.invoice_number} ${invoice.status === 'paid' ? 'paid by' : 'created for'} ${invoice.clients?.name}`,
            amount: invoice.total_amount,
            timestamp: invoice.created_at,
            status: invoice.status
          });
        });

        recentExpenses?.forEach(expense => {
          activities.push({
            id: expense.id,
            type: 'expense_added',
            description: `Expense logged: ${expense.description}`,
            amount: expense.amount,
            timestamp: expense.created_at
          });
        });

        // Sort by timestamp
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivity(activities.slice(0, 8));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const kpiCards = [
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      change: `+${stats.revenueGrowth}%`,
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'vs last month',
    },
    {
      title: 'Unpaid Invoices',
      value: stats.unpaidInvoices.toString(),
      change: `$${(stats.totalRevenue * 0.3).toLocaleString()}`,
      changeType: 'neutral' as const,
      icon: FileText,
      description: 'pending payment',
    },
    {
      title: 'Total Expenses',
      value: `$${stats.totalExpenses.toLocaleString()}`,
      change: '-8.2%',
      changeType: 'positive' as const,
      icon: TrendingDown,
      description: 'vs last month',
    },
    {
      title: 'Net Profit',
      value: `$${stats.netProfit.toLocaleString()}`,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      description: 'profit margin',
    },
  ];

  const quickActions = [
    { label: 'Create Invoice', icon: FileText, action: () => navigate('/invoices'), color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'Add Expense', icon: TrendingDown, action: () => navigate('/expenses'), color: 'bg-red-500 hover:bg-red-600' },
    { label: 'Add Client', icon: Users, action: () => navigate('/clients'), color: 'bg-green-500 hover:bg-green-600' },
    { label: 'Download Report', icon: Download, action: () => {}, color: 'bg-purple-500 hover:bg-purple-600' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invoice_paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invoice_created': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'expense_added': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'client_added': return <Users className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants = {
      paid: 'status-paid',
      pending: 'status-pending',
      sent: 'status-pending',
      overdue: 'status-overdue',
      draft: 'status-pending'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'status-pending'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <Card key={card.title} className={`kpi-card animate-slide-up`} style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">{card.value}</div>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center text-sm ${
                  card.changeType === 'positive' ? 'text-green-600' : 
                  card.changeType === 'negative' ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {card.changeType === 'positive' ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : card.changeType === 'negative' ? (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  ) : null}
                  {card.change}
                </div>
                <span className="text-xs text-muted-foreground">{card.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <Card className="chart-container">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Revenue Overview</span>
                <Badge variant="outline">Last 6 months</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Revenue chart visualization</p>
                  <p className="text-sm">Integration with chart library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Breakdown */}
          <Card className="chart-container">
            <CardHeader>
              <CardTitle>Expenses Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Expenses pie chart</p>
                  <p className="text-sm">Integration with chart library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  onClick={action.action}
                  className={`w-full justify-start ${action.color} text-white hover:shadow-lg transition-all duration-200`}
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {activity.amount && (
                          <span className="text-sm font-semibold text-green-600">
                            ${activity.amount.toLocaleString()}
                          </span>
                        )}
                        {activity.status && getStatusBadge(activity.status)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;