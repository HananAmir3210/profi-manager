import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DollarSign, FileText, Users, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalInvoices: number;
  totalClients: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalClients: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Get total clients
        const { count: clientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get total invoices
        const { count: invoiceCount } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get paid invoices
        const { count: paidCount } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'paid');

        // Get unpaid invoices
        const { count: unpaidCount } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['draft', 'sent', 'overdue']);

        // Get total revenue
        const { data: paidInvoices } = await supabase
          .from('invoices')
          .select('total_amount')
          .eq('user_id', user.id)
          .eq('status', 'paid');

        const totalRevenue = paidInvoices?.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0;

        setStats({
          totalInvoices: invoiceCount || 0,
          totalClients: clientCount || 0,
          paidInvoices: paidCount || 0,
          unpaidInvoices: unpaidCount || 0,
          totalRevenue,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: 'From paid invoices',
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices.toString(),
      icon: FileText,
      description: `${stats.paidInvoices} paid, ${stats.unpaidInvoices} unpaid`,
    },
    {
      title: 'Total Clients',
      value: stats.totalClients.toString(),
      icon: Users,
      description: 'Active clients',
    },
    {
      title: 'Payment Rate',
      value: stats.totalInvoices > 0 ? `${Math.round((stats.paidInvoices / stats.totalInvoices) * 100)}%` : '0%',
      icon: TrendingUp,
      description: 'Invoices paid on time',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your business.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Get started by adding your first client or creating an invoice.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;