import React from 'react';
import { makeStyles, tokens, Text } from '@fluentui/react-components';
import { Chart, ChartDataFormat, ChartType } from '@fluentui/react-charting';
import dayjs from 'dayjs';
import type { ServiceStatus } from '../types/monitor';

const useStyles = makeStyles({
  root: { width: '100%', height: '320px' },
  empty: {
    padding: '60px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

interface Props {
  history: ServiceStatus[];
}

const StatusTimeline: React.FC<Props> = ({ history }) => {
  const styles = useStyles();

  if (history.length === 0) {
    return <div className={styles.empty}><Text>暂无历史数据</Text></div>;
  }

  const points = [...history].reverse().map((st) => ({
    time: dayjs(st.polled_at).format('HH:mm:ss'),
    response_ms: Number(st.response_time_ms.toFixed(1)),
    utilization: Number(st.utilization_percent.toFixed(1)),
  }));

  const chartData: ChartDataFormat[] = [
    {
      chartTitle: 'Response (ms)',
      data: points.map((p) => ({
        x: p.time,
        y: p.response_ms,
      })),
      color: tokens.colorBrandForeground1,
    } as ChartDataFormat,
    {
      chartTitle: 'Utilization (%)',
      data: points.map((p) => ({
        x: p.time,
        y: p.utilization,
      })),
      color: tokens.colorPaletteYellowForeground1,
    } as ChartDataFormat,
  ];

  return (
    <div className={styles.root}>
      <Chart
        chartType={ChartType.LineChart}
        data={chartData}
        hideLegend={false}
        height={300}
        margins={{ top: 16, right: 24, bottom: 36, left: 48 }}
        enableReflow
      />
    </div>
  );
};

export default StatusTimeline;
