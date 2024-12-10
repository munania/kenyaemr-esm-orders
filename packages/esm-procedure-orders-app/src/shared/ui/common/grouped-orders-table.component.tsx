import React, { useMemo, useState } from 'react';
import styles from './grouped-orders-table.scss';
import { useTranslation } from 'react-i18next';
import { usePagination } from '@openmrs/esm-framework';
import { GroupedOrdersTableProps } from './grouped-procedure-types';
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableExpandRow,
  TableExpandedRow,
  TableExpandHeader,
  TableCell,
  DataTable,
  TableContainer,
  TableToolbarSearch,
  TableToolbarContent,
  TableToolbar,
  Layer,
  Dropdown,
} from '@carbon/react';
import ListOrderDetails from './list-order-details.component';
import { EmptyState } from '@openmrs/esm-patient-common-lib';
import { useSearchGroupedResults } from '../../../hooks/useSearchGroupedResults';
import TransitionLatestQueueEntryButton from '../../../procedures-ordered/transition-patient-new-queue/transition-latest-queue-entry-button.component';
import { OrdersDateRangePicker } from './orders-date-range-picker';

const GroupedOrdersTable: React.FC<GroupedOrdersTableProps> = (props) => {
  const workListEntries = props.orders;
  const { t } = useTranslation();
  const [currentPageSize] = useState<number>(10);
  const [searchString, setSearchString] = useState<string>('');

  function groupOrdersById(orders) {
    if (orders && orders.length > 0) {
      const groupedOrders = orders.reduce((acc, item) => {
        if (!acc[item.patient.uuid]) {
          acc[item.patient.uuid] = [];
        }
        acc[item.patient.uuid].push(item);
        return acc;
      }, {});

      // Convert the result to an array of objects with patientId and orders
      return Object.keys(groupedOrders).map((patientId) => ({
        patientId: patientId,
        orders: groupedOrders[patientId],
      }));
    } else {
      return [];
    }
  }
  const groupedOrdersByPatient = groupOrdersById(workListEntries);
  const searchResults = useSearchGroupedResults(groupedOrdersByPatient, searchString);
  const { goTo, results: paginatedResults, currentPage } = usePagination(searchResults, currentPageSize);

  const rowData = useMemo(() => {
    return paginatedResults.map((patient) => ({
      id: patient.patientId,
      patientName: patient.orders[0].patient?.display?.split('-')[1],
      orders: patient.orders,
      totalOrders: patient.orders?.length,
      fulfillerStatus: patient.orders[0].fulfillerStatus,
      action:
        patient.orders[0].fulfillerStatus === 'COMPLETED' ? (
          <TransitionLatestQueueEntryButton patientUuid={patient.patientId} />
        ) : null,
    }));
  }, [paginatedResults]);

  const tableColumns = useMemo(() => {
    const baseColumns = [
      { key: 'patientName', header: t('patientName', 'Patient Name') },
      { key: 'totalOrders', header: t('totalOrders', 'Total Orders') },
    ];

    const showActionColumn = workListEntries.some((order) => order.fulfillerStatus === 'COMPLETED');

    return showActionColumn ? [...baseColumns, { key: 'action', header: t('action', 'Action') }] : baseColumns;
  }, [workListEntries, t]);

  return (
    <DataTable size="md" useZebraStyle rows={rowData} headers={tableColumns}>
      {({ rows, headers, getHeaderProps, getRowProps, getExpandedRowProps, getTableProps, getTableContainerProps }) => (
        <TableContainer
          className={styles.dataTable}
          title={props.title}
          description={t('groupedOrdersTableDescription', 'Orders grouped by patient, expand row to view all orders')}
          {...getTableContainerProps()}>
          <TableToolbar>
            <TableToolbarContent>
              <Layer className={styles.toolbarItem}>
                <OrdersDateRangePicker />
              </Layer>
              <Layer className={styles.toolbarItem}>
                <TableToolbarSearch
                  expanded
                  persistent={true}
                  onChange={(event) => setSearchString(event.target.value)}
                  placeholder={t('searchByPatientName', 'Search by patient name')}
                  size="sm"
                />
              </Layer>
            </TableToolbarContent>
          </TableToolbar>
          {rows.length <= 0 && (
            <EmptyState headerTitle={props.title} displayText={t('noOrdersDescription', 'No orders')} />
          )}
          {rows.length > 0 && (
            <Table {...getTableProps()} aria-label="sample table">
              <TableHead>
                <TableRow>
                  <TableExpandHeader aria-label="expand row" />
                  {headers.map((header, i) => (
                    <TableHeader
                      key={i}
                      {...getHeaderProps({
                        header,
                      })}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableExpandRow
                      {...getRowProps({
                        row,
                      })}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableExpandRow>
                    <TableExpandedRow
                      colSpan={headers.length + 1}
                      className="demo-expanded-td"
                      {...getExpandedRowProps({
                        row,
                      })}>
                      <ListOrderDetails
                        actions={props.actions}
                        groupedOrders={groupedOrdersByPatient.find((item) => item.patientId === row.id)}
                        showActions={props.showActions}
                        showOrderType={props.showOrderType}
                        showStartButton={props.showStartButton}
                        showStatus={props.showStatus}
                      />
                    </TableExpandedRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}
    </DataTable>
  );
};

export default GroupedOrdersTable;
