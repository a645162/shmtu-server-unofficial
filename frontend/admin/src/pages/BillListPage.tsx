import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Label,
  Select,
  Badge,
  Subtitle1,
  Body1,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableCellLayout,
} from '@fluentui/react-components';
import { billApi } from '../api/client';
import type { BillOriginal, BillQueryParams } from '../types';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3,
  },
});

const BillListPage: React.FC = () => {
  const styles = useStyles();
  const [bills, setBills] = useState<BillOriginal[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterIsNew, setFilterIsNew] = useState<string>('all');

  const fetchBills = async (pageNum: number = 0) => {
    setLoading(true);
    try {
      const params: BillQueryParams = {
        page: pageNum,
        size: 20,
      };
      if (filterCategory) params.category = filterCategory;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterIsNew === 'new') params.isNew = true;
      else if (filterIsNew === 'old') params.isNew = false;

      const data = await billApi.list(params);
      const pageData = data as { content: BillOriginal[]; totalPages: number };
      setBills(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setPage(pageNum);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(0);
  }, []);

  const handleSearch = () => fetchBills(0);

  if (loading) return <Body1>加载中...</Body1>;

  return (
    <div>
      <Subtitle1 style={{ marginBottom: '16px' }}>账单列表</Subtitle1>

      <div className={styles.filters}>
        <div className={styles.filterItem}>
          <Label>分类</Label>
          <Input
            value={filterCategory}
            onChange={(_, data) => setFilterCategory(data.value)}
            placeholder="如: 食堂"
          />
        </div>
        <div className={styles.filterItem}>
          <Label>开始日期</Label>
          <Input
            type="date"
            value={filterStartDate}
            onChange={(_, data) => setFilterStartDate(data.value)}
          />
        </div>
        <div className={styles.filterItem}>
          <Label>结束日期</Label>
          <Input
            type="date"
            value={filterEndDate}
            onChange={(_, data) => setFilterEndDate(data.value)}
          />
        </div>
        <div className={styles.filterItem}>
          <Label>状态</Label>
          <Select
            value={filterIsNew}
            onChange={(_, data) => setFilterIsNew(data.value)}
          >
            <option value="all">全部</option>
            <option value="new">新账单</option>
            <option value="old">已读</option>
          </Select>
        </div>
        <Button appearance="primary" onClick={handleSearch}>查询</Button>
      </div>

      {bills.length === 0 ? (
        <div className={styles.empty}>
          <Text>暂无账单记录</Text>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>交易号</TableHeaderCell>
                <TableHeaderCell>日期</TableHeaderCell>
                <TableHeaderCell>类型</TableHeaderCell>
                <TableHeaderCell>对象</TableHeaderCell>
                <TableHeaderCell>金额</TableHeaderCell>
                <TableHeaderCell>分类</TableHeaderCell>
                <TableHeaderCell>位置</TableHeaderCell>
                <TableHeaderCell>状态</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell><TableCellLayout>{bill.transactionNo}</TableCellLayout></TableCell>
                  <TableCell><TableCellLayout>{bill.billDate || '-'}</TableCellLayout></TableCell>
                  <TableCell><TableCellLayout>{bill.billType || '-'}</TableCellLayout></TableCell>
                  <TableCell><TableCellLayout>{bill.targetUser || '-'}</TableCellLayout></TableCell>
                  <TableCell><TableCellLayout>{bill.money?.toFixed(2) ?? '-'}</TableCellLayout></TableCell>
                  <TableCell><TableCellLayout>{bill.category || '-'}</TableCellLayout></TableCell>
                  <TableCell><TableCellLayout>{bill.position || '-'}</TableCellLayout></TableCell>
                  <TableCell>
                    <TableCellLayout>
                      {bill.isNew ? (
                        <Badge appearance="filled" color="warning" size="small">新</Badge>
                      ) : (
                        <Badge appearance="ghost" size="small">已读</Badge>
                      )}
                    </TableCellLayout>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className={styles.pagination}>
            <Button
              appearance="subtle"
              disabled={page <= 0}
              onClick={() => fetchBills(page - 1)}
            >
              上一页
            </Button>
            <Text size={200}>
              第 {page + 1} / {totalPages} 页
            </Text>
            <Button
              appearance="subtle"
              disabled={page >= totalPages - 1}
              onClick={() => fetchBills(page + 1)}
            >
              下一页
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default BillListPage;
