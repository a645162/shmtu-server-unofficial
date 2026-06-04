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
import { Chart, ChartDataFormat, ChartType } from '@fluentui/react-charting';
import { billApi } from '../../api/client';
import type { BillStats, CategoryStat, MonthlyStat } from '../../types';

const useStyles = makeStyles({
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: { padding: '20px' },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
  },
  statLabel: { color: tokens.colorNeutralForeground3, marginTop: '4px' },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  chartCard: { padding: '20px' },
  chartHost: { height: '350px', width: '100%' },
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

  const monthlyData = (stats.monthlyStats || []).map((s: MonthlyStat) => ({
    month: s.month,
    amount: s.amount,
    count: s.count,
  }));

  const pieChartData: ChartDataFormat[] = [
    {
      chartTitle: 'Category',
      data: categoryData.map((c) => ({ x: c.name, y: c.value, legend: c.name })),
    } as ChartDataFormat,
  ];

  const lineChartData: ChartDataFormat[] = [
    {
      chartTitle: '金额',
      data: monthlyData.map((m) => ({ x: m.month, y: m.amount, legend: '金额' })),
      color: tokens.colorBrandForeground1,
    } as ChartDataFormat,
    {
      chartTitle: '笔数',
      data: monthlyData.map((m) => ({ x: m.month, y: m.count, legend: '笔数' })),
      color: tokens.colorBrandForeground2,
    } as ChartDataFormat,
  ];

  return (
    <div>
      <Subtitle1 style={{ marginBottom: '16px' }}>账单统计</Subtitle1>

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

      <div className={styles.chartGrid}>
        <Card className={styles.chartCard}>
          <Subtitle2 style={{ marginBottom: '12px' }}>分类消费饼图</Subtitle2>
          {categoryData.length === 0 ? (
            <Text>暂无分类数据</Text>
          ) : (
            <div className={styles.chartHost}>
              <Chart
                chartType={ChartType.PieChart}
                data={pieChartData}
                hideLegend={false}
                height={340}
                enableReflow
              />
            </div>
          )}
        </Card>

        <Card className={styles.chartCard}>
          <Subtitle2 style={{ marginBottom: '12px' }}>月度消费趋势</Subtitle2>
          {monthlyData.length === 0 ? (
            <Text>暂无月度数据</Text>
          ) : (
            <div className={styles.chartHost}>
              <Chart
                chartType={ChartType.LineChart}
                data={lineChartData}
                hideLegend={false}
                height={340}
                enableReflow
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BillStatsPage;
