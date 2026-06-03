import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Card,
  Subtitle1,
  Subtitle2,
  Body1,
} from '@fluentui/react-components';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { billApi } from '../api/client';
import type { BillStats, CategoryStat, MonthlyStat } from '../types';

const COLORS = ['#2b71be', '#387ec6', '#4d8bcd', '#6298d4', '#77a5db', '#8cb2e2', '#a1bfe9', '#1f4d82'];

const useStyles = makeStyles({
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    padding: '20px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
  },
  statLabel: {
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  chartCard: {
    padding: '20px',
  },
});

const BillStatsPage: React.FC = () => {
  const styles = useStyles();
  const [stats, setStats] = useState<BillStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await billApi.stats();
        setStats(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Body1>加载中...</Body1>;
  if (!stats) return <Body1>暂无统计数据</Body1>;

  const categoryData: { name: string; value: number }[] = (stats.categoryStats || []).map(
    (s: CategoryStat) => ({ name: s.category || '未知', value: s.amount })
  );

  const monthlyData: { month: string; amount: number; count: number }[] = (stats.monthlyStats || []).map(
    (s: MonthlyStat) => ({ month: s.month, amount: s.amount, count: s.count })
  );

  return (
    <div>
      <Subtitle1 style={{ marginBottom: '16px' }}>账单统计</Subtitle1>

      {/* Summary Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats.count}</div>
          <div className={styles.statLabel}>总笔数</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalMoney?.toFixed(2) ?? '0.00'}</div>
          <div className={styles.statLabel}>总金额</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats.newCount}</div>
          <div className={styles.statLabel}>新账单</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalAmount?.toFixed(2) ?? '0.00'}</div>
          <div className={styles.statLabel}>总交易额</div>
        </Card>
      </div>

      {/* Charts */}
      <div className={styles.chartGrid}>
        <Card className={styles.chartCard}>
          <Subtitle2 style={{ marginBottom: '12px' }}>分类消费饼图</Subtitle2>
          {categoryData.length === 0 ? (
            <Text>暂无分类数据</Text>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className={styles.chartCard}>
          <Subtitle2 style={{ marginBottom: '12px' }}>月度消费趋势</Subtitle2>
          {monthlyData.length === 0 ? (
            <Text>暂无月度数据</Text>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" name="金额" stroke="#2b71be" strokeWidth={2} />
                <Line type="monotone" dataKey="count" name="笔数" stroke="#387ec6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BillStatsPage;
